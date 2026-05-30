const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Diagnosis = require('../models/Diagnosis');
const { handleError } = require('../utils/errorHandler');

const VALID_ROLES = ['admin', 'doctor'];

exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['name', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    handleError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Solo un administrador puede crear usuarios',
      });
    }

    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: 'Nombre, email y contraseña son requeridos',
      });
    }

    const normalizedRole = role || 'doctor';
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        message: 'El rol debe ser admin o doctor',
      });
    }

    const existing = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    handleError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Solo un administrador puede eliminar usuarios',
      });
    }

    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'Id de usuario inválido' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'No se puede eliminar el único administrador del sistema',
        });
      }
    }

    const [appointmentCount, diagnosisCount] = await Promise.all([
      Appointment.count({ where: { doctor_id: id } }),
      Diagnosis.count({ where: { doctor_id: id } }),
    ]);

    if (appointmentCount > 0 || diagnosisCount > 0) {
      return res.status(409).json({
        message:
          'No se puede eliminar: el usuario tiene citas o diagnósticos asociados en el historial',
      });
    }

    await user.destroy();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    handleError(res, error);
  }
};
