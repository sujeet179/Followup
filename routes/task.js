const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Task = require('../models/Task'); // Import your Task model
const SubEmployee = require('../models/SubEmployee');
const jwtMiddleware = require('../jwtmiddleware');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');

// Configure multer to use specific destinations for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the destination folder based on the file type
    if (file.fieldname === 'picture') {
      cb(null, 'uploads/pictures'); // Save pictures in the "pictures" folder
    } else if (file.fieldname === 'audio') {
      cb(null, 'uploads/audio'); // Save audio files in the "audio" folder
    } else if (file.fieldname === 'profilePicture') {
      cb(null, 'uploads/profile-pictures'); // Save profile pictures in the "profile-pictures" folder
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


// API to upload profile-Picture
router.post('/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Assuming you have a base URL where your profile pictures are served
    const profilePictureURL = `http://localhost:5000/uploads/profile-pictures/${req.file.filename}`;
    console.log(profilePictureURL)
    res.json({ profilePictureURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API to get all counts on dashboard for Employee
router.get('/taskCounts', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the user's ID from the JWT token
    const userId = req.user.subEmployeeId; // Make sure you have the user ID available in the request
    // Fetch the counts from your database
    const receivedTasks = await Task.countDocuments({ assignTo: userId });
    const completedTasks = await Task.countDocuments({ assignTo: userId, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ assignTo: userId, status: 'pending' });
    const overdueTasks = await Task.countDocuments({ assignTo: userId, status: 'pending', deadlineDate: { $lt: new Date() } });
    const todayAddedTasks = await Task.countDocuments({ assignedBy: userId, startDate: new Date().toISOString().split('T')[0] });
    const sendTasks = await Task.countDocuments({ assignedBy: userId });

    // Create an object to hold the task counts
    const taskCounts = {
      receivedTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayAddedTasks,
      sendTasks
    };

    // Return the counts as JSON response
    console.log(taskCounts)
    res.status(200).json(taskCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})


// API to get all counts on dashboard for Admin
router.get('/adminTaskCounts', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the admin's ID from the JWT token
    const adminId = req.user.employeeId; // Modify this based on how your admin user is identified

    // Fetch the counts for the admin
    const totalEmployeeTasks = await Task.countDocuments({ assignedBy: adminId });
    const completedTasks = await Task.countDocuments({ assignedBy: adminId, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ assignedBy: adminId, status: 'pending' });
    const overdueTasks = await Task.countDocuments({ assignedBy: adminId, status: 'pending', deadlineDate: { $lt: new Date() } });
    const todayAddedTasks = await Task.countDocuments({ assignedBy: adminId, startDate: new Date().toISOString().split('T')[0] });
    const sendTasks = await Task.countDocuments({ assignedBy: adminId });

    // Create an object to hold the admin's task counts
    const adminTaskCounts = {
      totalEmployeeTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayAddedTasks,
      sendTasks
    };

    // Return the counts as JSON response
    res.status(200).json(adminTaskCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// Create Task API
router.post('/create', upload.fields([{ name: 'picture', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), [
  // Validation rules using express-validator
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('assignTo').isArray().withMessage('Assignees are required'),
  // body('assignTo').notEmpty().withMessage('subEmployee ID is required'),
  body('startDate').notEmpty().withMessage('Start Date is required'),
  body('deadlineDate').notEmpty().withMessage('Deadline Date is required'),
  body('startTime').notEmpty().withMessage('Start Time is required'),
  body('endTime').notEmpty().withMessage('End Time is required'),
], jwtMiddleware, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, startDate, startTime, deadlineDate, endTime, assignTo } = req.body;
  let picturePath; // Initialize picturePath as undefined
  let audioPath; // Initialize audioPath as undefined

  // Check if picture and audio files were included in the request
  if (req.files && req.files.picture && req.files.audio) {
    picturePath = req.files.picture[0].path;
    audioPath = req.files.audio[0].path;
  }

  try {
    const assignedBy = req.user.employeeId;

    // Validate if the specified employees exist
    const employees = await SubEmployee.find({ _id: { $in: assignTo } });
    if (employees.length !== assignTo.length) {
      const nonExistentEmployees = assignTo.filter(empId => !employees.map(emp => emp._id.toString()).includes(empId));
      return res.status(404).json({ error: `Employees with IDs ${nonExistentEmployees.join(', ')} not found` });
    }

    const tasks = assignTo.map(assigneeId => {
      const employee = employees.find(emp => emp._id.toString() === assigneeId);
      return new Task({
        title,
        description,
        startDate,
        startTime,
        deadlineDate,
        endTime,
        assignTo: employee._id,
        assignedBy,
        phoneNumber: employee.phoneNumber,
        picture: picturePath,
        audio: audioPath,
      });
    });

    await Task.insertMany(tasks);
    res.status(201).json({ message: 'Tasks created successfully', tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/createSubemployeeTask', upload.fields([{ name: 'picture', maxCount: 1 }, { name: 'audio', maxCount: 1 }]),
  [
    // Validation rules using express-validator
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    // body('assignTo').notEmpty().withMessage('Subemployee ID is required'),
    body('assignTo').isArray().withMessage('Assignees are required'),
    body('startDate').notEmpty().withMessage('Start Date is required'),
    body('deadlineDate').notEmpty().withMessage('Deadline Date is required'),
    body('startTime').notEmpty().withMessage('Start Time is required'),
    body('endTime').notEmpty().withMessage('End Time is required'),
  ],
  jwtMiddleware,
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, startDate, startTime, deadlineDate, endTime, assignTo } = req.body;
    let picturePath; // Initialize picturePath as undefined
    let audioPath; // Initialize audioPath as undefined

    // Check if picture and audio files were included in the request
    if (req.files && req.files.picture && req.files.audio) {
      picturePath = req.files.picture[0].path;
      audioPath = req.files.audio[0].path;
    }

    //     try {
    //       const assignedBy = req.user.subEmployeeId;

    //       // Check if the specified employee (Subemployee) exists and belongs to the same company
    //       const assignedEmployee = await SubEmployee.findOne({
    //         _id: assignTo,
    //         adminCompanyName: req.user.adminCompanyName, // Assuming adminCompanyName is available in the user's JWT
    //       });

    //       if (!assignedEmployee) {
    //         return res.status(404).json({ error: 'Subemployee not found or does not belong to the same company' });
    //       }

    //       // Create a new task and associate it with the employee
    //       const task = new Task({
    // title,
    // description,
    // startDate,
    // startTime,
    // deadlineDate,
    // endTime,
    // assignTo,
    // assignedBy,
    // picture: picturePath, // Store the path to the uploaded picture (may be undefined)
    // audio: audioPath, // Store the path to the recorded audio (may be undefined)
    //       });

    //       await task.save();

    //       res.status(201).json({ message: 'Task created successfully', task });
    //     } catch (error) {
    //       res.status(500).json({ error: 'Internal Server Error' });
    //     }
    //   }
    // );
    try {
      const assignedBy = req.user.subEmployeeId;

      // Validate if the specified employees exist
      const employees = await SubEmployee.find({ _id: { $in: assignTo } });
      if (employees.length !== assignTo.length) {
        const nonExistentEmployees = assignTo.filter(empId => !employees.map(emp => emp._id.toString()).includes(empId));
        return res.status(404).json({ error: `Employees with IDs ${nonExistentEmployees.join(', ')} not found` });
      }

      const tasks = assignTo.map(assigneeId => {
        const employee = employees.find(emp => emp._id.toString() === assigneeId);
        return new Task({
          title,
          description,
          startDate,
          startTime,
          deadlineDate,
          endTime,
          assignTo: employee._id,
          assignedBy,
          // phoneNumber: employee.phoneNumber,
          picture: picturePath,
          audio: audioPath,
        });
      });

      await Task.insertMany(tasks);
      res.status(201).json({ message: 'Tasks created successfully', tasks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });



// API to get all task list
// router.get('/list', jwtMiddleware, async (req, res) => {
//   try {
//     // Retrieve the user's ID from the JWT token
//     const userId = req.user.employeeId;

//     // Find tasks where the assignedBy field matches the user's ID
//     const tasks = await Task.find({ assignedBy: userId });

//     if (!tasks) {
//       // If no task is found with the given ID, return a 404 response
//       return res.status(404).json({ error: 'Task not found' });
//     }

//     // Send the list of tasks as a JSON response
//     res.json({ tasks });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// get list of all admins in one company
router.get('/list', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the user's ID from the JWT token
    const userId = req.user.employeeId;

    // Find the company ID associated with the given admin user ID
    const userCompany = await Employee.findOne({ _id: userId }).select('adminCompanyName');
    console.log(userCompany)
    if (!userCompany) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all admins from the same company as the given admin user
    const companyAdmins = await Employee.find({
      adminUserId: req.user.adminUserId,
      adminCompanyName: userCompany.adminCompanyName
    });
    console.log(companyAdmins)
    if (!companyAdmins || companyAdmins.length === 0) {
      return res.status(404).json({ error: 'Admins not found for the company' });
    }

    // Get an array of admin IDs from the found company admins
    const adminIds = companyAdmins.map(admin => admin._id);

    // Fetch tasks where assignedBy field matches any of the admin IDs
    const tasks = await Task.find({
      assignedBy: { $in: adminIds }
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: 'Tasks not found' });
    }

    // Send the list of tasks as a JSON response
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.get('/listTaskEmp', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the user's ID from the JWT token
    const userId = req.user.subEmployeeId;

    // Find tasks where the assignedBy field matches the user's ID
    const tasks = await Task.find({ assignTo: userId });

    if (!tasks) {
      // If no task is found with the given ID, return a 404 response
      return res.status(404).json({ error: 'Task not found' });
    }

    // Send the list of tasks as a JSON response
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Route to get a single task and assigned by name of Admin
router.get('/:taskId', jwtMiddleware, async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Retrieve the task by its ID from the database
    const task = await Task.findById(taskId).populate('assignedBy', 'name');

    if (!task) {
      // If no task is found with the given ID, return a 404 response
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to get active users (created tasks within the last 7 days)
// router.get('/tasks/active-users', async (req, res) => {
//   try {
//     // Calculate the date 7 days ago
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     // Find the most recent task created by each employee within the last 7 days
//     const activeEmployees = await Task.aggregate([
//       {
//         $match: {
//           assignedBy: { $exists: true },
//           startDate: { $gt: sevenDaysAgo },
//         },
//       },
//       {
//         $group: {
//           _id: '$assignedBy',
//           latestTaskStartDate: { $max: '$startDate' },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           employeeId: '$_id',
//         },
//       },
//     ]);

//     if (!activeEmployees || activeEmployees.length === 0) {
//       // If no active employees are found, return an empty array
//       return res.status(200).json([]);
//     }

//     // Use $lookup to fetch details from both Employee and SubEmployee collections
//     const activeEmployeeDetails = await Task.aggregate([
//       {
//         $match: {
//           assignedBy: { $in: activeEmployees.map(emp => emp.employeeId) },
//         },
//       },
//       {
//         $lookup: {
//           from: 'employees', // The name of the Employee collection
//           localField: 'assignedBy',
//           foreignField: '_id',
//           as: 'employeeDetails',
//         },
//       },
//       {
//         $lookup: {
//           from: 'subemployees', // The name of the SubEmployee collection
//           localField: 'assignedBy',
//           foreignField: '_id',
//           as: 'subEmployeeDetails',
//         },
//       },
//       {
//         $project: {
//           employeeDetails: 1,
//           subEmployeeDetails: 1,
//         },
//       },
//     ]);

//     // Extract and format the relevant details
//     const formattedDetails = activeEmployeeDetails.map(entry => {
//       const employee = entry.employeeDetails[0] || {};
//       const subEmployee = entry.subEmployeeDetails[0] || {};

//       return {
//         name: employee.name || subEmployee.name,
//         phoneNumber:employee.phoneNumber ||  subEmployee.phoneNumber,
//         email: employee.email || subEmployee.email,
//         adminCompanyName: employee.adminCompanyName || subEmployee.adminCompanyName,
//       };
//     });

//     res.status(200).json(formattedDetails);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// // Route to get inactive users (created tasks earlier than 7 days)
// router.get('/tasks/inactive-users', async (req, res) => {
//   try {
//     // Calculate the date 7 days ago
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     // Find inactive employees from Employee model
//     const inactiveEmployeesEmployee = await Employee.aggregate([
//       {
//         $lookup: {
//           from: 'tasks', // The name of the Task collection
//           localField: '_id',
//           foreignField: 'assignedBy',
//           as: 'tasks',
//         },
//       },
//       {
//         $unwind: {
//           path: '$tasks',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: {
//           $or: [
//             { 'tasks.startDate': { $lt: sevenDaysAgo } },
//             { 'tasks.startDate': { $exists: false } }, // Exclude employees with no tasks
//           ],
//         },
//       },
//       {
//         $group: {
//           _id: '$_id',
//           latestTaskStartDate: { $max: '$tasks.startDate' },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           employeeId: '$_id',
//           latestTaskStartDate: 1,
//         },
//       },
//     ]);

//     // Find inactive employees from SubEmployee model
//     const inactiveEmployeesSubEmployee = await SubEmployee.aggregate([
//       {
//         $lookup: {
//           from: 'tasks', // The name of the Task collection
//           localField: '_id',
//           foreignField: 'assignedBy',
//           as: 'tasks',
//         },
//       },
//       {
//         $unwind: {
//           path: '$tasks',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $match: {
//           $or: [
//             { 'tasks.startDate': { $lt: sevenDaysAgo } },
//             { 'tasks.startDate': { $exists: false } }, // Exclude employees with no tasks
//           ],
//         },
//       },
//       {
//         $group: {
//           _id: '$_id',
//           latestTaskStartDate: { $max: '$tasks.startDate' },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           employeeId: '$_id',
//           latestTaskStartDate: 1,
//         },
//       },
//     ]);

//     // Combine inactive employees from both models
//     const inactiveEmployees = [...inactiveEmployeesEmployee, ...inactiveEmployeesSubEmployee];

//     if (!inactiveEmployees || inactiveEmployees.length === 0) {
//       // If no inactive employees are found, return an empty array
//       return res.status(200).json([]);
//     }

//     // Use $lookup to fetch details from both Employee and SubEmployee collections
//     const inactiveEmployeeDetails = await Employee.aggregate([
//       {
//         $match: {
//           _id: { $in: inactiveEmployees.map(emp => emp.employeeId) },
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           phoneNumber: 1,
//           email: 1,
//           adminCompanyName: 1,
//         },
//       },
//     ]);

//     res.status(200).json(inactiveEmployeeDetails);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// Route to get active users (created tasks within the last 7 days)
router.get('/tasks/active-users', async (req, res) => {
  try {
    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find active employees from Employee model
    const activeEmployeesEmployee = await Employee.aggregate([
      {
        $lookup: {
          from: 'tasks', // The name of the Task collection
          localField: '_id',
          foreignField: 'assignedBy',
          as: 'tasks',
        },
      },
      {
        $unwind: {
          path: '$tasks',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'tasks.startDate': { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
        },
      },
    ]);

    // Find active employees from SubEmployee model
    const activeEmployeesSubEmployee = await SubEmployee.aggregate([
      {
        $lookup: {
          from: 'tasks', // The name of the Task collection
          localField: '_id',
          foreignField: 'assignedBy',
          as: 'tasks',
        },
      },
      {
        $unwind: {
          path: '$tasks',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'tasks.startDate': { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
        },
      },
    ]);

    // Combine active employees from both models
    const activeEmployees = [...activeEmployeesEmployee, ...activeEmployeesSubEmployee];

    if (!activeEmployees || activeEmployees.length === 0) {
      // If no active employees are found, return an empty array
      return res.status(200).json([]);
    }

    // Use $lookup to fetch details from both Employee and SubEmployee collections
    const activeEmployeeDetails = await Employee.aggregate([
      {
        $match: {
          _id: { $in: activeEmployees.map(emp => emp.employeeId) },
        },
      },
      {
        $project: {
          name: 1,
          phoneNumber: 1,
          email: 1,
          adminCompanyName: 1,
        },
      },
    ]);

    res.status(200).json(activeEmployeeDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get inactive users (created tasks earlier than 7 days)

// Route to get inactive users (created tasks earlier than 7 days or never created)
router.get('/tasks/inactive-users', async (req, res) => {
  try {
    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find inactive employees from Employee model
    const inactiveEmployeesEmployee = await Employee.aggregate([
      {
        $lookup: {
          from: 'tasks', // The name of the Task collection
          localField: '_id',
          foreignField: 'assignedBy',
          as: 'tasks',
        },
      },
      {
        $match: {
          $or: [
            { 'tasks.startDate': { $lt: sevenDaysAgo } },
            { tasks: { $exists: false } }, // Include employees with no tasks
          ],
        },
      },
      {
        $group: {
          _id: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
        },
      },
    ]);

    // Find inactive employees from SubEmployee model
    const inactiveEmployeesSubEmployee = await SubEmployee.aggregate([
      {
        $lookup: {
          from: 'tasks', // The name of the Task collection
          localField: '_id',
          foreignField: 'assignedBy',
          as: 'tasks',
        },
      },
      {
        $match: {
          $or: [
            { 'tasks.startDate': { $lt: sevenDaysAgo } },
            { tasks: { $exists: false } }, // Include employees with no tasks
          ],
        },
      },
      {
        $group: {
          _id: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
        },
      },
    ]);

    // Combine inactive employees from both models
    const inactiveEmployees = [...inactiveEmployeesEmployee, ...inactiveEmployeesSubEmployee];

    if (!inactiveEmployees || inactiveEmployees.length === 0) {
      // If no inactive employees are found, return an empty array
      return res.status(200).json([]);
    }

    // Use $lookup to fetch details from both Employee and SubEmployee collections
    const inactiveEmployeeDetails = await Employee.aggregate([
      {
        $match: {
          _id: { $in: inactiveEmployees.map(emp => emp.employeeId) },
        },
      },
      {
        $project: {
          name: 1,
          phoneNumber: 1,
          email: 1,
          adminCompanyName: 1,
        },
      },
    ]);

    res.status(200).json(inactiveEmployeeDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// pending list
router.get('/tasks/pending', jwtMiddleware, async (req, res) => {
  try {
    const userId = req.user.employeeId;

    // Find the company ID associated with the given admin user ID
    const userCompany = await Employee.findOne({ _id: userId }).select('adminCompanyName');

    if (!userCompany) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all admins from the same company as the given admin user
    const companyAdmins = await Employee.find({
      adminUserId: req.user.adminUserId,
      adminCompanyName: userCompany.adminCompanyName
    });

    if (!companyAdmins || companyAdmins.length === 0) {
      return res.status(404).json({ error: 'Admins not found for the company' });
    }

    // Get an array of admin IDs from the found company admins
    const adminIds = companyAdmins.map(admin => admin._id);

    // Find pending tasks where assignedBy field matches any of the admin IDs
    const tasks = await Task.find({
      assignedBy: { $in: adminIds },
      status: 'pending'
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: 'Pending tasks not found' });
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//  Get pending task to Employee
router.get('/tasks/pendingByEmp', jwtMiddleware, async (req, res) => {
  try {
    const userId = req.user.subEmployeeId; // Replace with how you identify the employee/admin

    // Find pending tasks assigned to the logged-in subemployee
    const tasks = await Task.find({ assignTo: userId, status: 'pending' });

    if (!tasks) {
      // If no task is found with the given ID, return a 404 response
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Mark Task as Complete task
router.put('/complete/:taskId', jwtMiddleware, async (req, res) => {
  const taskId = req.params.taskId;

  try {
    // Find the task by ID and update its status
    const task = await Task.findByIdAndUpdate(taskId, { status: 'completed' });

    if (!task) {
      // If no task is found with the given ID, return a 404 response
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task marked as complete' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// list of all completed task to Admin
router.get('/tasks/completed', jwtMiddleware, async (req, res) => {
  try {
    const userId = req.user.employeeId;

    // Find all tasks with a status of 'completed'
    const completedTasks = await Task.find({ status: 'completed', assignedBy: userId });

    // Send the list of completed tasks as a JSON response
    res.json({ completedTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// List of all completed task to Employee
router.get('/tasks/completedByEmp', jwtMiddleware, async (req, res) => {
  try {
    const userId = req.user.subEmployeeId;

    // Find all tasks with a status of 'completed'
    const completedTasks = await Task.find({ status: 'completed', assignTo: userId });

    // Send the list of completed tasks as a JSON response
    res.json({ completedTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// mark as open for Admin
router.put('/open/:taskId', jwtMiddleware, async (req, res) => {
  const taskId = req.params.taskId;
  const updates = req.body;

  try {
    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if you need to update the status to "pending"
    if (
      req.body.startDate !== task.startDate ||
      req.body.deadlineDate !== task.deadlineDate ||
      req.body.assignTo !== task.assignTo
    ) {
      task.status = 'pending';
    }

    // Save the updated task
    await task.save();

    return res.status(200).json({ message: 'Task updated', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Edit the tasks
router.put('/edit/:taskId', jwtMiddleware, upload.fields([{ name: 'picture', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
  try {
    const taskId = req.params.taskId;
    console.log('Received taskId:', taskId); // Add this line to log the received taskId

    const updatedTaskData = JSON.parse(req.body.taskData); // Extract the task data from the JSON string

    // Retrieve the task by its ID from the database
    const task = await Task.findById(taskId);
    console.log(task)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if the authenticated user has permission to edit the task (e.g., ownership)
    // if (task.assignedBy.toString() !== req.user.employeeId) {
    if (task.assignedBy.toString() !== req.user.employeeId && task.assignedBy.toString() !== req.user.subEmployeeId) {

      return res.status(403).json({ error: 'Unauthorized: You are not the creator of this task' });
    }

    // Update task data except for picture
    for (const key in updatedTaskData) {
      if (Object.prototype.hasOwnProperty.call(updatedTaskData, key) && key !== 'picture') {
        task[key] = updatedTaskData[key];
      }
    }


    // Check if a new picture file was uploaded and update the task's picture field
    if (req.files['picture']) {
      task.picture = `uploads/pictures/${req.files['picture'][0].filename}`; // Update the picture URL
      console.log(req.file)
    }

    if (req.files['audio']) {
      task.audio = `uploads/audio/${req.files['audio'][0].filename}`; // Update the audio URL
    }
    // Save the updated task back to the database
    const newTask = await task.save();

    res.status(200).json({ message: 'Task updated successfully', newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Delete Task API Endpoint
router.delete('/delete/:taskId', jwtMiddleware, async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Retrieve the task by its ID from the database
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify if the user is authorized to delete the task (e.g., check if they are the creator or have permission)
    // if (task.assignedBy.toString() !== req.user.employeeId) {
    if (task.assignedBy.toString() !== req.user.employeeId && task.assignedBy.toString() !== req.user.subEmployeeId) {

      return res.status(403).json({ error: 'Unauthorized: You are not the creator of this task' });

    }

    // Delete the task from the database using findByIdAndDelete
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// get pending/ Received task to Employee
router.get('/tasksList/assignedTo', jwtMiddleware, async (req, res) => {
  try {
    // Extract sub-employee ID from the decoded JWT token
    const subEmployeeId = req.user.subEmployeeId;
    console.log(subEmployeeId)
    // Find tasks assigned to the sub-employee
    const tasks = await Task.find({ assignTo: subEmployeeId, status: 'pending' }).populate('assignedBy', 'name');
    console.log(tasks)

    if (!tasks) {
      // If no tasks are found, return an empty array or an appropriate response
      return res.status(404).json({ error: 'No tasks found' });
    }

    // Return the list of tasks as a JSON response
    res.status(200).json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Get overdue task to Admin
router.get('/tasks/overdue', jwtMiddleware, async (req, res) => {
  try {
    const userId = req.user.employeeId;
    console.log('User ID:', userId);

    const currentDate = new Date()
    const overdueTasks = await Task.find({
      assignedBy: userId,
      deadlineDate: { $lte: currentDate }, // Filter tasks with a deadlineDate in the past or equal to the current date
      status: "pending"
    });

    console.log("currentDate", currentDate)
    console.log('Overdue Tasks:', overdueTasks);

    if (!overdueTasks || overdueTasks.length === 0) {
      console.log('No overdue tasks found.');
      return res.status(404).json({ error: 'No overdue tasks found' });
    }

    // Return the list of overdue tasks as a JSON response
    res.status(200).json({ overdueTasks });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});


// Get overdue task for Employee
router.get('/tasks/over', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the user's ID from the JWT token
    const userId = req.user.subEmployeeId;
    console.log(new Date())
    // Find tasks where the assignTo field matches the user's ID
    const overdueTasks = await Task.find({
      assignTo: userId, // Use assignTo instead of assignedBy to find tasks assigned to the user
      deadlineDate: { $lte: new Date() }, // Filter tasks with a deadlineDate in the past
      status: "pending"
    });

    if (!overdueTasks || overdueTasks.length === 0) {
      // If no overdue tasks are found, return an appropriate response
      return res.status(404).json({ error: 'No overdue tasks found' });
    }
    // Return the list of overdue tasks as a JSON response
    res.status(200).json({ overdueTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// get tasks added on the current date to Admi  n
router.get('/tasks/today', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the user's ID from the JWT token
    const userId = req.user.employeeId;

    // Get the current date as a string in the format "YYYY-MM-DD"
    const currentDate = new Date().toISOString().split('T')[0];

    // Find tasks where the assignedBy field matches the user's ID and the startDate is equal to the current date
    const todayAddedTasks = await Task.find({
      assignedBy: userId,
      startDate: currentDate,
    });

    if (!todayAddedTasks || todayAddedTasks.length === 0) {
      // If no tasks were added today, return an appropriate response
      return res.status(404).json({ error: 'No tasks added today' });
    }

    // Return the list of tasks added today as a JSON response
    res.status(200).json({ todayAddedTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/edit/:taskId', upload.fields([{ name: 'picture', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('assignTo').notEmpty().withMessage('subEmployee ID is required'),
  body('startDate').notEmpty().withMessage('Start Date is required'),
  body('deadlineDate').notEmpty().withMessage('Deadline Date is required'),
  body('startTime').notEmpty().withMessage('Start Time is required'),
  body('endTime').notEmpty().withMessage('End Time is required'),
], jwtMiddleware, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, startDate, startTime, deadlineDate, endTime, assignTo } = req.body;
  const taskId = req.params.taskId;

  // Check if the task with the given taskId exists
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  let picturePath = task.picture; // Retain the original picture path if no new picture is provided
  let audioPath = task.audio; // Retain the original audio path if no new audio is provided

  // Check if picture and audio files were included in the request and update the paths accordingly
  if (req.files && req.files.picture && req.files.audio) {
    picturePath = req.files.picture[0].path;
    audioPath = req.files.audio[0].path;
  }

  try {
    // Update the task with the new information
    task.title = title;
    task.description = description;
    task.startDate = startDate;
    task.startTime = startTime;
    task.deadlineDate = deadlineDate;
    task.endTime = endTime;
    task.assignTo = assignTo;
    task.picture = picturePath;
    task.audio = audioPath;

    await task.save();
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// send task by Employee
router.get('/list/subemployee/sendTasks', jwtMiddleware, async (req, res) => {
  try {
    // Retrieve the user's ID from the JWT token
    const userId = req.user.subEmployeeId;

    // Find tasks where the assignedBy field matches the user's ID
    const tasks = await Task.find({ assignedBy: userId });

    if (!tasks) {
      // If no task is found with the given ID, return a 404 response
      return res.status(404).json({ error: 'Task not found' });
    }
    // Send the list of tasks as a JSON response
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




module.exports = router