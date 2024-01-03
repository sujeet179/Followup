const mongoose = require('mongoose');

// Define the schema for the LeadNotification model
const leadNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // ID of the admin or sender
        required: true,
        ref: 'SubEmployee' // Reference to the Admin model
    },
    assignedByName: { type: String, required: true },
    message: { type: String, required: true },
    description: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    customerName: { type: String, required: true },
    companyName: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true },
    ownerName: { type: String, required: true },
    website: { type: String },
    leadPicture: String
});

// Create a LeadNotification model using the schema
const LeadNotification = mongoose.model('LeadNotification', leadNotificationSchema);

module.exports = LeadNotification;
