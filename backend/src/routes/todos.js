const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  addComment,
  addAttachment,
} = require('../controllers/todoController');

router.use(protect);

router.get('/', getTodos);
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);
router.post('/:id/comments', addComment);
router.post('/:id/attachments', uploadSingle, addAttachment);

module.exports = router;
