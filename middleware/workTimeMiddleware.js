const WorkTime = require('../models/WorkTimeModel');
const jwt = require('jsonwebtoken');

const workTimeMiddleware = async (req, res, next) => {
    // Always allow auth and worktime routes through
    if (
        req.path === '/user/login' ||
        req.path === '/user/register' ||
        req.path === '/user/refreshtoken' ||
        req.path === '/worktime/status' ||
        req.path === '/worktime/toggle' ||
        req.path === '/weeklytop'
    ) {
        return next();
    }

    try {
        const settings = await WorkTime.findOne();

        // System is open — let everyone through
        if (!settings || settings.isOpen) {
            return next();
        }

        // System is closed — decode token and allow admins through on ALL routes
        try {
            const token = req.header('Authorization');
            if (token) {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                if (decoded.role === 'admin') {
                    return next();
                }
            }
        } catch (e) {
            // Invalid/missing token — fall through to block
        }

        return res.status(403).json({
            success: false,
            message: 'النظام مغلق حالياً. يرجى المحاولة لاحقاً.',
            systemClosed: true,
        });
    } catch (error) {
        next();
    }
};

module.exports = workTimeMiddleware;
