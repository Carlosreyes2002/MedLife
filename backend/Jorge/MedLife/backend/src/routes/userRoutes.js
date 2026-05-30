const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getAll, create, remove } = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/', getAll);
router.post('/', create);
router.delete('/:id', remove);

module.exports = router;
