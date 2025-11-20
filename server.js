const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 1. MongoDB ====================
mongoose.connect('mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// ==================== 2. Middleware ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ==================== 3. SUPER SIMPLE SESSION (NO secure, NO regenerate) ====================
app.use(require('express-session')({
  secret: 'simple-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }   // 24 hours, secure: false → works everywhere
}));

// ==================== 4. Models ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== 5. Create admin if not exist ====================
User.findOne({ username: 'admin' }).then(user => {
  if (!user) {
    bcrypt.hash('admin123', 10).then(hash => {
      new User({ username: 'admin', password: hash }).save();
      console.log('Admin created: admin / admin123');
    });
  }
});

// ==================== 6. Auth middleware ====================
const isAuth = (req, res, next) => {
  if (req.session && req.session.loggedin) return next();
  res.redirect('/login');
};

// ==================== 7. Routes ====================
app.get('/', (req, res) => res.redirect(req.session.loggedin ? '/students' : '/login'));

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      req.session.loggedin = true;
      req.session.username = req.body.username;
      return res.redirect('/students');
    }
    res.render('login', { error: 'Wrong username or password' });
  } catch (e) {
    res.render('login', { error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/session', (req, res) => {
  res.render('session', { 
    user: req.session.loggedin ? { username: req.session.username } : null 
  });
});

// Forgot password (kept simple)
app.get('/forgot-password', (req, res) => res.render('forgot-password', { error: null }));
app.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.render('forgot-password', { error: 'Not found' });
  res.render('set-new-password', { username: req.body.username, error: null, success: null });
});
app.post('/set-new-password', async (req, res) => {
  if (req.body.password !== req.body.confirm) {
    return res.render('set-new-password', { username: req.body.username, error: 'Not match', success: null });
  }
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.updateOne({ username: req.body.username }, { password: hash });
  res.render('set-new-password', { username: req.body.username, error: null, success: 'Password changed!' });
});

// ==================== 8. CRUD ====================
app.get('/students', isAuth, async (req, res) => {
  const students = await Student.find();
  res.render('index', { students, username: req.session.username || 'User' });
});

app.get('/students/new', isAuth, (req, res) => res.render('new'));
app.post('/students', isAuth, async (req, res) => {
  await Student.create(req.body);
  res.redirect('/students');
});

app.get('/students/:id/edit', isAuth, async (req, res) => {
  const student = await Student.findById(req.params.id);
  res.render('edit', { student });
});

app.put('/students/:id', isAuth, async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/students');
});

app.delete('/students/:id', isAuth, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/students');
});

// ==================== 9. API ====================
app.get('/api/students', async (req, res) => res.json(await Student.find()));
app.post('/api/students', async (req, res) => {
  try { res.json(await Student.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ==================== 10. Start ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server is running!');
  console.log('Local → http://localhost:3000');
  console.log('Render → https://s381-kvzy.onrender.com');
});
