const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb://localhost:27017/Login'); // Add your MongoDB connection string here

connect.then(() => {
    console.log('Database connected successfully');
})
.catch(() => {
    console.log('Database connection failed');
});

// Define the Login schema
const LoginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

//Collection Part
const collection = new mongoose.model("users", LoginSchema);

module.exports = collection; // Export the collection for use in other files
