const crypto = require("crypto");

const StaffApplication = require("../models/StaffApplication");
const User = require("../models/User");
const Shelter = require("../models/Shelter");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");
const VetProfile = require("../models/VetProfile");

const passwordService = require("../utils/passwordService");
const emailService = require("../services/email.service");
const {
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
} = require("../utils/verificationCodeService");

const MAX_VERIFICATION_ATTEMPTS = 5;

// User-friendly — the applicant may not open the approval email right away.
// Verification-code lifetime (10 minutes, in submit()/resendVerification())
// is deliberately unchanged.
const ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// ==================================================
// Remove internal/sensitive fields from a response
// ==================================================
const sanitizeApplication = (application) => {
  if (!application) return null;

  const data =
    typeof application.toObject === "function" ? application.toObject() : { ...application };

  delete data.verificationCode;
  delete data.verificationCodeExpires;
  delete data.verificationAttempts;

  return data;
};

// ==================================================
// Human-readable message for an approve/reject guard miss
// ==================================================
const statusConflictMessage = (status, action) => {
  if (status === "approved") return "This application has already been approved";
  if (status === "rejected") return "This application has already been rejected";
  if (action === "approve") return "Only a verified, pending application can be approved";
  return "Only a pending application can be rejected";
};

class StaffApplicationController {
  // ==================================================
  // Submit a public staff application
  // ==================================================
  submit = async (req, res) => {
    // • Public endpoint — never creates a User or assigns a role.
    // • Rejects if the email already belongs to a real User account.
    // • Blocks a second submission while one is already verified and
    //   awaiting Super Admin review (status "pending").
    // • A submission still stuck at "pendingVerification" (e.g. the code
    //   expired and was never entered) is safely overwritten in place —
    //   no duplicate rows pile up from retries.
    // • A prior "rejected" application does not block reapplying; a new
    //   record is created so the rejection history is preserved.
    // ==================================================

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      applicationType,
      shelterData,
      vetData,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.exists({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (applicationType === "shelterManager") {
      const existingShelter = await Shelter.findOne({ email: shelterData.email });

      if (existingShelter) {
        return res.status(409).json({
          success: false,
          message: "Shelter email is already registered",
        });
      }
    }

    const blockingApplication = await StaffApplication.findOne({
      email: normalizedEmail,
      status: { $in: ["pendingVerification", "pending"] },
    });

    if (blockingApplication && blockingApplication.status === "pending") {
      return res.status(409).json({
        success: false,
        message: "An application for this email is already pending review",
      });
    }

    const verificationCode = generateVerificationCode();
    const hashedVerificationCode = hashVerificationCode(verificationCode);
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const applicationData = {
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      address,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      applicationType,
      shelterData: applicationType === "shelterManager" ? shelterData : undefined,
      vetData: applicationType === "vet" ? vetData : undefined,
      status: "pendingVerification",
      emailVerified: false,
      verificationCode: hashedVerificationCode,
      verificationCodeExpires,
      verificationAttempts: 0,
    };

    if (blockingApplication) {
      // status is guaranteed "pendingVerification" here — safe to overwrite.
      Object.assign(blockingApplication, applicationData);
      await blockingApplication.save();
    } else {
      await StaffApplication.create(applicationData);
    }

    await emailService.sendApplicationVerificationEmail({
      to: normalizedEmail,
      firstName,
      verificationCode,
    });

    return res.status(201).json({
      success: true,
      message: "Verification code sent successfully",
      data: {
        email: normalizedEmail,
        applicationType,
        expiresInMinutes: 10,
      },
    });
  };

  // ==================================================
  // Verify the applicant's email
  // ==================================================
  verify = async (req, res) => {
    // • Only after this succeeds does the application become visible to
    //   Super Admin as a valid pending application (status flips to
    //   "pending" here, not before).
    // ==================================================

    const { email, verificationCode } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const application = await StaffApplication.findOne({
      email: normalizedEmail,
      status: "pendingVerification",
    }).select("+verificationCode +verificationCodeExpires +verificationAttempts");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application verification request not found or already verified",
      });
    }

