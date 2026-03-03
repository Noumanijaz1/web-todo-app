const Todo = require('../models/todo');
const User = require('../models/user');
const Project = require('../models/project');

const role = (req) => req.user?.effectiveRole ?? req.user?.role;

async function canPMManageTask(req, projectId) {
  if (!projectId) return false;
  const project = await Project.findById(projectId).select('projectManagerId createdBy');
  if (!project) return false;
  return String(project.projectManagerId) === req.user.id || String(project.createdBy) === req.user.id;
}

exports.getTodos = async (req, res, next) => {
  try {
    const r = role(req);
    let query = {};
    if (r === 'admin') {
      // all tasks
    } else if (r === 'project_manager') {
      const pmProjectIds = await Project.distinct('_id', {
        $or: [{ projectManagerId: req.user.id }, { createdBy: req.user.id }]
      });
      query.$or = [
        { projectId: { $in: pmProjectIds } },
        { userId: req.user.id },
      ];
    } else {
      // Employee: assigned to them or created by them
      query.$or = [
        { assignedTo: req.user.id },
        { userId: req.user.id },
      ];
    }
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }
    const todos = await Todo.find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.json(todos);
  } catch (err) { next(err); }
};

exports.getTodoById = async (req, res, next) => {
  try {
    const r = role(req);
    const todo = await Todo.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name description');
    if (!todo) return res.status(404).json({ message: 'Not found' });
    if (r === 'admin') {
      // ok
    } else if (r === 'project_manager') {
      const canManage = await canPMManageTask(req, todo.projectId?._id || todo.projectId);
      const isCreator = String(todo.userId) === req.user.id;
      if (!canManage && !isCreator) {
        return res.status(403).json({ message: 'Not authorized to view this task' });
      }
    } else {
      const assignedId = todo.assignedTo ? (todo.assignedTo._id || todo.assignedTo).toString() : null;
      const isCreator = String(todo.userId) === req.user.id;
      if ((!assignedId || assignedId !== req.user.id) && !isCreator) {
        return res.status(403).json({ message: 'Not authorized to view this task' });
      }
    }
    res.json(todo);
  } catch (err) { next(err); }
};

exports.createTodo = async (req, res, next) => {
  try {
    const r = role(req);
    if (r === 'employee') {
      return res.status(403).json({ message: 'Only Admin or Project Manager can create tasks' });
    }
    if (r === 'project_manager' && req.body.projectId) {
      const canManage = await canPMManageTask(req, req.body.projectId);
      if (!canManage) {
        return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
      }
    }
    const payload = { ...req.body, userId: req.user.id };
    const status = payload.status || 'todo';
    payload.completed = status === 'done';
    const todo = await Todo.create(payload);
    const populatedTodo = await Todo.findById(todo._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.status(201).json(populatedTodo);
  } catch (err) { next(err); }
};

exports.updateTodo = async (req, res, next) => {
  try {
    const r = role(req);
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });

    if (r === 'admin') {
      // full update
    } else if (r === 'project_manager') {
      const canManage = await canPMManageTask(req, todo.projectId);
      if (!canManage) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
    } else {
      // Employee: only assigned to them, and only status/completed
      const assignedId = todo.assignedTo ? String(todo.assignedTo) : null;
      if (!assignedId || assignedId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const allowedKeys = ['completed', 'status'];
      if (Object.keys(req.body).some(key => !allowedKeys.includes(key))) {
        return res.status(403).json({ message: 'Employees can only update status (Todo → In Progress → Done)' });
      }
    }

    const update = { ...req.body };
    if (update.status !== undefined) {
      update.completed = update.status === 'done';
    }
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.json(updatedTodo);
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const r = role(req);
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });
    if (r === 'admin') {
      // ok
    } else if (r === 'project_manager') {
      const canManage = await canPMManageTask(req, todo.projectId);
      if (!canManage) return res.status(403).json({ message: 'Not authorized' });
    } else if (!todo.assignedTo || String(todo.assignedTo) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });
    todo.comments.push({
      userId: req.user.id,
      userName: user.name || user.email,
      text: text.trim().slice(0, 1000),
    });
    await todo.save();
    const updated = await Todo.findById(todo._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.json(updated);
  } catch (err) { next(err); }
};

exports.addAttachment = async (req, res, next) => {
  try {
    const r = role(req);
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });
    if (r === 'admin') {
      // ok
    } else if (r === 'project_manager') {
      const canManage = await canPMManageTask(req, todo.projectId);
      if (!canManage) return res.status(403).json({ message: 'Not authorized' });
    } else if (!todo.assignedTo || String(todo.assignedTo) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'File required' });
    }
    todo.attachments.push({
      originalName: req.file.originalname,
      path: req.file.filename,
    });
    await todo.save();
    const updated = await Todo.findById(todo._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.json(updated);
  } catch (err) { next(err); }
};

exports.deleteTodo = async (req, res, next) => {
  try {
    if (role(req) !== 'admin') {
      return res.status(403).json({ message: 'Only Admin can delete tasks' });
    }
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
