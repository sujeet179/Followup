const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    companyName: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String, required: true },
    ownerName: String,
    website: String,
    leadPicture: String,
    createdAt: { type: Date, default: Date.now },
    assignedBy: { type: String, required: true },
    assignedByName: String,
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
