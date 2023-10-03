const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: {
    type: String,
    unique: true, // Set the email field as unique
  },
  password: String,
});

module.exports = mongoose.model('Register-Users', userSchema);
