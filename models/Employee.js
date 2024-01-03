const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure email addresses are unique
        lowercase: true, // Store emails in lowercase
    },
    password: {
        type: String,
        required: true,
    },
    adminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin', // Reference to the AdminUser model
    },
    adminCompanyName: {
        type: String,
        required: true,
    }, 
    resetToken: {
        type: String, // This will store the reset token
    },
    resetTokenExpires: {
        type: Date, // This will store the expiration date of the reset token
    },   // Add more fields as needed
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;

