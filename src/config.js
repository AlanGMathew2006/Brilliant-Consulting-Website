const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Update if needed
const client = new MongoClient(uri);

let collection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('Login'); // Replace with your DB name
    collection = db.collection('users'); // Replace with your collection name
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if connection fails
  }
}

function getCollection() {
  if (!collection) throw new Error('MongoDB not connected');
  return collection;
}

module.exports = { connectDB, getCollection };