    if (
      !application.verificationCodeExpires ||
      application.verificationCodeExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please apply again.",
      });
    }

    if (application.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many invalid attempts. Please apply again.",
      });
    }

    const isValidCode = verifyVerificationCode(verificationCode, application.verificationCode);

    if (!isValidCode) {
      application.verificationAttempts += 1;

      await application.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
        remainingAttempts: MAX_VERIFICATION_ATTEMPTS - application.verificationAttempts,
      });
    }

    application.emailVerified = true;
    application.status = "pending";
    application.verificationCode = undefined;
    application.verificationCodeExpires = undefined;
    application.verificationAttempts = 0;

    await application.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. Your application is now pending review.",
      data: {
        email: normalizedEmail,
        status: application.status,
      },
    });
  };

  // ==================================================
  // Resend the email verification code (public)
  // ==================================================
  resendVerification = async (req, res) => {
    // • Only a "pendingVerification" application may request this — an
    //   application that already verified, or that a Super Admin has since
    //   decided on, gets a specific rejection reason instead (never a
    //   silent no-op), matching resend-activation's own error shape.
    // • Generates a fresh code, overwrites the stored hash and expiry (the
    //   previous code no longer matches anything, so it's implicitly
    //   invalidated), and resets the attempt counter.
    // • Same verification-code lifetime as submit() (10 minutes) — only
    //   the activation token's lifetime changed, not this one.
    // ==================================================

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const application = await StaffApplication.findOne({ email: normalizedEmail });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "This application has already been approved",
      });
    }

    if (application.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "This application has already been rejected",
      });
    }

    if (application.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "This application's email has already been verified",
      });
    }

    const verificationCode = generateVerificationCode();

    application.verificationCode = hashVerificationCode(verificationCode);
    application.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    application.verificationAttempts = 0;

    await application.save();

    await emailService.sendApplicationVerificationEmail({
      to: normalizedEmail,
      firstName: application.firstName,
      verificationCode,
    });

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent",
      data: {
        email: normalizedEmail,
        expiresInMinutes: 10,
      },
    });
  };

  // ==================================================
  // List applications (Super Admin)
  // ==================================================
  getAll = async (req, res) => {
    const { applicationType, status, search } = req.query;

    const filter = {};

    if (applicationType) filter.applicationType = applicationType;
    if (status) filter.status = status;

    if (search) {
      const regex = { $regex: search, $options: "i" };

      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }

    const applications = await StaffApplication.find(filter)
      .populate("reviewedBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("approvedUserId", "firstName lastName email role isAccountActivated")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      count: applications.length,
      data: applications,
    });
  };

  // ==================================================
  // Get application by ID (Super Admin)
  // ==================================================
  getOne = async (req, res) => {
    const application = await StaffApplication.findById(req.params.id)
      .populate("reviewedBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("approvedUserId", "firstName lastName email role isAccountActivated");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application retrieved successfully",
      data: application,
    });
  };

  // ==================================================
  // Edit an application's business fields (Super Admin, "pending" only)
  // ==================================================
  update = async (req, res) => {
    // • Only allowed while status is "pending" — once approved or
    //   rejected, the application is immutable (enforced below, not just
    //   by omission from the allow-list).
    // • email, applicationType, status, and every verification/approval
    //   field are never editable here — updateApplicationValidation's
    //   allow-list already rejects them outright before this runs.
    // • shelterData/vetData must match the application's actual type —
    //   the validator can't know that (applicationType isn't sent in this
    //   request), so it's checked here against the existing document.
    // ==================================================

    const application = await StaffApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only a pending application can be edited",
      });
    }

    const { phone, address, shelterData, vetData } = req.body;

    if (shelterData !== undefined && application.applicationType !== "shelterManager") {
      return res.status(400).json({
        success: false,
        message: "shelterData can only be edited on a shelter manager application",
      });
    }

    if (vetData !== undefined && application.applicationType !== "vet") {
      return res.status(400).json({
        success: false,
        message: "vetData can only be edited on a veterinarian application",
      });
    }

    if (shelterData !== undefined && shelterData.email !== application.shelterData.email) {
      const existingShelter = await Shelter.findOne({ email: shelterData.email });

      if (existingShelter) {
        return res.status(409).json({
          success: false,
          message: "Shelter email is already registered",
        });
      }
    }

    if (phone !== undefined) application.phone = phone;
    if (address !== undefined) application.address = address;

    // Full-object replacement, same convention as every other edit form in
    // this app — never a partial merge of the nested subdocument.
    if (shelterData !== undefined) application.shelterData = shelterData;
    if (vetData !== undefined) application.vetData = vetData;

    application.updatedBy = req.user._id;

    await application.save();

    await application.populate("reviewedBy", "firstName lastName email");
    await application.populate("updatedBy", "firstName lastName email");
    await application.populate("approvedUserId", "firstName lastName email role isAccountActivated");

    return res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: sanitizeApplication(application),
    });
  };

  // ==================================================
  // Build a never-transmitted temporary password + a one-time
  // activation token, using the same primitives as forgotPassword.
  // ==================================================
  buildActivationCredentials = async () => {
    const temporaryPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await passwordService.hash(temporaryPassword);

    const activationToken = crypto.randomBytes(32).toString("hex");
    const hashedActivationToken = crypto
      .createHash("sha256")
      .update(activationToken)
      .digest("hex");
    const activationTokenExpires = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS);

    return { hashedPassword, activationToken, hashedActivationToken, activationTokenExpires };
  };

  // ==================================================
  // Revert a claimed application back to "pending" — used when a guard
  // fails or account creation fails after the atomic claim below.
  // ==================================================
  revertToPending = async (application) => {
    application.status = "pending";
    application.reviewedBy = null;
    application.reviewedAt = null;

    await application.save();
  };

  // ==================================================
  // Approve an application (Super Admin)
  // ==================================================
  approve = async (req, res) => {
    // Three clearly separate stages:
    //   1. Application approval (the atomic claim + guard checks below)
    //   2. Account creation (User + role profile [+ Shelter], rollback-safe)
    //   3. Account activation (token generated + emailed — NOT completed
    //      here; the applicant completes it via POST /auth/activate-account)
    // ==================================================

    // Atomic claim: only a currently-"pending" application can be approved.
    // This single findOneAndUpdate is the concurrency/idempotency guard —
    // two concurrent approve requests can't both win it. This deployment's
    // MongoDB is a standalone instance (no replica set), so multi-document
    // transactions aren't available; the try/catch below performs
    // compensating rollback instead, mirroring the existing pattern in
    // user.controller.js's updateRole/adminCreateUser.
    const application = await StaffApplication.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { $set: { status: "approved", reviewedBy: req.user._id, reviewedAt: new Date() } },
      { new: true },
    );

    if (!application) {
      const existing = await StaffApplication.findById(req.params.id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: statusConflictMessage(existing.status, "approve"),
      });
    }

    // Structurally guaranteed by the verify() state machine (pending is
    // never reached without emailVerified being set) — kept as an explicit,
    // defensive second check rather than trusted implicitly.
    if (!application.emailVerified) {
      await this.revertToPending(application);

      return res.status(400).json({
        success: false,
        message: "Applicant's email has not been verified",
      });
    }

    if (application.applicationType === "shelterManager") {
      const existingShelter = await Shelter.findOne({ email: application.shelterData.email });

      if (existingShelter) {
        await this.revertToPending(application);

        return res.status(409).json({
          success: false,
          message: "Shelter email is already registered",
        });
      }
    }

    const { hashedPassword, activationToken, hashedActivationToken, activationTokenExpires } =
      await this.buildActivationCredentials();

    let newUser = null;
    let shelter = null;
    let roleProfile = null;

    try {
      if (application.applicationType === "shelterManager") {
        newUser = await User.create({
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          phone: application.phone,
          address: application.address,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          password: hashedPassword,
          role: "shelterEmployee",
          isActive: true,
          isAccountActivated: false,
        });

        const shelterData = application.shelterData.toObject();

        const shelterCreateData = {
          ...shelterData,
          createdBy: newUser._id,
          employees: [newUser._id],
          verificationStatus: "approved",
          isVerified: true,
          isActive: true,
          rejectionReason: null,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
          logo: null,
          images: [],
        };

        // Same derived-GeoJSON-field logic as shelter.controller.js's
        // createShelter — needed for shelter.route.js's nearest-shelters
        // geo query to ever find this shelter.
        if (shelterData.longitude !== undefined && shelterData.latitude !== undefined) {
          shelterCreateData.location = {
            type: "Point",
            coordinates: [shelterData.longitude, shelterData.latitude],
          };
        }

        shelter = await Shelter.create(shelterCreateData);

        roleProfile = await ShelterEmployeeProfile.create({
          userId: newUser._id,
          shelterId: shelter._id,
          position: "manager",
          isActive: true,
        });
      } else {
        newUser = await User.create({
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          phone: application.phone,
          address: application.address,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          password: hashedPassword,
          role: "vet",
          isActive: true,
          isAccountActivated: false,
        });

        roleProfile = await VetProfile.create({
          userId: newUser._id,
          specialization: application.vetData.specialization,
          bio: application.vetData.bio,
          experienceYears: application.vetData.experienceYears,
          availableDays: application.vetData.availableDays,
          consultationTypes: application.vetData.consultationTypes,
          isActive: true,
        });
      }

      newUser.activationToken = hashedActivationToken;
      newUser.activationTokenExpires = activationTokenExpires;

      await newUser.save({ validateBeforeSave: false });
    } catch (error) {
      try {
        if (roleProfile) {
          if (application.applicationType === "shelterManager") {
            await ShelterEmployeeProfile.findByIdAndDelete(roleProfile._id);
          } else {
            await VetProfile.findByIdAndDelete(roleProfile._id);
          }
        }

        if (shelter) {
          await Shelter.findByIdAndDelete(shelter._id);
        }

        if (newUser?._id) {
          await User.findByIdAndDelete(newUser._id);
        }
      } catch (cleanupError) {
        console.error(
          "Failed to roll back a partially created application approval:",
          cleanupError.message,
        );
      }

      await this.revertToPending(application);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A user or shelter with this email already exists",
        });
      }

      throw error;
    }

    application.approvedUserId = newUser._id;

    await application.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const activationUrl = `${frontendUrl}/activate-account/${activationToken}`;

    try {
      await emailService.sendAccountActivationEmail({
        to: newUser.email,
        firstName: newUser.firstName,
        activationUrl,
      });
    } catch (error) {
      // The account and application state are already committed — email
      // delivery failing must not undo either. Logged for manual follow-up;
      // the activation token remains valid until it expires.
      console.error("Failed to send account activation email:", error.message);
    }

    return res.status(200).json({
      success: true,
      message: "Application approved and account created successfully",
      data: {
        application: sanitizeApplication(application),
        userId: newUser._id,
      },
    });
  };

  // ==================================================
  // Resend the account activation email (public)
  // ==================================================
  resendActivation = async (req, res) => {
    // • Keyed by the StaffApplication (not a raw User lookup) so the
    //   rejection reasons the spec calls for (not yet approved / rejected
    //   / already activated) are all answerable — a User alone can't tell
    //   you whether it came from a still-pending application.
    // • Once approved, an email can never gain a second StaffApplication
    //   row (submit() 409s once a real User exists for that email), so the
    //   most recent row for this email is always the relevant one.
    // • Generates a fresh token, overwrites the stored hash/expiry on the
    //   User (the previous token no longer matches anything, so it's
    //   implicitly invalidated) — same 24-hour lifetime as the original.
    // ==================================================

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const application = await StaffApplication.findOne({ email: normalizedEmail }).sort({
      createdAt: -1,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status === "pendingVerification") {
      return res.status(400).json({
        success: false,
        message: "This application has not been verified yet",
      });
    }

    if (application.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "This application is still pending review",
      });
    }

    if (application.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "This application was rejected",
      });
    }

    const user = application.approvedUserId ? await User.findById(application.approvedUserId) : null;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (user.isAccountActivated) {
      return res.status(400).json({
        success: false,
        message: "This account has already been activated. Please sign in.",
      });
    }

    const activationToken = crypto.randomBytes(32).toString("hex");
    const hashedActivationToken = crypto.createHash("sha256").update(activationToken).digest("hex");

    user.activationToken = hashedActivationToken;
    user.activationTokenExpires = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS);

    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const activationUrl = `${frontendUrl}/activate-account/${activationToken}`;

    await emailService.sendAccountActivationEmail({
      to: user.email,
      firstName: user.firstName,
      activationUrl,
    });

    return res.status(200).json({
      success: true,
      message: "A new activation email has been sent",
    });
  };

  // ==================================================
  // Reject an application (Super Admin)
  // ==================================================
  reject = async (req, res) => {
    const { reason } = req.body;

    // Rejection doesn't require prior email verification (unlike approval,
    // which creates a real account) — allowed from either unfinished state.
    const application = await StaffApplication.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["pendingVerification", "pending"] } },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason.trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!application) {
      const existing = await StaffApplication.findById(req.params.id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: statusConflictMessage(existing.status, "reject"),
      });
    }

    try {
      await emailService.sendApplicationRejectedEmail({
        to: application.email,
        firstName: application.firstName,
        reason: application.rejectionReason,
      });
    } catch (error) {
      console.error("Failed to send application rejection email:", error.message);
    }

    return res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: sanitizeApplication(application),
    });
  };
}

module.exports = new StaffApplicationController();
