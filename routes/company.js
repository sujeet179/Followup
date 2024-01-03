const { Router } = require('express')
const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const Employee = require('../models/Employee');
const SubEmployee = require('../models/SubEmployee');
const Task = require('../models/Task');


//  Create Company
//  http://localhost:5000/api/company/createCompany
router.post('/createCompany',
    [
        // Validation rules using express-validator
        body('companyName').notEmpty().withMessage('Company Name is required'),
        // Add more validation rules for other fields if needed
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { companyName } = req.body
        try {
            const company = new Company({ companyName });
            await company.save();
            res.status(201).json({ message: 'Company created successfully', company });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);


// List of Companies
// http://localhost:5000/api/company/companies
router.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find(); // Retrieve all companies from the database
        res.status(200).json(companies);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//  get companyCounts 
// router.get('/companyCounts', async (req, res) => {
//     try {
//       // Fetch the counts for the Company
//       const totalCompanies = await Company.countDocuments();
//       const totalEmployees = await SubEmployee.countDocuments();
      
//       // Create an object to hold the company counts
//       const companyCounts = {
//         totalCompanies,
//         totalEmployees
//       };
//       // Return the counts as JSON response
//       console.log(companyCounts)
//       res.status(200).json(companyCounts);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });
router.get('/companyCounts', async (req, res) => {
  try {
    // Fetch the counts for the Company
    const totalCompanies = await Company.countDocuments();
    const totalEmployees = await SubEmployee.countDocuments();

    // Fetch active employees who created tasks with assignedBy within the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeEmployeesCount = await Task.aggregate([
      {
        $match: {
          assignedBy: { $exists: true },
          startDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$assignedBy',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          assignedByList: { $push: '$_id' }, // Capture the assignedBy values
        },
      },
    ]);

    // Extract the count and assignedByList from the aggregation result
    const countResult = activeEmployeesCount[0];
    const uniqueActiveEmployeesCount = countResult ? countResult.count : 0;
    const assignedByList = countResult ? countResult.assignedByList : [];

    // Fetch inactive employees who haven't created tasks since the last 7 days
    let inactiveEmployeesCount = await SubEmployee.countDocuments({
      _id: { $nin: assignedByList }, // Exclude active employees
    });

    // Calculate inactiveEmployeesCount by subtracting activeEmployeesCount from totalEmployees
    inactiveEmployeesCount = totalEmployees - uniqueActiveEmployeesCount;

    // Create an object to hold the company counts
    const companyCounts = {
      totalCompanies,
      totalEmployees,
      uniqueActiveEmployeesCount,
      inactiveEmployeesCount,
    };

    // Return the counts as JSON response
    console.log(companyCounts);
    res.status(200).json(companyCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/companies/:adminCompanyName', async (req, res) => {
    try {
        const adminCompanyName = req.params.adminCompanyName;

        // Use Mongoose to find employees associated with the provided adminCompanyName
        const employees = await Employee.find({ adminCompanyName });

        if (!employees || employees.length === 0) {
            // If no employees are found, send a 404 response
            return res.status(404).json({ error: 'No employees found for this company.' });
        }

        // If employees are found, send them in the response
        res.json(employees);
    } catch (error) {
        // Handle any errors that occur during the query
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// View single company
router.get('/companies/:id', async (req, res) => {
    const companyId = req.params.id;

    try {
        const company = await Company.findById(companyId);

        if (!company) {
            // If the company with the specified ID doesn't exist
            return res.status(404).json({ error: 'Company not found' });
        }

        res.status(200).json(company);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Delete company
// http://localhost:5000/api/company/companies/:id
router.delete('/companies/:id', async (req, res) => {
    const companyId = req.params.id;
    try {

        let deletedCompany = await Company.findById(req.params.id)
        if (!deletedCompany) { return res.status(404).send("Company not found") }

        deletedCompany = await Company.findByIdAndDelete(companyId);

        res.status(200).json({ message: 'Company deleted successfully', company: deletedCompany });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Edit Company
router.put('/companies/:id', [
    // Validation rules using express-validator
    body('companyName').notEmpty().withMessage('Company Name is required'),

], async (req, res) => {
    const companyId = req.params.id;
    const { companyName } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const updatedCompany = await Company.findByIdAndUpdate(
            companyId,
            { companyName },
            { new: true } // Return the updated document
        );

        if (!updatedCompany) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.status(200).json({ message: 'Company updated successfully', company: updatedCompany });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router

