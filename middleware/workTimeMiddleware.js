const WorkTime = require("../models/WorkTimeModel");

const workTimeMiddleware = async (req, res, next) => {
    // Skip for login/register routes
    if (req.path === '/user/login' || req.path === '/user/register' || req.path === '/user/refreshtoken') {
        return next();
    }
    
    // Skip if no user (authentication will handle this)
    if (!req.user) {
        return next();
    }
    
    // Admins and supervisors always have access
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
        return next();
    }
    
    try {
        const isWorking = await WorkTime.isWorkingTime(new Date());
        
        if (!isWorking) {
            const nextWorkingTime = await WorkTime.getNextWorkingTime();
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. You can only access the system during working hours.",
                nextWorkingTime: nextWorkingTime
            });
        }
        
        next();
    } catch (error) {
        console.error('Work time check error:', error);
        next();
    }
};

module.exports = workTimeMiddleware;