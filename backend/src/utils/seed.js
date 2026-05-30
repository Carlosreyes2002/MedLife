const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEFAULT_USERS = [
  {
    name: 'Admin',
    email: 'admin@medlife.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Dr. Carlos',
    email: 'carlos@medlife.com',
    password: 'admin123',
    role: 'doctor',
  },
];

async function seedDefaultUsers() {
  const count = await User.count();
  if (count > 0) return;

  const users = await Promise.all(
    DEFAULT_USERS.map(async (user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      password: await bcrypt.hash(user.password, 10),
    }))
  );

  await User.bulkCreate(users);
  console.log('Usuarios iniciales creados');
}

module.exports = { seedDefaultUsers };
