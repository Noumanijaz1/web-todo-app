const Todo = require('../models/todo');
const User = require('../models/user');

exports.getTodos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let todos;
    if (user.role === 'admin') {
      // Admins see all todos
      todos = await Todo.find({}).populate('assignedTo', 'name email');
    } else {
      // Regular users see todos assigned to them
      todos = await Todo.find({ assignedTo: req.user.id }).populate('assignedTo', 'name email');
    }
    res.json(todos);
  } catch (err) { next(err); }
};

exports.createTodo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create todos' });
    }
    const todo = await Todo.create({ ...req.body, userId: req.user.id });
    const populatedTodo = await Todo.findById(todo._id).populate('assignedTo', 'name email');
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

    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo', 'name email');
    res.json(updatedTodo);
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
