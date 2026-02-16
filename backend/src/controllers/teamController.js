const Team = require('../models/team');
const User = require('../models/user');

exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    next(err);
  }
};

exports.getTeams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let teams;
    if (user.role === 'admin') {
      teams = await Team.find({})
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      teams = await Team.find({ members: req.user.id })
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }
    res.json(teams);
  } catch (err) {
    next(err);
  }
};

exports.createTeam = async (req, res, next) => {
  try {
    const team = await Team.create({
      ...req.body,
      createdBy: req.user.id,
      members: req.body.members || [req.user.id]
    });
    const populated = await Team.findById(team._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};
