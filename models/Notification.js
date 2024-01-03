const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    recipientId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubEmployee',
        required: true,
    }],
    taskId: {
        type: String,
        // required: true
    },
    title: {
        type: String,
        // required: true
    },
    description: {
        type: String,
        // required: true
    },
    startDate: {
        type: Date,
        // required: true
    },
    deadlineDate: {
        type: Date,
        // required: true
    },
    startTime: {
        type: String,
        // required: true
    },
    endTime: {
        type: String,
        // required: true
    },
    status: {
        type: String,
        // required: true
    },
    assignedByname: {
        type: String
    },
    message: {
        type: String,
        // required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending' // Add the "status" field with the default value "pending"
      },
});

module.exports = mongoose.model('Notification', notificationSchema);