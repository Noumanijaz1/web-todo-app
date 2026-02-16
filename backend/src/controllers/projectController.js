const Project = require('../models/project');
const Todo = require('../models/todo');
const User = require('../models/user');

exports.getProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let filter = {};
    if (user.role !== 'admin') {
      filter = { createdBy: req.user.id };
    }
    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, createdBy: req.user.id });
    const populated = await Project.findById(project._id).populate('createdBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Todo.updateMany({ projectId: project._id }, { $unset: { projectId: 1 } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getProjectTasks = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const user = await User.findById(req.user.id);
    let filter = { projectId: project._id };
    if (user.role !== 'admin') {
      filter.$or = [{ assignedTo: req.user.id }, { assignedTo: null }];
    }
    const tasks = await Todo.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};
