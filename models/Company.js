const mongoose = require('mongoose')


const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true, // Name is required
    }
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company
