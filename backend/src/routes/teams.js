const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTeams, getTeam, createTeam } = require('../controllers/teamController');

router.use(protect);

router.get('/', getTeams);
router.get('/:id', getTeam);
router.post('/', createTeam);

module.exports = router;
