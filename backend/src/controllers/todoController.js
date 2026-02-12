const Todo = require('../models/todo');

exports.getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find({ userId: req.user.id });
    res.json(todos);
  } catch (err) { next(err); }
};

exports.createTodo = async (req, res, next) => {
  try {
    const todo = await Todo.create({ ...req.body, userId: req.user.id });
    res.status(201).json(todo);
  } catch (err) { next(err); }
};

exports.updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!todo) return res.status(404).json({ message: 'Not found' });
    res.json(todo);
  } catch (err) { next(err); }
};

exports.deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
