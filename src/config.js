const { MongoClient } = require('mongodb');

let db;

const connectDB = async () => {
  try {
    // Update this with your actual MongoDB connection string
    const client = new MongoClient('mongodb://localhost:27017', {
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // Change this to match your actual database name: "Login"
    db = client.db('Login');
    console.log('✅ Database selected:', db.databaseName);
    
    // Test the connection
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.error('   Make sure MongoDB is running on localhost:27017');
    process.exit(1);
  }
};

const getCollection = (collectionName) => {
  if (!db) {
    console.error('❌ Database not connected! Call connectDB() first.');
    throw new Error('Database not connected! Call connectDB() first.');
  }
  console.log(`📂 Getting collection: ${collectionName}`);
  return db.collection(collectionName);
};

module.exports = { connectDB, getCollection };
