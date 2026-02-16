const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    activeProjects: {
      type: Number,
      default: 0
    },
    health: {
      type: String,
      enum: ['stable', 'at_risk', 'great'],
      default: 'stable'
    },
    archived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
