const ApiError = require('../utils/ApiError');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((detail) => detail.message.replace(/"/g, '')).join(', ');
    return next(new ApiError(400, message));
  }

  req[property] = value;
  next();
};

module.exports = validate;
