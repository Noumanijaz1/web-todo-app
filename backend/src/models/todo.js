const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  }
);

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    path: { type: String, required: true },
  },
  { timestamps: true }
);

const todoSchema = new mongoose.Schema(
  {
    // Required / core fields when creating a task
    title: {
      type: String,
      required: [true, 'Please provide a todo title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high','urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    dueDate: {
      type: Date,
    },
    // Creator (set by backend)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Todo must belong to a user'],
    },
    // Legacy: keep in sync with status === 'done'
    completed: {
      type: Boolean,
      default: false,
    },
    comments: [commentSchema],
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Todo', todoSchema);
