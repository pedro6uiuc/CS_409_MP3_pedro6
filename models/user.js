const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  pendingTasks: {
    type: [String], // store Task _ids as strings
    default: [],
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

// Export the model
module.exports = mongoose.model('User', userSchema);