const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    idNumber: {
        type: String,
        required: true,
    },
    netSalary: {
        type: Number,
        required: true,
    },
    cellNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // If each person has a unique email address
        lowercase: true, // Store emails in lowercase for consistency
    },
});

const Blacklist = mongoose.model('Blacklist', blacklistSchema);

module.exports = Blacklist;
