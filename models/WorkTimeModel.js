// models/WorkTimeModel.js
const mongoose = require('mongoose');

const WorkTimeSchema = new mongoose.Schema({
    // Work days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    workDays: {
        type: [Number],
        required: true,
        default: [1, 2, 3, 4] // Monday to Thursday
    },
    // Work start time (HH:MM format)
    startTime: {
        type: String,
        required: true,
        default: '08:00'
    },
    // Work end time (HH:MM format)
    endTime: {
        type: String,
        required: true,
        default: '17:00'
    },
    // Break start time (optional)
    breakStartTime: {
        type: String,
        default: null
    },
    // Break end time (optional)
    breakEndTime: {
        type: String,
        default: null
    },
    // Special holidays/vacations
    holidays: [{
        date: Date,
        description: String
    }],
    // Special working days (override holidays)
    specialWorkDays: [{
        date: Date,
        description: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Check if a specific date and time is within working hours
WorkTimeSchema.statics.isWorkingTime = async function(dateTime) {
    const workSettings = await this.findOne({ isActive: true });
    if (!workSettings) return true; // If no settings, allow access
    
    const date = new Date(dateTime);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    
    // Check if it's a holiday
    const isHoliday = workSettings.holidays.some(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate.toDateString() === date.toDateString();
    });
    
    if (isHoliday) return false;
    
    // Check if it's a special work day (overrides regular day)
    const isSpecialWorkDay = workSettings.specialWorkDays.some(special => {
        const specialDate = new Date(special.date);
        return specialDate.toDateString() === date.toDateString();
    });
    
    if (isSpecialWorkDay) return true;
    
    // Check if it's a work day
    const isWorkDay = workSettings.workDays.includes(dayOfWeek);
    if (!isWorkDay) return false;
    
    // Check time
    const currentTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if within working hours
    let isWorkingTime = currentTime >= workSettings.startTime && currentTime <= workSettings.endTime;
    
    // Check break time if defined
    if (isWorkingTime && workSettings.breakStartTime && workSettings.breakEndTime) {
        if (currentTime >= workSettings.breakStartTime && currentTime <= workSettings.breakEndTime) {
            isWorkingTime = false;
        }
    }
    
    return isWorkingTime;
};

// Get next working time
WorkTimeSchema.statics.getNextWorkingTime = async function() {
    const workSettings = await this.findOne({ isActive: true });
    if (!workSettings) return new Date();
    
    const now = new Date();
    let nextTime = new Date(now);
    
    // If current time is after work hours, set to next day's start time
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime > workSettings.endTime) {
        nextTime.setDate(nextTime.getDate() + 1);
        nextTime.setHours(parseInt(workSettings.startTime.split(':')[0]), parseInt(workSettings.startTime.split(':')[1]), 0);
    }
    
    // Find next work day
    let dayOfWeek = nextTime.getDay();
    while (!workSettings.workDays.includes(dayOfWeek)) {
        nextTime.setDate(nextTime.getDate() + 1);
        dayOfWeek = nextTime.getDay();
    }
    
    // Set to start time
    nextTime.setHours(parseInt(workSettings.startTime.split(':')[0]), parseInt(workSettings.startTime.split(':')[1]), 0);
    
    return nextTime;
};

const WorkTime = mongoose.model('WorkTime', WorkTimeSchema);
module.exports = WorkTime;