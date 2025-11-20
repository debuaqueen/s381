const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MONGODB CONNECTION ====================
const mongoURI = 'mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb?retryWrites=true&w=majority';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Atlas Connected Successfully!'))
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

// ==================== MIDDLEWARE ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session with secure cookie settings
app.use(session({
  secret: 'student-manager-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    httpOnly: true,
    secure: true,                 // HTTPS on Render
    sameSite: 'lax'
  }
}));

// ==================== MODELS ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== AUTH MIDDLEWARE ====================
const isAuthenticated = (req, res, next) => {
  if (req.session.username) return next();
  res.redirect('/login');
};

// ==================== CREATE DEFAULT ADMIN ACCOUNT ====================
async function createDefaultAdmin() {
  const admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashed });
    console.log('Default admin created: admin / admin123');
  }
}
createDefaultAdmin();

// ==================== ROUTES ====================

// Home - redirect
app.get('/', (req, res) => {
  req.session.username ? res.redirect('/students') : res.redirect('/login');
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    req.session.username = username;
    res.redirect('/students');
  } catch (err) {
    res.render('login', { error: 'Server error' });
  }
});

// Reset Password to Default
app.get('/reset-password', async (req, res) => {
  try {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.findOneAndUpdate(
      { username: 'admin' },
      { password: hashed },
      { upsert: true }
    );
    res.render('reset-done');
  } catch (err) {
    res.status(500).send('Reset failed');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Session Demo Page (Bonus!)
app.get('/session', (req, res) => {
  res.render('session', {
    user: req.session.username ? { username: req.session.username } : null
  });
});

// ==================== CRUD ROUTES (Protected) ====================
app.get('/students', isAuthenticated, async (req, res) => {
  let query = {};
  if (req.query.name) query.name = { $regex: req.query.name, $options: 'i' };
  if (req.query.major) query.major = { $regex: req.query.major, $options: 'i' };
  if (req.query.minAge || req.query.maxAge) {
    query.age = {};
    if (req.query.minAge) query.age.$gte = Number(req.query.minAge);
    if (req.query.maxAge) query.age.$lte = Number(req.query.maxAge);
  }
  const students = await Student.find(query);
  res.render('index', {
    students,
    query: req.query,
    username: req.session.username
  });
});

app.get('/students/new', isAuthenticated, (req, res) => res.render('new'));
app.post('/students', isAuthenticated, async (req, res) => {
  await Student.create(req.body);
  res.redirect('/students');
});

app.get('/students/:id/edit', isAuthenticated, async (req, res) => {
  const student = await Student.findById(req.params.id);
  res.render('edit', { student });
});

app.put('/students/:id', isAuthenticated, async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
  res.redirect('/students');
});

app.delete('/students/:id', isAuthenticated, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/students');
});

// ==================== RESTful API (Public) ====================
app.get('/api/students', async (req, res) => res.json(await Student.find()));
app.get('/api/students/:id', async (req, res) => {
  const s = await Student.findById(req.params.id);
  s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/students', async (req, res) => res.status(201).json(await Student.create(req.body)));
app.put('/api/students/:id', async (req, res) => {
  const s = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/students/:id', async (req, res) => {
  const s = await Student.findByIdAndDelete(req.params.id);
  s ? res.json({ message: 'Deleted' }) : res.status(404).json({ error: 'Not found' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`Student Manager is running!`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Deployed: https://s381-kvzy.onrender.com`);
});
