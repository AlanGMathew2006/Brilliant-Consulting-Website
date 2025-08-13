const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB with Mongoose...');
    
    // Connect to your "Login" database using Mongoose
    await mongoose.connect('mongodb://localhost:27017/Login', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Mongoose connected to MongoDB successfully');
    console.log('✅ Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('   Make sure MongoDB is running on localhost:27017');
    process.exit(1);
  }
};

// Listen for connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

module.exports = { connectDB };
