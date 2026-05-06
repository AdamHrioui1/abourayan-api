// models/WorkTimeModel.js
const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Set Saudi Arabia timezone
const SA_TIMEZONE = 'Asia/Riyadh'; // Saudi Arabia timezone

// Helper function to get current time in Saudi timezone
function getCurrentTimeInSaudi() {
    return moment().tz(SA_TIMEZONE);
}

// Helper function to convert any date to Saudi timezone
function convertToSaudiTime(date) {
    return moment(date).tz(SA_TIMEZONE);
}

const WorkTimeSchema = new mongoose.Schema({
    // Work days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    workDays: {
        type: [Number],
        required: true,
        default: [1, 2, 3, 4] // Monday to Thursday
    },
    // Work start time (HH:MM format) - in Saudi timezone
    startTime: {
        type: String,
        required: true,
        default: '08:00'
    },
    // Work end time (HH:MM format) - in Saudi timezone
    endTime: {
        type: String,
        required: true,
        default: '17:00'
    },
    // Break start time (optional) - in Saudi timezone
    breakStartTime: {
        type: String,
        default: null
    },
    // Break end time (optional) - in Saudi timezone
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

// Check if a specific date and time is within working hours (Saudi timezone)
WorkTimeSchema.statics.isWorkingTime = async function(dateTime = null) {
    const workSettings = await this.findOne({ isActive: true });
    if (!workSettings) return true; // If no settings, allow access
    
    // Use current Saudi time if no date provided
    let saudiTime;
    if (dateTime) {
        saudiTime = convertToSaudiTime(dateTime);
    } else {
        saudiTime = getCurrentTimeInSaudi();
    }
    
    const date = saudiTime.toDate();
    const dayOfWeek = saudiTime.day(); // 0 = Sunday (moment.day())
    
    // Check if it's a holiday (compare dates in Saudi timezone)
    const isHoliday = workSettings.holidays.some(holiday => {
        const holidayDate = convertToSaudiTime(holiday.date);
        return holidayDate.format('YYYY-MM-DD') === saudiTime.format('YYYY-MM-DD');
    });
    
    if (isHoliday) return false;
    
    // Check if it's a special work day (overrides regular day)
    const isSpecialWorkDay = workSettings.specialWorkDays.some(special => {
        const specialDate = convertToSaudiTime(special.date);
        return specialDate.format('YYYY-MM-DD') === saudiTime.format('YYYY-MM-DD');
    });
    
    if (isSpecialWorkDay) return true;
    
    // Check if it's a work day
    const isWorkDay = workSettings.workDays.includes(dayOfWeek);
    if (!isWorkDay) return false;
    
    // Get current time in HH:MM format (Saudi timezone)
    const currentTime = saudiTime.format('HH:mm');
    
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

// Get next working time (in Saudi timezone)
WorkTimeSchema.statics.getNextWorkingTime = async function() {
    const workSettings = await this.findOne({ isActive: true });
    if (!workSettings) return getCurrentTimeInSaudi().toDate();
    
    let currentSaudiTime = getCurrentTimeInSaudi();
    let nextTime = currentSaudiTime.clone();
    
    // Get current time in HH:MM format
    const currentTime = currentSaudiTime.format('HH:mm');
    
    // If current time is after work hours, set to next day's start time
    if (currentTime > workSettings.endTime) {
        nextTime = nextTime.add(1, 'day');
        const [hours, minutes] = workSettings.startTime.split(':');
        nextTime.set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0, millisecond: 0 });
    }
    
    // Find next work day
    let dayOfWeek = nextTime.day();
    let attempts = 0;
    const maxAttempts = 14; // Prevent infinite loop
    
    while (!workSettings.workDays.includes(dayOfWeek) && attempts < maxAttempts) {
        nextTime = nextTime.add(1, 'day');
        dayOfWeek = nextTime.day();
        attempts++;
    }
    
    // Check if the found date is a holiday
    let isHoliday = workSettings.holidays.some(holiday => {
        const holidayDate = convertToSaudiTime(holiday.date);
        return holidayDate.format('YYYY-MM-DD') === nextTime.format('YYYY-MM-DD');
    });
    
    // If it's a holiday, find the next working day after the holiday
    while (isHoliday && attempts < maxAttempts) {
        nextTime = nextTime.add(1, 'day');
        dayOfWeek = nextTime.day();
        
        // Skip non-working days
        while (!workSettings.workDays.includes(dayOfWeek) && attempts < maxAttempts) {
            nextTime = nextTime.add(1, 'day');
            dayOfWeek = nextTime.day();
            attempts++;
        }
        
        // Check if new date is a holiday
        isHoliday = workSettings.holidays.some(holiday => {
            const holidayDate = convertToSaudiTime(holiday.date);
            return holidayDate.format('YYYY-MM-DD') === nextTime.format('YYYY-MM-DD');
        });
        attempts++;
    }
    
    // Set to start time
    const [hours, minutes] = workSettings.startTime.split(':');
    nextTime.set({ hour: parseInt(hours), minute: parseInt(minutes), second: 0, millisecond: 0 });
    
    return nextTime.toDate();
};

