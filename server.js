const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MongoDB ====================
mongoose.connect('mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb')
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });

// ==================== Middleware ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ==================== SESSION — THE ONLY ONE THAT WORKS EVERYWHERE ====================
app.use(session({
  secret: 'student-manager-2025-secret-key',
  name: 'sid',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,     // 24 hours
    httpOnly: true,
    secure: process.env.RENDER === 'true',  // ← TRUE only on Render.com
    sameSite: 'lax'
  }
}));

// ==================== Models ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== Auth ====================
const isAuth = (req, res, next) => {
  if (req.session.username) return next();
  res.redirect('/login');
};

// ==================== Create Admin ====================
async function createAdmin() {
  try {
    if (!await User.findOne({ username: 'admin' })) {
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', password: hash });
      console.log('Default admin created: admin / admin123');
    }
  } catch (e) { console.error('Admin create error:', e); }
}
createAdmin();

// ==================== Routes ====================
app.get('/', (req, res) => req.session.username ? res.redirect('/students') : res.redirect('/login'));

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    req.session.regenerate(() => {
      req.session.username = username;
      res.redirect('/students');
    });
  } catch (e) {
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

// Forgot Password
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
  res.render('set-new-password', { username, error: null, success: 'Password changed! You can now login.' });
});

// ==================== CRUD ====================
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

// ==================== API ====================
app.get('/api/students', async (req, res) => res.json(await Student.find()));
app.post('/api/students', async (req, res) => {
  try { res.status(201).json(await Student.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// ==================== Start ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Student Manager RUNNING!');
  console.log(`Local:  http://localhost:${PORT}`);
  console.log(`Render: https://s381-kvzy.onrender.com`);
});
