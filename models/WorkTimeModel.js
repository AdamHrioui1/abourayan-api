const mongoose = require('mongoose');

const WorkTimeSchema = new mongoose.Schema({
    isOpen: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const WorkTime = mongoose.model('WorkTime', WorkTimeSchema);
module.exports = WorkTime;
