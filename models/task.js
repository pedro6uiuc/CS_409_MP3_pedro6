const mongoose = require('mongoose');

// Define the Task schema
const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task name is required'],
  },
  description: {
    type: String,
    default: '',
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  assignedUser: {
    type: String, // store User _id as string
    default: '',
  },
  assignedUserName: {
    type: String,
    default: 'unassigned',
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Task', taskSchema);