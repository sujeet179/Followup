require('dotenv').config(); // Load environment variables from .env file

const ConnectToMongodb = require('./db');
const express = require('express');
const app = express();
const passport = require('passport'); // Import Passport
require('./passport-config'); // Import your Passport configuration
const jwtMiddleware = require('./jwtmiddleware');
const path=require('path')
var cors = require('cors');
const dbHost = process.env.DB_HOST;



ConnectToMongodb();
const port = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(passport.initialize());
app.use('/uploads/profile-pictures', express.static(path.join(__dirname, 'uploads', 'profile-pictures')));
app.use('/uploads/LeadPicture', express.static(path.join(__dirname, 'uploads', 'LeadPicture')));
app.use('/uploads/pictures', express.static(path.join(__dirname, 'uploads', 'pictures')));
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads', 'audio')));
app.use(express.static('uploads')); // 'uploads' should be the directory where your images are stored



app.use('/api/auth', require('./routes/auth'));
app.use('/api/company', require('./routes/company'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/subemployee', require('./routes/subemployee'));
app.use('/api/task', require('./routes/task'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/lead', require('./routes/lead'));
app.use('/api/files', require('./routes/fileRoutes')); // Adjust the path as needed
app.use('/api/employee', jwtMiddleware); // Apply middleware to employee-related routes


app.listen(port, () => {
  console.log(`Task-Manager backend listening at http://${dbHost}:${port}`);
});