const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
} = require('../controllers/projectController');

router.use(protect);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/:id/tasks', getProjectTasks);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
