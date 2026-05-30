const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getAll, getByPatient, create } = require('../controllers/diagnosisController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/patient/:patientId', getByPatient);
router.post('/', create);

module.exports = router;
