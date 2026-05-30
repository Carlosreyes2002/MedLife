const Patient = require('../models/Patient');
const { handleError } = require('../utils/errorHandler');

exports.getAll = async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    res.json(patient);
  } catch (error) {
    handleError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, dob, phone, address, email } = req.body;

    if (!name || !dob) {
      return res.status(404).json({ message: 'Nombre y fecha de nacimiento son requeridos' });
    }

    const patient = await Patient.create({
      name,
      dob,
      phone: phone || null,
      address: address || null,
      email: email || null,
    });
    res.status(201).json(patient);
  } catch (error) {
    handleError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const { name, dob, phone, address, email } = req.body;

    if (!name || !dob) {
      return res.status(404).json({ message: 'Nombre y fecha de nacimiento son requeridos' });
    }

    await patient.update({
      name,
      dob,
      phone: phone ?? null,
      address: address ?? null,
      email: email ?? null,
    });

    res.json(patient);
  } catch (error) {
    handleError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    await patient.destroy();
    res.json({ message: 'Paciente eliminado' });
  } catch (error) {
    handleError(res, error);
  }
};
