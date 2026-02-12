const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTodos, createTodo, updateTodo, deleteTodo } = require('../controllers/todoController');

router.use(protect);

router.get('/', getTodos);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;
