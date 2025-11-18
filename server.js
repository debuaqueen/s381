const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection (Render/Heroku/Atlas use MONGODB_URI)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Models
const User = require('./models/User');
const Student = require('./models/Student');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: 'super-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.username) return next();
  res.redirect('/login');
};

// ======================== AUTH ROUTES ========================
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.render('login', { error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render('login', { error: 'Invalid username or password' });

    req.session.username = username;
    res.redirect('/students');
  } catch (err) {
    res.render('login', { error: 'Server error' });
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (await User.findOne({ username })) {
      return res.render('signup', { error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    req.session.username = username;
    res.redirect('/students');
  } catch (err) {
    res.render('signup', { error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ======================== API ROUTES (NO AUTH) ========================
app.get('/api/students', async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ error: 'Not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ======================== PROTECTED WEB ROUTES ========================
app.get('/', (req, res) => {
  req.session.username ? res.redirect('/students') : res.redirect('/login');
});

app.get('/students', isAuthenticated, async (req, res) => {
  let query = {};

  if (req.query.name) query.name = { $regex: req.query.name, $options: 'i' };
  if (req.query.major) query.major = { $regex: req.query.major, $options: 'i' };

  const ageQuery = {};
  if (req.query.minAge) ageQuery.$gte = Number(req.query.minAge);
  if (req.query.maxAge) ageQuery.$lte = Number(req.query.maxAge);
  if (Object.keys(ageQuery).length) query.age = ageQuery;

  const students = await Student.find(query);

  res.render('index', {
    students,
    query: req.query,
    username: req.session.username
  });
});

app.get('/students/new', isAuthenticated, (req, res) => res.render('new'));

app.post('/students', isAuthenticated, async (req, res) => {
  try {
    await Student.create(req.body);
    res.redirect('/students');
  } catch (err) {
    res.status(400).send(`Error: ${err.message}`);
  }
});

app.get('/students/:id/edit', isAuthenticated, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.send('Student not found');
  res.render('edit', { student });
});

app.put('/students/:id', isAuthenticated, async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
    res.redirect('/students');
  } catch (err) {
    res.status(400).send(`Error: ${err.message}`);
  }
});

app.delete('/students/:id', isAuthenticated, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/students');
  } catch (err) {
    res.send('Error deleting');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});