const WorkTime = mongoose.model('WorkTime', WorkTimeSchema);
module.exports = WorkTime;


























// // models/WorkTimeModel.js
// const mongoose = require('mongoose');

// const WorkTimeSchema = new mongoose.Schema({
//     // Work days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
//     workDays: {
//         type: [Number],
//         required: true,
//         default: [1, 2, 3, 4] // Monday to Thursday
//     },
//     // Work start time (HH:MM format)
//     startTime: {
//         type: String,
//         required: true,
//         default: '08:00'
//     },
//     // Work end time (HH:MM format)
//     endTime: {
//         type: String,
//         required: true,
//         default: '17:00'
//     },
//     // Break start time (optional)
//     breakStartTime: {
//         type: String,
//         default: null
//     },
//     // Break end time (optional)
//     breakEndTime: {
//         type: String,
//         default: null
//     },
//     // Special holidays/vacations
//     holidays: [{
//         date: Date,
//         description: String
//     }],
//     // Special working days (override holidays)
//     specialWorkDays: [{
//         date: Date,
//         description: String
//     }],
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     }
// }, {
//     timestamps: true
// });

// // Check if a specific date and time is within working hours
// WorkTimeSchema.statics.isWorkingTime = async function(dateTime) {
//     const workSettings = await this.findOne({ isActive: true });
//     if (!workSettings) return true; // If no settings, allow access
    
//     const date = new Date(dateTime);
//     const dayOfWeek = date.getDay(); // 0 = Sunday
    
//     // Check if it's a holiday
//     const isHoliday = workSettings.holidays.some(holiday => {
//         const holidayDate = new Date(holiday.date);
//         return holidayDate.toDateString() === date.toDateString();
//     });
    
//     if (isHoliday) return false;
    
//     // Check if it's a special work day (overrides regular day)
//     const isSpecialWorkDay = workSettings.specialWorkDays.some(special => {
//         const specialDate = new Date(special.date);
//         return specialDate.toDateString() === date.toDateString();
//     });
    
//     if (isSpecialWorkDay) return true;
    
//     // Check if it's a work day
//     const isWorkDay = workSettings.workDays.includes(dayOfWeek);
//     if (!isWorkDay) return false;
    
//     // Check time
//     const currentTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
//     // Check if within working hours
//     let isWorkingTime = currentTime >= workSettings.startTime && currentTime <= workSettings.endTime;
    
//     // Check break time if defined
//     if (isWorkingTime && workSettings.breakStartTime && workSettings.breakEndTime) {
//         if (currentTime >= workSettings.breakStartTime && currentTime <= workSettings.breakEndTime) {
//             isWorkingTime = false;
//         }
//     }
    
//     return isWorkingTime;
// };

// // Get next working time
// WorkTimeSchema.statics.getNextWorkingTime = async function() {
//     const workSettings = await this.findOne({ isActive: true });
//     if (!workSettings) return new Date();
    
//     const now = new Date();
//     let nextTime = new Date(now);
    
//     // If current time is after work hours, set to next day's start time
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
//     if (currentTime > workSettings.endTime) {
//         nextTime.setDate(nextTime.getDate() + 1);
//         nextTime.setHours(parseInt(workSettings.startTime.split(':')[0]), parseInt(workSettings.startTime.split(':')[1]), 0);
//     }
    
//     // Find next work day
//     let dayOfWeek = nextTime.getDay();
//     while (!workSettings.workDays.includes(dayOfWeek)) {
//         nextTime.setDate(nextTime.getDate() + 1);
//         dayOfWeek = nextTime.getDay();
//     }
    
//     // Set to start time
//     nextTime.setHours(parseInt(workSettings.startTime.split(':')[0]), parseInt(workSettings.startTime.split(':')[1]), 0);
    
//     return nextTime;
// };

// const WorkTime = mongoose.model('WorkTime', WorkTimeSchema);
// module.exports = WorkTime;