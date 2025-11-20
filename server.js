const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MongoDB Connection (Clean & Modern) ====================
mongoose.connect('mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb')
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ==================== Middleware ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ==================== Session (Works on localhost AND Render) ====================
app.use(session({
  secret: 'student-manager-2025-secret-key',
  name: 'sid',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    httpOnly: true,
    secure: !!process.env.PORT,   // true on Render (HTTPS), false on localhost
    sameSite: 'lax'
  }
}));

// ==================== Models ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== Auth Middleware ====================
const isAuth = (req, res, next) => {
  if (req.session.username) return next();
  res.redirect('/login');
};

// ==================== Create Default Admin ====================
async function createAdmin() {
  try {
    const exists = await User.findOne({ username: 'admin' });
    if (!exists) {
      const hash = await bcrypt.hash('admin123', 10);
      await new User({ username: 'admin', password: hash }).save();
      console.log('Default admin created → username: admin | password: admin123');
    }
  } catch (err) {
    console.error('Failed to create admin:', err);
  }
}
createAdmin();

// ==================== Routes ====================
app.get('/', (req, res) => {
  req.session.username ? res.redirect('/students') : res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    req.session.regenerate(err => {
      if (err) return res.render('login', { error: 'Login failed' });
      req.session.username = username;
      res.redirect('/students');
    });
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/session', (req, res) => {
  res.render('session', { 
    user: req.session.username ? { username: req.session.username } : null 
  });
});

// Forgot Password Routes
app.get('/forgot-password', (req, res) => res.render('forgot-password', { error: null }));
app.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.render('forgot-password', { error: 'User not found' });
  res.render('set-new-password', { username: req.body.username, error: null, success: null });
});
app.post('/set-new-password', async (req, res) => {
  const { username, password, confirm } = req.body;
  if (password !== confirm) return res.render('set-new-password', { username, error: 'Passwords do not match', success: null });
  if (password.length < 5) return res.render('set-new-password', { username, error: 'Password too short', success: null });

  const hash = await bcrypt.hash(password, 10);
  await User.updateOne({ username }, { password: hash });
  res.render('set-new-password', { username, error: null, success: 'Password updated! You can now login.' });
});

// ==================== CRUD Routes ====================
app.get('/students', isAuth, async (req, res) => {
  const students = await Student.find();
  res.render('index', { students, username: req.session.username, query: {} });
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

// ==================== REST API ====================
app.get('/api/students', async (req, res) => res.json(await Student.find()));
app.post('/api/students', async (req, res) => {
  try { res.status(201).json(await Student.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Student Manager is RUNNING!');
  console.log(`Local → http://localhost:${PORT}`);
  console.log(`Render → https://s381-kvzy.onrender.com`);
});
