const express = require("express");
const router = express.Router();

const staffApplicationController = require("../controllers/staffApplication.controller");
const asyncHandler = require("../utils/asyncHandler");
const role = require("../middlewares/role");
const auth = require("../middlewares/auth");
const {
  applicationLimiter,
  verifyApplicationLimiter,
  resendActivationLimiter,
} = require("../middlewares/limiter");

const {
  submitApplicationValidation,
  verifyApplicationValidation,
  resendVerificationValidation,
  resendActivationValidation,
  listApplicationsValidation,
  getApplicationValidation,
  approveApplicationValidation,
  rejectApplicationValidation,
  updateApplicationValidation,
} = require("../validation/staffApplication.validate");

// Submit a public staff application (Shelter Manager or Veterinarian)
router.post(
  "/",
  [applicationLimiter, ...submitApplicationValidation],
  asyncHandler(staffApplicationController.submit),
);

// Verify the applicant's email
router.post(
  "/verify",
  [verifyApplicationLimiter, ...verifyApplicationValidation],
  asyncHandler(staffApplicationController.verify),
);

// Resend the email verification code — same rate limit as verify itself
router.post(
  "/resend-verification",
  [verifyApplicationLimiter, ...resendVerificationValidation],
  asyncHandler(staffApplicationController.resendVerification),
);

// Resend the account activation email
router.post(
  "/resend-activation",
  [resendActivationLimiter, ...resendActivationValidation],
  asyncHandler(staffApplicationController.resendActivation),
);

// List applications (Super Admin)
router.get(
  "/",
  [auth, role(["superadmin"]), ...listApplicationsValidation],
  asyncHandler(staffApplicationController.getAll),
);

// Get application by ID (Super Admin)
router.get(
  "/:id",
  [auth, role(["superadmin"]), ...getApplicationValidation],
  asyncHandler(staffApplicationController.getOne),
);

// Edit an application's business fields — Super Admin, "pending" only
router.patch(
  "/:id",
  [auth, role(["superadmin"]), ...updateApplicationValidation],
  asyncHandler(staffApplicationController.update),
);

// Approve an application (Super Admin)
router.patch(
  "/:id/approve",
  [auth, role(["superadmin"]), ...approveApplicationValidation],
  asyncHandler(staffApplicationController.approve),
);

// Reject an application (Super Admin)
router.patch(
  "/:id/reject",
  [auth, role(["superadmin"]), ...rejectApplicationValidation],
  asyncHandler(staffApplicationController.reject),
);

module.exports = router;
