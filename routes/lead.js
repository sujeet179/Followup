// routes/lead.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const jwtMiddleware = require('../jwtmiddleware');
const multer = require('multer');
const path = require('path');
const LeadNotification = require('../models/LeadNotification');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine the destination folder based on the file type
        if (file.fieldname === 'leadPicture') { // New field for Lead pictures
            cb(null, 'uploads/leadPicture')
        } else {
            cb(new Error('Invalid file fieldname'));
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});

const upload = multer({ storage });


// Create a new lead by an authenticated Admin or SubEmployee
router.post('/createLead', upload.single('leadPicture'), [
    body('customerName').notEmpty().withMessage('Customer Name is required'),
    body('companyName').notEmpty().withMessage('Company Name is required'),
    body('contactNo').isMobilePhone().notEmpty().withMessage('Contact No is required'),
    body('email').isEmail().notEmpty().withMessage('Invalid email format'),
    body('description').notEmpty().withMessage('Description is required'),
    body('ownerName').optional(), // ownerName is optional
    body('website').optional(), // website is optional
    body('leadPicture').optional(), // photo is optional
], jwtMiddleware, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.user) {
        try {
            const { customerName, companyName, contactNo, email, description, ownerName, website } = req.body;

            const leadPicture = req.file ? req.file.path : null; // This assumes req.file.path contains the file path


            const lead = new Lead({
                customerName,
                companyName,
                contactNo,
                email,
                description,
                ownerName,
                website,
                leadPicture,
                assignedBy: req.user.subEmployeeId || req.user.employeeId, // Use subEmployeeId if it exists, otherwise use employeeId
                assignedByName: req.user.name, // Add the name of the Admin or SubEmployee
                // Assign other fields here
            });

            const savedLead = await lead.save();
            res.json(savedLead);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
});



