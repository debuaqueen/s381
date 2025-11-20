const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String }, // optional now (for local accounts)
  facebookId: { type: String, unique: true, sparse: true }, // for Facebook login
  email: { type: String }
});

module.exports = mongoose.model('User', userSchema);