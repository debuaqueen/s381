const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MongoDB ====================
mongoose.connect('mongodb+srv://wongyanho:123@cluster0.603b9e0.mongodb.net/studentdb')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB error:', err));

// ==================== Middleware ====================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ==================== Session ====================
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
      new User({ username: 'admin', password: hash }).save()
        .then(() => console.log('Admin created: admin / admin123'))
        .catch(() => {});
    });
  }
});

// ==================== Auth ====================
const isAuth = (req, res, next) => {
  if (req.session?.loggedin) return next();
  res.redirect('/login');
};

// ==================== Routes ====================
app.get('/', (req, res) => res.redirect(req.session?.loggedin ? '/students' : '/login'));

// Login Routes
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      req.session.loggedin = true;
      req.session.username = user.username;
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
    return res.render('set-new-password', { username: req.body.username, error: 'Password must be at least 6 characters', success: null });
  }
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.updateOne({ username: req.body.username }, { password: hash });
  res.render('set-new-password', { username: req.body.username, error: null, success: 'Password changed successfully!' });
});

// ==================== STUDENT CRUD (Web) ====================
app.get('/students', isAuth, async (req, res) => {
  const query = req.query;
  let filter = {};
  if (query.name) filter.name = { $regex: query.name, $options: 'i' };
  if (query.major) filter.major = { $regex: query.major, $options: 'i' };
  if (query.gender && query.gender !== '') filter.gender = query.gender;
  if (query.minAge) filter.age = { ...filter.age, $gte: Number(query.minAge) };
  if (query.maxAge) filter.age = { ...filter.age, $lte: Number(query.maxAge) };

  const students = await Student.find(filter).sort({ name: 1 });
  res.render('index', { students, username: req.session.username, query });
});

app.get('/students/new', isAuth, (req, res) => res.render('new', { error: null }));
app.post('/students', isAuth, async (req, res) => {
  const { name, studentId, age, major, gender } = req.body;
  if (!name || !studentId || !age || !major || !gender) return res.render('new', { error: 'All fields required!' });
  if (!/^\d{8,10}$/.test(studentId.trim())) return res.render('new', { error: 'Invalid Student ID' });
  const ageNum = Number(age);
  if (ageNum < 17 || ageNum > 100) return res.render('new', { error: 'Age must be 17–100' });
  if (!['Male', 'Female'].includes(gender)) return res.render('new', { error: 'Invalid gender' });

  try {
    await Student.create({
      name: name.trim(),
      studentId: studentId.trim(),
      age: ageNum,
      major: major.trim(),
      gender
    });
    res.redirect('/students');
  } catch (err) {
    res.render('new', { error: err.code === 11000 ? 'Student ID exists!' : 'Create failed' });
  }
});

app.get('/students/:id/edit', isAuth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send('Not found');
    res.render('edit', { student, error: null });
  } catch {
    res.redirect('/students');
  }
});

app.put('/students/:id', isAuth, async (req, res) => {
  const { name, studentId, age, major, gender } = req.body;
  const ageNum = Number(age);
  try {
    await Student.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      studentId: studentId.trim(),
      age: ageNum,
      major: major.trim(),
      gender
    });
    res.redirect('/students');
  } catch (err) {
    const student = await Student.findById(req.params.id);
    res.render('edit', { student, error: err.code === 11000 ? 'Student ID exists!' : 'Update failed' });
  }
});

app.delete('/students/:id', isAuth, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/students');
});

// ==================== FULL RESTful API (PUBLIC – NO LOGIN!) ====================
app.get('/api/students', async (req, res) => {
  try {
    res.json(await Student.find());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
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
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Student Manager RUNNING!');
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Live: https://s381-kvzy.onrender.com`);
});
