const bcrypt = require('bcrypt');
const { connectDB, getCollection } = require('./config');

const createAdmin = async () => {
  await connectDB();
  const users = getCollection('users');

  const email = 'sajimgeorge@gmail.com';
  
  // Delete existing admin first
  await users.deleteMany({ $or: [{ userName: 'admin' }, { email: email }] });
  console.log('🗑️ Deleted any existing admin users');

  const admin = {
    userName: 'admin',
    email: email,
    password: await bcrypt.hash('Melattu@1975', 10),
    role: 'admin',  // Make sure this is set
    createdAt: new Date(),
  };

  console.log('👤 Creating admin user:', {
    userName: admin.userName,
    email: admin.email,
    role: admin.role,
    hasPassword: !!admin.password
  });

  const result = await users.insertOne(admin);
  console.log('✅ Admin user created with ID:', result.insertedId);
  
  // Verify what was actually saved
  const savedAdmin = await users.findOne({ userName: 'admin' });
  console.log('🔍 Verification - saved admin:', {
    _id: savedAdmin._id,
    userName: savedAdmin.userName,
    email: savedAdmin.email,
    role: savedAdmin.role,
    hasPassword: !!savedAdmin.password
  });
};

createAdmin().catch(console.error);
