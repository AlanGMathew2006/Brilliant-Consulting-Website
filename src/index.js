const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const collection = require('./config'); // Import the collection from config.js

const app = express();
//Convert data to JSON
app.use(express.json());

app.use(express.urlencoded({ extended: false }));

// Serve static files from the "public" folder (correct absolute path)
app.use(express.static(path.join(__dirname, '..', 'public')));

// use EJS as the view engine
app.set('view engine', 'ejs');

// Render login and signup EJS views
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

//Register User')
app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.email,
        password: req.body.password
    }

    const userdata = await collection.insertMany(data);
    console.log(userdata);

});

// No need for custom routes for static HTML files

const port = 5000;
app.listen(port, ()=> {
    console.log(`Server is running on Port: ${port}`);
})