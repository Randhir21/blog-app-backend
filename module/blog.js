const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  title: String,
  content: String,
  imagePath: String, // Store the path to the uploaded image
  
});

module.exports = mongoose.model('Blogs', userSchema);