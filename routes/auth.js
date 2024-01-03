require('dotenv').config();

const { Router } = require('express')
const express = require('express')
const Admin = require('../models/Admin')
const router = express.Router()
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken')
const JWTokenSecret = process.env.JWTokenSecret;
const { v4: uuidv4 } = require('uuid');
const { sendPasswordResetEmail, sendPasswordResetEmailEmp, sendPasswordResetEmailSub } = require('../sendPassword')
const Employee = require('../models/Employee')
const SubEmployee = require('../models/SubEmployee')


// One time setup to store and create user in Database 
// http://localhost:5000/api/auth/setup 
router.post('/setup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Hash the plain password using bcryptjs
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new admin with the hashed password
        const newAdmin = new Admin({
            username,
            password: hashedPassword,
        });

        // Save the admin to the database
        await newAdmin.save();

        return res.status(201).json({ message: 'Admin setup successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});




// login Admin
// http://localhost:5000/api/auth/login
router.post('/login', [
    body('username', 'Enter a valid username').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;


    try {
        // Retrieve the hashed password for the admin based on username
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        // Compare the entered plain password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (passwordMatch) {
            // Passwords match, admin is authenticated
            const token = jwt.sign({ username: admin.username }, JWTokenSecret, { expiresIn: '1h' });

            return res.status(200).json({ message: 'Authentication successful', token });
        } else {
            // Passwords don't match, authentication failed
            return res.status(401).json({ message: 'Authentication failed' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});





const validatePasswordChange = [
    body('email', 'Enter a valid username').isEmail(),
    body('currentPassword', 'Current password cannot be blank').exists(),
    body('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 }),
];
router.post('/changePassword', validatePasswordChange, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, currentPassword, newPassword } = req.body;

    try {
        // Find the user based on username in any of the three collections
        const admin = await Admin.findOne({ username:email });
        const employee = await Employee.findOne({ email });
        const subEmployee = await SubEmployee.findOne({ email });

        console.log(admin)
        console.log(employee)
        console.log(subEmployee)
        if (!admin && !employee && !subEmployee) {
            return res.status(404).json({ message: 'User not found' });
        }

        let user;
        if (admin) {
            user = admin;
        } else if (employee) {
            user = employee;
        } else {
            user = subEmployee;
        }

        // Compare the current password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (passwordMatch) {
            // Hash the new password using bcryptjs
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update the user's password in the database with the new hashed password
            user.password = hashedNewPassword;
            await user.save();

            return res.status(200).json({ message: 'Password updated successfully' });
        } else {
            // Current password does not match, authentication failed
            return res.status(401).json({ message: 'Authentication failed' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Forgot Password for SuperAdmin
// http://localhost:5000/api/auth/forgotPassword
router.post('/forgotPassword', [
    body('username', 'Enter a valid username').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;

    function generateUniqueToken() {
        return uuidv4();
    }

    try {
        // Retrieve the admin based on username
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Generate a unique token for password reset (you can use a library like `uuid`)
        const resetToken = generateUniqueToken(); // Implement this function
        console.log(resetToken)
        // Store the reset token and its expiration date in the database
        admin.resetToken = resetToken;
        admin.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
        await admin.save();

        // Send a password reset email to the user
        sendPasswordResetEmail(admin.username, resetToken); // Implement this function

        return res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Reset Password for SuperAdmin
// http://localhost:5000/api/auth/resetPassword/:resetToken
router.post('/resetPassword/:resetToken', [
    body('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const { resetToken } = req.params;

    try {
        // Find the admin by the reset token and ensure it has not expired
        const admin = await Admin.findOne({ resetToken, resetTokenExpires: { $gt: Date.now() } });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash the new password using bcryptjs
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the admin's password and clear the reset token
        admin.password = hashedNewPassword;
        admin.resetToken = undefined;
        admin.resetTokenExpires = undefined;
        await admin.save();

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});



// Forgot Password for Admin
router.post('/forgotPasswordEmp', [
    body('email', 'Enter a valid Email').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    function generateUniqueToken() {
        return uuidv4();
    }

    try {
        console.log(email)
        // Retrieve the admin based on username
        const employee = await Employee.findOne({ email });

        if (!employee) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Generate a unique token for password reset (you can use a library like `uuid`)
        const resetToken = generateUniqueToken(); // Implement this function
        console.log(resetToken)
        // Store the reset token and its expiration date in the database
        employee.resetToken = resetToken;
        employee.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
        await employee.save();

        // Send a password reset email to the user
        sendPasswordResetEmailEmp(employee.email, resetToken); // Implement this function

        return res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Reset Token for Admin
router.post('/resetPasswordEmp/:resetToken', [
    body('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const { resetToken } = req.params;

    try {
        // Find the admin by the reset token and ensure it has not expired
        const employee = await Employee.findOne({ resetToken, resetTokenExpires: { $gt: Date.now() } });

        if (!employee) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash the new password using bcryptjs
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the admin's password and clear the reset token
        employee.password = hashedNewPassword;
        employee.resetToken = undefined;
        employee.resetTokenExpires = undefined;
        await employee.save();

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});



// Forgot Password for Employee
router.post('/forgotPasswordSub', [
    body('email', 'Enter a valid Email').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    function generateUniqueToken() {
        return uuidv4();
    }

    try {
        console.log(email)
        // Retrieve the admin based on username
        const subemployee = await SubEmployee.findOne({ email });

        if (!subemployee) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Generate a unique token for password reset (you can use a library like `uuid`)
        const resetToken = generateUniqueToken(); // Implement this function
        console.log(resetToken)
        // Store the reset token and its expiration date in the database
        subemployee.resetToken = resetToken;
        subemployee.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
        await subemployee.save();

        // Send a password reset email to the user
        sendPasswordResetEmailSub(subemployee.email, resetToken); // Implement this function

        return res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/resetPasswordSub/:resetToken', [
    body('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;
    const { resetToken } = req.params;

    try {
        // Find the admin by the reset token and ensure it has not expired
        const subemployee = await SubEmployee.findOne({ resetToken, resetTokenExpires: { $gt: Date.now() } });

        if (!subemployee) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash the new password using bcryptjs
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the admin's password and clear the reset token
        subemployee.password = hashedNewPassword;
        subemployee.resetToken = undefined;
        subemployee.resetTokenExpires = undefined;
        await subemployee.save();

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router