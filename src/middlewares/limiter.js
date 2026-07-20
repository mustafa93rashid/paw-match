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



// السماح بـ 3 محاولات فقط كل 15 دقيقة لكل عنوان IP
const emailUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "لقد تجاوزت الحد المسموح به من المحاولات. الرجاء المحاولة مرة أخرى بعد 15 دقيقة.",
  },
});

module.exports = {
  signupLimiter,
  signinLimiter,
  verifySignupLimiter,
  emailUpdateLimiter,
};
