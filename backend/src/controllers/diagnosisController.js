const Diagnosis = require('../models/Diagnosis');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { handleError } = require('../utils/errorHandler');

const normalizeCreatePayload = (body) => ({
  patient_id: body.patient_id,
  chief_complaint:
    body.chief_complaint || body.consultation_reason || body.description,
  diagnosis: body.diagnosis,
  treatment: body.treatment,
  medications: body.medications,
  next_appointment: body.next_appointment || body.suggested_next_appointment,
  notes: body.notes,
  date: body.date,
});

exports.getAll = async (req, res) => {
  try {
    const { patient_id: patientIdQuery } = req.query;
    const where = {};

    if (patientIdQuery !== undefined && patientIdQuery !== '') {
      const patient = await Patient.findByPk(patientIdQuery);
      if (!patient) {
        return res.status(404).json({ message: 'Paciente no encontrado' });
      }
      where.patient_id = Number(patientIdQuery);
    }

    const diagnoses = await Diagnosis.findAll({
      where,
      include: [
        { model: Patient, attributes: ['id', 'name'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });

    res.json(diagnoses);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.params.patient_id;
    const patient = await Patient.findByPk(patientId);

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const diagnoses = await Diagnosis.findAll({
      where: { patient_id: patientId },
      include: [
        { model: Patient, attributes: ['id', 'name'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });

    res.json(diagnoses);
  } catch (error) {
    handleError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      patient_id,
      chief_complaint,
      diagnosis,
      treatment,
      medications,
      next_appointment,
      notes,
      date,
    } = normalizeCreatePayload(req.body);
    const doctor_id = req.user.id;

    if (!patient_id || !chief_complaint || !diagnosis || !treatment || !date) {
      return res.status(404).json({
        message:
          'Paciente, motivo de consulta, diagnóstico, tratamiento y fecha son requeridos',
      });
    }

    if (next_appointment) {
      const nextDate = new Date(`${next_appointment}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (nextDate <= today) {
        return res.status(404).json({
          message: 'La próxima cita debe ser una fecha futura',
        });
      }
    }

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const doctor = await User.findByPk(doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const record = await Diagnosis.create({
      patient_id,
      doctor_id,
      chief_complaint,
      diagnosis,
      treatment,
      medications: medications || null,
      next_appointment: next_appointment || null,
      notes: notes || null,
      date,
    });

    res.status(201).json(record);
  } catch (error) {
    handleError(res, error);
  }
};
