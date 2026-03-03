const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { getTeams, getTeam, createTeam, updateTeam, deleteTeam } = require('../controllers/teamController');

router.use(protect);

router.get('/', getTeams);
router.get('/:id', getTeam);
router.post('/', requireAdmin, createTeam);
router.put('/:id', requireAdmin, updateTeam);
router.delete('/:id', requireAdmin, deleteTeam);

module.exports = router;
