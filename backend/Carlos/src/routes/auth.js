const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { login, getDoctors } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.get('/doctors', authMiddleware, getDoctors);

module.exports = router;
