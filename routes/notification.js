const express = require('express');
const Notification = require('../models/Notification');
const jwtMiddleware = require('../jwtmiddleware');
const router = express.Router();


router.post('/create', jwtMiddleware, async (req, res) => {
    try {
        const adminId = req.user.employeeId; // Get the ID of the admin creating the task
        const assignedByname = req.user.name; // Get the assignedByname from req.user
        const { recipientId, taskId, message, title, description, startDate, deadlineDate, startTime, endTime, status, } = req.body;

        // Create a new notification with both userId (admin) and recipientId (dynamically determined)
        const notification = new Notification({
            userId: adminId, // ID of the admin creating the task
            recipientId, // Dynamically determined recipient ID
            taskId, // ID of the newly created task
            message,
            assignedByname,// Dynamically determined name
            title,
            description,
            startDate,
            deadlineDate,
            startTime,
            endTime,
            status
        });

        // Save the task and notification to the database
        await notification.save();

        res.status(201).json({ message: 'Notification send successfully' });
    } catch (error) {
        console.error('Error creating task and notification:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// GET route to retrieve notifications for a specific subemployee
router.get('/notifications', jwtMiddleware, async (req, res) => {
    try {
        const subEmployeeId = req.user.subEmployeeId;

        // Retrieve notifications for the subemployee with the specified subEmployeeId
        const notifications = await Notification.find({ recipientId: subEmployeeId, isRead: false }).sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/notification', jwtMiddleware, async (req, res) => {
    try {
        const subEmployeeId = req.user.employeeId;

        // Retrieve notifications for the subemployee with the specified subEmployeeId
        const notifications = await Notification.find({ recipientId: subEmployeeId, isRead: false }).sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// PUT route to mark a notification as read when clicking on a task
router.put('/:notificationId/read', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        // Find the notification by its ID
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Mark the notification as read
        notification.isRead = true;

        // Save the updated notification
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
