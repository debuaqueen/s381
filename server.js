const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


const expressLayout = require('express-ejs-layouts');
app.use(expressLayout);
app.set('layout', 'layout');

// ==================== MongoDB ====================
mongoose.connect('mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// ==================== Middleware ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));


app.use((req, res, next) => {
  res.locals.layout = (template) => `<% layout('${template}') -%>${res.locals.body || ''}`;
  next();
});

// ==================== Simple Session ====================
app.use(require('express-session')({
  secret: 'simple-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ==================== Models ====================
const User = require('./models/User');
const Student = require('./models/Student');

// ==================== Create Admin ====================
User.findOne({ username: 'admin' }).then(user => {
  if (!user) {
    bcrypt.hash('admin123', 10).then(hash => {
      new User({ username: 'admin', password: hash }).save();
      console.log('Admin created: admin / admin123');
    });
  }
});

// ==================== Auth Middleware ====================
const isAuth = (req, res, next) => {
  if (req.session && req.session.loggedin) return next();
  res.redirect('/login');
};

// ==================== Routes ====================
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
  req.session.destroy(() => res.redirect('/login'));
});

// REMOVED: /session route completely (no more demo link)

// Forgot Password
app.get('/forgot-password', (req, res) => res.render('forgot-password', { error: null }));
app.post('/forgot-password', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.render('forgot-password', { error: 'User not found' });
  res.render('set-new-password', { username: req.body.username, error: null, success: null });
});
app.post('/set-new-password', async (req, res) => {
  if (req.body.password !== req.body.confirm) {
    return res.render('set-new-password', { username: req.body.username, error: 'Passwords do not match', success: null });
  }
  if (req.body.password.length < 6) {
    return res.render('set-new-password', { username: req.body.username, error: 'Password too short (min 6 chars)', success: null });
  }
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.updateOne({ username: req.body.username }, { password: hash });
  res.render('set-new-password', { username: req.body.username, error: null, success: 'Password changed successfully!' });
});

// ==================== SEARCH + LIST ====================
app.get('/students', isAuth, async (req, res) => {
  const query = req.query;
  let filter = {};

  if (query.name) filter.name = { $regex: query.name, $options: 'i' };
  if (query.major) filter.major = { $regex: query.major, $options: 'i' };
  if (query.minAge) filter.age = { ...filter.age, $gte: Number(query.minAge) };
  if (query.maxAge) filter.age = { ...filter.age, $lte: Number(query.maxAge) };

  const students = await Student.find(filter);

  res.render('index', {
    students,
    username: req.session.username,
    query
  });
});

// ==================== CREATE STUDENT (WITH STRONG VALIDATION) ====================
app.get('/students/new', isAuth, (req, res) => res.render('new'));

app.post('/students', isAuth, async (req, res) => {
  const { name, studentId, age, major } = req.body;

  // Required fields
  if (!name || !studentId || !age || !major) {
    return res.render('new', { error: 'All fields are required!' });
  }

  // Name validation
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    return res.render('new', { error: 'Name must be 2–50 characters' });
  }

  // Student ID: 8–10 digits only
  if (!/^\d{8,10}$/.test(studentId.trim())) {
    return res.render('new', { error: 'Student ID must be 8–10 digits only' });
  }

  // Age: 17–100
  const ageNum = Number(age);
  if (isNaN(ageNum) || ageNum < 17 || ageNum > 100) {
    return res.render('new', { error: 'Age must be between 17 and 100' });
  }

  try {
    await Student.create({
      name: name.trim(),
      studentId: studentId.trim(),
      age: ageNum,
      major: major.trim()
    });
    res.redirect('/students');
  } catch (err) {
    if (err.code === 11000) {
      res.render('new', { error: 'This Student ID already exists!' });
    } else {
      res.render('new', { error: 'Failed to create student. Please try again.' });
    }
  }
});

// ==================== EDIT STUDENT (WITH VALIDATION) ====================
app.get('/students/:id/edit', isAuth, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).send('Student not found');
  res.render('edit', { student, error: null });
});

app.put('/students/:id', isAuth, async (req, res) => {
  const { name, studentId, age, major } = req.body;

  if (!name || !studentId || !age || !major) {
    const student = await Student.findById(req.params.id);
    return res.render('edit', { student, error: 'All fields are required!' });
  }
  if (isNaN(age) || age < 17 || age > 100) {
    const student = await Student.findById(req.params.id);
    return res.render('edit', { student, error: 'Age must be 17–100' });
  }

  try {
    await Student.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      studentId: studentId.trim(),
      age: Number(age),
      major: major.trim()
    });
    res.redirect('/students');
  } catch (err) {
    const student = await Student.findById(req.params.id);
    if (err.code === 11000) {
      res.render('edit', { student, error: 'Student ID already exists!' });
    } else {
      res.render('edit', { student, error: 'Update failed' });
    }
  }
});

app.delete('/students/:id', isAuth, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/students');
});

// ==================== REST API ====================
app.get('/api/students', async (req, res) => res.json(await Student.find()));
app.post('/api/students', async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Student Manager is RUNNING!');
  console.log(`Local → http://localhost:${PORT}`);
  console.log(`Render → https://s381-kvzy.onrender.com`);
});



