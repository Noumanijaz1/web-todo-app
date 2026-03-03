const Project = require('../models/project');
const Todo = require('../models/todo');
const User = require('../models/user');

const role = (req) => req.user?.effectiveRole ?? req.user?.role;

exports.getProjects = async (req, res, next) => {
  try {
    const r = role(req);
    let filter = {};
    if (r === 'admin') {
      // Admin: view all
    } else if (r === 'project_manager') {
      filter.$or = [{ projectManagerId: req.user.id }, { createdBy: req.user.id }];
    } else {
      // Employee: only projects where they have at least one assigned task
      const assignedProjectIds = await Todo.distinct('projectId', {
        projectId: { $ne: null },
        assignedTo: req.user.id
      });
      filter = { _id: { $in: assignedProjectIds } };
    }
    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('projectManagerId', 'name email')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('projectManagerId', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const r = role(req);
    if (r === 'employee') {
      const hasTask = await Todo.findOne({ projectId: project._id, assignedTo: req.user.id });
      if (!hasTask) return res.status(403).json({ message: 'Not authorized to view this project' });
    } else if (r === 'project_manager') {
      const isPM = project.projectManagerId && String(project.projectManagerId._id || project.projectManagerId) === req.user.id;
      const isCreator = String(project.createdBy._id || project.createdBy) === req.user.id;
      if (!isPM && !isCreator) return res.status(403).json({ message: 'Not authorized to view this project' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const r = role(req);
    if (r !== 'admin' && r !== 'project_manager') {
      return res.status(403).json({ message: 'Only Admin or Project Manager can create projects' });
    }
    const project = await Project.create({ ...req.body, createdBy: req.user.id });
    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('projectManagerId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const r = role(req);
    if (r === 'employee') return res.status(403).json({ message: 'Not authorized to update projects' });
    if (r === 'project_manager') {
      const isPM = project.projectManagerId && String(project.projectManagerId) === req.user.id;
      const isCreator = String(project.createdBy) === req.user.id;
      if (!isPM && !isCreator) return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('createdBy', 'name email').populate('projectManagerId', 'name email');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    if (role(req) !== 'admin') {
      return res.status(403).json({ message: 'Only Admin can delete projects' });
    }
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
    const r = role(req);
    let filter = { projectId: project._id };
    if (r === 'admin') {
      // all tasks in project
    } else if (r === 'project_manager') {
      const isPM = project.projectManagerId && String(project.projectManagerId) === req.user.id;
      const isCreator = String(project.createdBy) === req.user.id;
      if (!isPM && !isCreator) return res.status(403).json({ message: 'Not authorized to view this project\'s tasks' });
      // PM sees all tasks in project
    } else {
      // Employee: only tasks assigned to them in this project
      filter.assignedTo = req.user.id;
    }
    const tasks = await Todo.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};
