const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const FileStore = require('session-file-store')(session);  // ← NEW: Session store for Render
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MONGODB ====================
const mongoURI = 'mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb?retryWrites=true&w=majority';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => {
    console.error('MongoDB Error:', err);
    process.exit(1);
  });

// ==================== MIDDLEWARE ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// FIXED SESSION FOR RENDER (the key change!)
app.use(session({
  store: new FileStore(),  // Persists sessions on Render
  secret: 'student-manager-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // true on Render, false local
    sameSite: 'lax'
  }
}));

// ==================== MODELS ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== AUTH MIDDLEWARE ====================
const isAuthenticated = (req, res, next) => {
  if (req.session?.username) {
    return next();
  }
  res.redirect('/login');
};

// ==================== CREATE DEFAULT ADMIN ====================
async function ensureAdmin() {
  try {
    const existing = await User.findOne({ username: 'admin' });
    if (!existing) {
      const hashed = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', password: hashed });
      console.log('Default admin created: admin / admin123');
    }
  } catch (err) {
    console.error('Admin creation error:', err);
  }
}
ensureAdmin();

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  req.session.username ? res.redirect('/students') : res.redirect('/login');
});

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

    // FIXED: Regenerate + save for Render reliability
    req.session.regenerate((err) => {
      if (err) {
        console.error('Regenerate error:', err);
        return res.render('login', { error: 'Login failed' });
      }
      req.session.username = username;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.render('login', { error: 'Login failed' });
        }
        res.redirect('/students');  // Success!
      });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Server error' });
  }
});

// Forgot Password Flow
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null });
});

app.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.render('forgot-password', { error: 'Username not found' });
  }
  res.render('set-new-password', { username, error: null, success: null });
});

app.post('/set-new-password', async (req, res) => {
  const { username, password, confirm } = req.body;
  
  if (password !== confirm) {
    return res.render('set-new-password', { username, error: 'Passwords do not match!', success: null });
  }
  if (password.length < 5) {
    return res.render('set-new-password', { username, error: 'Password too short (min 5 chars)', success: null });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate({ username }, { password: hashed });
    res.render('set-new-password', { username, error: null, success: 'Password updated! Login with your new password.' });
  } catch (err) {
    res.render('set-new-password', { username, error: 'Update failed', success: null });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/session', (req, res) => {
  res.render('session', { user: req.session.username ? { username: req.session.username } : null });
});

// ==================== CRUD ROUTES ====================
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
  res.render('index', { students, query: req.query, username: req.session.username });
});

app.get('/students/new', isAuthenticated, (req, res) => res.render('new'));
app.post('/students', isAuthenticated, async (req, res) => {
  await Student.create(req.body);
  res.redirect('/students');
});
app.get('/students/:id/edit', isAuthenticated, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).send('Student not found');
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

// ==================== REST API ====================
app.get('/api/students', async (req, res) => res.json(await Student.find()));
app.get('/api/students/:id', async (req, res) => {
  const s = await Student.findById(req.params.id);
  s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/students', async (req, res) => {
  try {
    res.status(201).json(await Student.create(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
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
  console.log('Student Manager Running Successfully!');
  if (process.env.PORT) {
    console.log(`Deployed at: https://s381-kvzy.onrender.com`);
  } else {
    console.log(`Local: http://localhost:${PORT}`);
  }
});
