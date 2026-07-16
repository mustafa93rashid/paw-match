const crypto = require("crypto");

/**
 * Generate a random 6-digit verification code.
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash the verification code before storing it.
 */
const hashVerificationCode = (code) => {
  return crypto
    .createHash("sha256")
    .update(code.toString())
    .digest("hex");
};

/**
 * Compare a verification code with its hashed value.
 */
const verifyVerificationCode = (plainCode, hashedCode) => {
  return hashVerificationCode(plainCode) === hashedCode;
};

module.exports = {
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
};