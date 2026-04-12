const { sequelize, User, Event, Registration } = require('./models');

async function checkStatus() {
  try {
    const userCount = await User.count();
    const eventCount = await Event.count();
    const regCount = await Registration.count();
    const adminCount = await User.count({ where: { role: 'admin' } });

    console.log('--- DB STATUS ---');
    console.log('Total Users:', userCount);
    console.log('Admins:', adminCount);
    console.log('Events:', eventCount);
    console.log('Registrations:', regCount);

    const [results] = await sequelize.query("SHOW INDEX FROM users");
    console.log('Users Index Count:', results.length);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStatus();
