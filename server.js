const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');
const passport = require('passport');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MONGODB CONNECTION ====================
const mongoURI = 'mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Atlas Connected Successfully!'))
.catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});

// ==================== PASSPORT CONFIG ====================
require('./config/passport')(passport);  // Load Facebook strategy

// ==================== MIDDLEWARE - CORRECT ORDER!!! ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// 1. Session MUST come BEFORE passport
app.use(session({
  secret: 'student-manager-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// 2. Then passport middleware
app.use(passport.initialize());
app.use(passport.session());

// ==================== MODELS ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== AUTH MIDDLEWARE ====================
const isAuthenticated = (req, res, next) => {
  if (req.session.username || req.isAuthenticated()) return next();
  res.redirect('/login');
};

// ==================== FACEBOOK AUTH ROUTES ====================
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    req.session.username = req.user.username;  // Keep compatibility with your old code
    res.redirect('/students');
  }
);

// ==================== LOCAL AUTH ROUTES ====================
app.get('/login', (req, res) => res.render('login', { error: null }));

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

app.get('/signup', (req, res) => res.render('signup', { error: null }));

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (await User.findOne({ username })) {
      return res.render('signup', { error: 'Username already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });
    req.session.username = username;
    res.redirect('/students');
  } catch (err) {
    res.render('signup', { error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  req.logout(() => {}); // Clear passport session too
  res.redirect('/login');
});

app.get('/', (req, res) => 
  req.session.username || req.isAuthenticated() ? res.redirect('/students') : res.redirect('/login')
);

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
    username: req.session.username || req.user?.username 
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
