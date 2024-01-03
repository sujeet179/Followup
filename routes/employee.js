require('dotenv').config();


const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken'); // Import the 'jsonwebtoken' library
const jwtMiddleware = require('../jwtmiddleware');
const Employee = require('../models/Employee');
const SubEmployee = require('../models/SubEmployee');
const Task = require('../models/Task');
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET

// Route to register (sign up) an employee
// http://localhost:5000/api/employee/register
// router.post('/register', [
//     // Validation rules using express-validator
//     body('name').notEmpty().withMessage('Name is required'),
//     body('email').isEmail().withMessage('Invalid email format'),
//     body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
//     body('adminCompanyName').notEmpty().withMessage('Admin Company Name is required'),
//     body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number format'), // Add phone number validation

// ], async (req, res) => {
//     // Check for validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//         // Check if an employee with the same email already exists
//         const existingEmployee = await Employee.findOne({ email: req.body.email });

//         if (existingEmployee) {
//             return res.status(400).json({ error: 'Email already in use' });
//         }

//         // Find the admin user ID based on the selected admin company name
//         const adminCompany = await Company.findOne({ companyName: req.body.adminCompanyName });

//         if (!adminCompany) {
//             return res.status(404).json({ error: 'Admin Company not found' });
//         }

//         // Hash the password using bcryptjs
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);

//         // Create a new employee with the adminUserId automatically set
//         const newEmployee = new Employee({
//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword,
//             adminUserId: adminCompany._id, // Assign the adminUserId from the lookup
//             adminCompanyName: req.body.adminCompanyName,
//             phoneNumber: req.body.phoneNumber, // Add phoneNumber
//             companyId: req.body.companyId, // Assign the companyId from the request

//         });

//         await newEmployee.save();

