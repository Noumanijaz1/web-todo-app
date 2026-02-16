const Todo = require('../models/todo');
const User = require('../models/user');

exports.getTodos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let query = {};
    if (user.role !== 'admin') {
      // Non-admins see tasks assigned to them OR created by them
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
    const user = await User.findById(req.user.id);
    const todo = await Todo.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name description');
    if (!todo) return res.status(404).json({ message: 'Not found' });
    const assignedId = todo.assignedTo ? (todo.assignedTo._id || todo.assignedTo).toString() : null;
    if (user.role !== 'admin' && (!assignedId || assignedId !== req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }
    res.json(todo);
  } catch (err) { next(err); }
};

exports.createTodo = async (req, res, next) => {
  try {
    // Any authenticated user can create a task (userId = creator)
    const todo = await Todo.create({ ...req.body, userId: req.user.id });
    const populatedTodo = await Todo.findById(todo._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.status(201).json(populatedTodo);
  } catch (err) { next(err); }
};

exports.updateTodo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) return res.status(404).json({ message: 'Not found' });
    // Admins can update anything
    if (user.role === 'admin') {
      // proceed
    } else {
      // Regular users may only toggle completion on todos assigned to them
      if (!todo.assignedTo || todo.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (Object.keys(req.body).some(key => key !== 'completed')) {
        return res.status(403).json({ message: 'Users can only update completion status' });
      }
    }

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.json(updatedTodo);
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });
    if (user.role !== 'admin' && (!todo.assignedTo || String(todo.assignedTo) !== req.user.id)) {
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
    const user = await User.findById(req.user.id);
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });
    if (user.role !== 'admin' && (!todo.assignedTo || String(todo.assignedTo) !== req.user.id)) {
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
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete todos' });
    }
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
