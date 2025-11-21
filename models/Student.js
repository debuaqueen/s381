const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },  // ← NEW
  major: { type: String, required: true }
});


module.exports = mongoose.model('Student', studentSchema);




