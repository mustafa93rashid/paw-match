const rateLimit = require("express-rate-limit");

const signupLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  limit: 50,
  message: {
    success: false,
    message: "Too many signup attempts, please try again after 1 day",
  },
});

const signinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 25,
  message: {
    success: false,
    message: "Too many signin attempts, please try again after 1 hour",
  },
});

const verifySignupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message:
      "Too many verification attempts. Please try again later.",
  },
});

const requestEmailUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many email update requests. Please try again later.",
  },
});

const verifyEmailUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message:
      "Too many email verification attempts. Please try again later.",
  },
});

const applicationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  limit: 20,
  message: {
    success: false,
    message: "Too many application submissions, please try again after 1 day",
  },
});

const verifyApplicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

const resendActivationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many activation email requests. Please try again later.",
  },
});

module.exports = {
  signupLimiter,
  signinLimiter,
  verifySignupLimiter,
  requestEmailUpdateLimiter,
  verifyEmailUpdateLimiter,
  applicationLimiter,
  verifyApplicationLimiter,
  resendActivationLimiter,
};
