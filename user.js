const mongoose = require('mongoose');

// Define user schema
const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]
});

module.exports = mongoose.model('User', userSchema);
