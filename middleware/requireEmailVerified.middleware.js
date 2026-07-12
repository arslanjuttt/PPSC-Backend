const userService = require('../services/user.service');
const ApiError = require('../utils/ApiError');

const requireEmailVerified = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    if (!user) return next(new ApiError(404, 'User not found'));
    if (!user.isEmailVerified) {
      return next(new ApiError(403, 'Please verify your email before using this feature'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireEmailVerified;
