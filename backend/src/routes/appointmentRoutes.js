const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAll,
  create,
  updateStatus,
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAll);
router.post('/', create);
router.patch('/:id/status', updateStatus);

module.exports = router;
