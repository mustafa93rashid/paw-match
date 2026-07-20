const { body } = require("express-validator");
const validate = require("../middlewares/validate"); // تأكد من المسار الصحيح للـ validate middleware لديك

// 1. تعريف دالة التحقق لطلب التغيير
const requestEmailValidation = [
  body("newEmail")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني الجديد مطلوب")
    .isEmail()
    .withMessage("الرجاء إدخال صيغة بريد إلكتروني صحيحة")
    .normalizeEmail(),
  validate,
];

// 2. تعريف دالة التحقق لتأكيد الكود
const verifyEmailValidation = [
  body("newEmail")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .normalizeEmail(),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("كود التحقق مطلوب")
    .isLength({ min: 6, max: 6 })
    .withMessage("كود التحقق يجب أن يتكون من 6 أرقام"),
  validate,
];

// 3. التصدير الموحد والصحيح
module.exports = {
  requestEmailValidation,
  verifyEmailValidation,
};