// Edit a lead by ID
router.put('/editLead/:leadId', jwtMiddleware, async (req, res) => {
    try {
        const { customerName, companyName, contactNo, email, description, ownerName, website, leadPicture } = req.body;
        const leadId = req.params.leadId;

        // Find the lead
        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Check if the user is the creator of the lead
        if (lead.assignedBy.toString() === req.user.subEmployeeId || req.user.role === 'admin') {
            // The user is authorized to edit this lead
            const updatedLead = await Lead.findByIdAndUpdate(leadId, {
                customerName,
                companyName,
                contactNo,
                email,
                description,
                ownerName,
                website,
                leadPicture, // Include the leadPicture field
                // Update other fields as needed
            }, { new: true });

            if (!updatedLead) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            res.json(updatedLead);
        } else {
            // If the user didn't create the lead, deny access
            res.status(403).json({ error: 'Access denied' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});




// Delete a lead by ID
router.delete('/deleteLead/:leadId', jwtMiddleware, async (req, res) => {
    try {
        const leadId = req.params.leadId;
        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Check if the user is the creator of the lead
        if (lead.assignedBy.toString() === req.user.subEmployeeId || req.user.role === 'admin') {
            // The user is authorized to delete this lead
            const deletedLead = await Lead.findByIdAndDelete(leadId);
            if (!deletedLead) {
                return res.status(404).json({ error: 'Lead not found' });
            }
            res.json({ message: 'Lead deleted successfully' });
        } else {
            // If the user didn't create the lead, deny access
            res.status(403).json({ error: 'Access denied' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// View a lead by ID
// router.get('/viewLead/:leadId', jwtMiddleware, async (req, res) => {
//     try {
//         const leadId = req.params.leadId;
//         const lead = await Lead.findById(leadId);

//         if (!lead) {
//             return res.status(404).json({ error: 'Lead not found' });
//         }

//         // Check if the user is the creator of the lead
//         if (lead.assignedBy.toString() === req.user.subEmployeeId) {
//             // The user is authorized to view this lead
//             res.json(lead);
//         } else {
//             // If the user didn't create the lead, deny access
//             res.status(403).json({ error: 'Access denied' });
//         }
//     } catch (err) {
//         res.status(500).json({ error: 'Server error' });
//     }
// });


router.get('/viewLead/:leadId', jwtMiddleware, async (req, res) => {
    try {
        const leadId = req.params.leadId;
        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Check if the user is the creator of the lead, or if they are an employee
        if (lead.assignedBy.toString() === req.user.subEmployeeId || req.user.role === 'admin') {
            // The user is authorized to view this lead
            res.json(lead);
        } else {
            // If the user didn't create the lead and is not an employee, deny access
            res.status(403).json({ error: 'Access denied' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// router.get('/leadList', jwtMiddleware, async (req, res) => {
//     try {
//         // Get the user ID or username from the authenticated user's token
//         const userId = req.user.subEmployeeId; // Adjust this based on your authentication setup

//         // Query the database to retrieve leads created by the authenticated user
//         const leads = await Lead.find({ assignedBy: userId });
//         res.json(leads);
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// Get a list of leads created by the authenticated user (accessible by both sub-employees and employees)
// router.get('/leadList', jwtMiddleware, async (req, res) => {
//     try {
//         // Check if the user is either a sub-employee or an employee
//         if (req.user.role === 'sub-employee' || req.user.role === 'admin') {
//             // Define a variable to store the user's ID
//             let userId;

//             // Determine the user's role and set the ID accordingly
//             if (req.user.role === 'sub-employee') {
//                 userId = req.user.subEmployeeId;
//             } else if (req.user.role === 'admin') {
//                 userId = req.user.employeeId; // Add the employeeId for employees
//             }

//             // Query the database to retrieve leads created by the authenticated user
//             const leads = await Lead.find({ assignedBy: userId });
//             res.json(leads);
//         } else {
//             // If the user is not a sub-employee or an employee, deny access
//             res.status(403).json({ error: 'Access denied' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// });


router.get('/leadList', jwtMiddleware, async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.role === 'admin') {
            // Query the database to retrieve all leads
            const leads = await Lead.find();
            res.json(leads);
        } else if (req.user.role === 'sub-employee') {
            // Get the user's ID
            const userName = req.user.name;

            // Query the database to retrieve leads assigned to the authenticated sub-employee
            const leads = await Lead.find({ assignedByName: userName });
            res.json(leads);
        } else {
            // If the user is not a sub-employee or an admin, deny access
            res.status(403).json({ error: 'Access denied' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


// router.post('/create/Notification', jwtMiddleware, async (req, res) => {
//     try {
//         const userId = req.user.role === 'admin' ? req.user.employeeId : req.user.subEmployeeId;
//         const assignedByName = req.user.name;
//         const { message, description, customerName, companyName, contactNo, email, ownerName, website, leadPicture } = req.body;

//         // Create a new lead notification using a single model
//         const notification = new LeadNotification({
//             userId,
//             assignedByName,
//             message,
//             description,
//             customerName,
//             companyName,
//             contactNo,
//             email,
//             ownerName,
//             website,
//             leadPicture,
//         });

//         // Save the notification to the database
//         await notification.save();

//         res.status(201).json({ message: 'Lead notification sent successfully' });
//     } catch (error) {
//         console.error('Error creating lead notification:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


router.post('/create/Notification', jwtMiddleware, upload.single('leadPicture'), async (req, res) => {
    try {
        const userId = req.user.role === 'admin' ? req.user.employeeId : req.user.subEmployeeId;
        const assignedByName = req.user.name;
        const { message, description, customerName, companyName, contactNo, email, ownerName, website } = req.body;

        // File details from the uploaded file (Multer saves these details in req.file)
        const leadPicture = req.file ? req.file.filename : null;

        // Create a new lead notification using a single model
        const notification = new LeadNotification({
            userId,
            assignedByName,
            message,
            description,
            customerName,
            companyName,
            contactNo,
            email,
            ownerName,
            website,
            leadPicture, // Assign the uploaded file name or null if no file was uploaded
        });

        // Save the notification to the database
        await notification.save();

        res.status(201).json({ message: 'Lead notification sent successfully' });
    } catch (error) {
        console.error('Error creating lead notification:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create Lead
// router.post('/create/Notification', jwtMiddleware, async (req, res) => {
//     try {
//         const subEmployeeId = req.user.subEmployeeId; // Get the ID of the admin creating the lead
//         const assignedByName = req.user.name; // Get the assigned by name

//         const { message, description, customerName, companyName, contactNo, email, ownerName, website, leadPicture } = req.body;

//         // Create a new lead notification with the userId (admin)
//         const notification = new LeadNotification({
//             userId: subEmployeeId, // ID of the admin creating the lead
//             assignedByName,
//             message,
//             description,
//             customerName,
//             companyName,
//             contactNo,
//             email,
//             ownerName,
//             website,
//             leadPicture,
//         });

//         // Save the lead notification to the database
//         await notification.save();

//         res.status(201).json({ message: 'Lead notification sent successfully' });
//     } catch (error) {
//         console.error('Error creating lead notification:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



// GET route to retrieve lead notifications for a specific subemployee
router.get('/notifications', async (req, res) => {
    try {
        // Retrieve lead notifications for the subemployee with the specified subEmployeeId
        const leadNotifications = await LeadNotification.find({isRead: false }).sort({ createdAt: -1 });

        res.status(200).json(leadNotifications);
    } catch (error) {
        console.error('Error retrieving lead notifications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.put('/notifications/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        // Find the lead notification by ID and check if it's associated with the subemployee
        const leadNotification = await LeadNotification.findOne({ _id: notificationId });

        if (!leadNotification) {
            return res.status(404).json({ error: 'Lead notification not found or not associated with the subemployee' });
        }

        // Mark the lead notification as read
        leadNotification.isRead = true;

        // Save the updated lead notification
        await leadNotification.save();

        res.status(200).json({ message: 'Lead notification marked as read' });
    } catch (error) {
        console.error('Error marking lead notification as read:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;


// PUT route to edit a lead
// router.put('/create/Notification/edit/:leadId', jwtMiddleware, async (req, res) => {
//     try {
//         const leadId = req.params.leadId;
//         const updatedData = req.body; // Data to update the lead

//         // Find the lead by its ID and update it
//         const lead = await LeadNotification.findById(leadId);

//         if (!lead) {
//             return res.status(404).json({ error: 'Lead not found' });
//         }

//         if (req.user.subEmployeeId.toString() !== lead.userId.toString()) {
//             return res.status(403).json({ error: 'Not authorized to edit this lead' });
//         }

//         const updatedLead = await LeadNotification.findByIdAndUpdate(leadId, updatedData, { new: true });

//         res.status(200).json({ message: 'Lead updated successfully', lead: updatedLead });
//     } catch (error) {
//         console.error('Error editing lead:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



module.exports = router;