//         res.status(201).json({ message: 'Employee registered successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.post('/register', [
    // Validation rules using express-validator
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('adminCompanyName').notEmpty().withMessage('Admin Company Name is required'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number format'), // Add phone number validation
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if an employee with the same email already exists
        const existingEmployee = await Employee.findOne({ email: req.body.email });

        if (existingEmployee) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Find the admin user ID based on the selected admin company name
        const adminCompany = await Company.findOne({ companyName: req.body.adminCompanyName });

        if (!adminCompany) {
            return res.status(404).json({ error: 'Admin Company not found' });
        }

        // Hash the password using bcryptjs
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new employee with the adminUserId automatically set
        const newEmployee = new Employee({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            adminUserId: adminCompany._id, // Assign the adminUserId from the lookup
            adminCompanyName: req.body.adminCompanyName,
            phoneNumber: req.body.phoneNumber, // Add phoneNumber
            companyId: req.body.companyId, // Assign the companyId from the request
        });

        await newEmployee.save();

        // Create a new Subemployee with the details of the registered Employee as a supervisor
        const newSubemployee = new SubEmployee({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            adminUserId: adminCompany._id,
            adminCompanyName: req.body.adminCompanyName,
            phoneNumber: req.body.phoneNumber,
            // supervisor: newEmployee._id, // Storing the new Employee's ID as the supervisor
            // ... (other relevant details for Subemployee)
        });

        await newSubemployee.save();

        res.status(201).json({ message: 'Employee registered successfully and stored as supervisor in Subemployee collection' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if an employee with the provided email exists
        const employee = await Employee.findOne({ email });

        if (!employee) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, employee.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Determine the role of the employee (admin or sub-employee)
        let role;
        if (employee.adminCompanyName) {
            // This is an admin employee
            role = 'admin';
        } else {
            // This is a sub-employee
            role = 'sub-employee';
        }

        // Create a JWT token with the employee's information and role
        const token = jwt.sign({ email: employee.email, role, adminUserId: employee.adminUserId, adminCompanyName: employee.adminCompanyName, companyId: employee.companyId, employeeId: employee._id, name: employee.name }, ADMIN_JWT_SECRET,);

        return res.status(200).json({ message: 'Authentication successful', token });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




// Route to edit an employee's information by ID and update it
router.put('/edit/:id', [
    // Validation rules using express-validator (customize as needed)
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('adminCompanyName').optional().notEmpty().withMessage('Admin Company Name is required'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number format'), // Add phone number validation

], async (req, res) => {
    const employeeId = req.params.id;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Find the employee by ID
        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Update employee information based on the provided fields
        if (req.body.name) {
            employee.name = req.body.name;
        }
        if (req.body.email) {
            employee.email = req.body.email;
        }
        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            employee.password = hashedPassword;
        }
        if (req.body.adminCompanyName) {
            // Find the admin company ID based on the selected admin company name
            const adminCompany = await Company.findOne({ companyName: req.body.adminCompanyName });
            if (!adminCompany) {
                return res.status(404).json({ error: 'Admin Company not found' });
            }
            employee.adminUserId = adminCompany._id;
            employee.adminCompanyName = req.body.adminCompanyName;
        }

        if (req.body.phoneNumber) {
            employee.phoneNumber = req.body.phoneNumber; // Update phoneNumber
        }

        // Save the updated employee
        await employee.save();

        res.status(200).json({ message: 'Employee updated successfully', employee });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Route to delete an employee by ID
router.delete('/delete/:id', async (req, res) => {
    const employeeId = req.params.id;

    try {
        // Use findByIdAndDelete to delete the employee by ID
        const deletedEmployee = await Employee.findByIdAndDelete(employeeId);

        if (!deletedEmployee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// List of all Admin
// http://localhost:5000/api/employee/list
router.get('/list', async (req, res) => {
    try {
        // Retrieve all employee records from the database
        const employees = await Employee.find();

        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Get single Admin
router.get('/:id', async (req, res) => {
    const employeeId = req.params.id;

    try {
        // Find the employee by ID
        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// create Employee
router.post('/registersub', [
    // Validation rules using express-validator
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('adminCompanyName').notEmpty().withMessage('Admin Company Name is required'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number format'), // Add phone number validation

], jwtMiddleware, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if the authenticated user (admin) exists and has the necessary privileges

        const authenticatedUser = req.user; // Get the authenticated user

        console.log('authenticatedUser:', authenticatedUser);
        if (!authenticatedUser || authenticatedUser.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Create the sub-employee and associate it with the company
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        console.log('hashedPassword:', hashedPassword);

        const newSubEmployee = new SubEmployee({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber, // Add phoneNumber
            adminUserId: authenticatedUser._id, // Assign the adminUserId from the authenticated user
            adminCompanyName: authenticatedUser.adminCompanyName,
            // companyId: authenticatedUser.companyId, // Assign the companyId from the authenticated user
        });

        const subEmployee = await newSubEmployee.save();
        console.log(subEmployee)

        res.status(201).json({ message: 'Sub-employee registered successfully', subEmployee });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// List of all Employees
router.get('/subemployees/list', jwtMiddleware, async (req, res) => {
    try {
        const authenticatedUser = req.user;

        console.log('Authenticated User:', authenticatedUser);

        if (!authenticatedUser) {
            console.error('Access denied: User not authenticated');
            return res.status(403).json({ error: 'Access denied: User not authenticated' });
        }

        let employees;

        if (authenticatedUser.role === 'admin') {
            console.log('Admin Company Name:', authenticatedUser.adminCompanyName);
            // Fetch Subemployees based on adminCompanyName
            employees = await SubEmployee.find({ adminCompanyName: authenticatedUser.adminCompanyName });
        } else {
            console.log('Employee Company Name:', authenticatedUser.companyName);
            // Fetch Employees based on companyName
            employees = await SubEmployee.find({ adminCompanyName: authenticatedUser.adminCompanyName });
        }

        console.log('Employees:', employees);
        res.status(200).json(employees);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/subemployee/list', async (req, res) => {
    try {

        let employees;

        employees = await SubEmployee.find();

        console.log('Employees:', employees);

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Get company of Employee
router.get('/subemployees/company', jwtMiddleware, async (req, res) => {
    try {
        const authenticatedUser = req.user;

        console.log('Authenticated User:', authenticatedUser);

        if (authenticatedUser.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Not an admin' });
        }

        const company = await Company.findOne({ _id: authenticatedUser.adminUserId });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.status(200).json(company);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router;
