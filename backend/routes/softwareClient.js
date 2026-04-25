const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const softwareClientController = require('../controllers/softwareClientController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('software-client'));

router.get('/dashboard', softwareClientController.getDashboard);
router.get('/profile', softwareClientController.getProfile);
router.get('/projects', softwareClientController.getProjects);

module.exports = router;
