const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { handleError } = require('../utils/errorHandler');

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

    const appointments = await Appointment.findAll({
      where,
      include: [
        {
          model: Patient,
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name'],
        },
      ],
      order: [['date', 'ASC']],
    });

    res.json(appointments);
  } catch (error) {
    handleError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const { patient_id, date, reason } = req.body;
    const doctor_id = req.user.id;

    if (!patient_id || !date) {
      return res.status(404).json({
        message: 'Paciente y fecha son requeridos',
      });
    }

    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const doctor = await User.findByPk(doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const appointment = await Appointment.create({
      patient_id,
      doctor_id,
      date,
      reason,
    });
    res.status(201).json(appointment);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(404).json({ message: 'El estado es requerido' });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    await appointment.update({ status });
    res.json(appointment);
  } catch (error) {
    handleError(res, error);
  }
};
