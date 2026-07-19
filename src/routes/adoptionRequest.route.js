const router = require("express").Router();

const adoptionRequestController = require("../controllers/adoptionRequest.controller");
const adoptionRequestValidation = require("../validation/adoptionRequest.validate");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

// Create a new adoption request
router.post("/", [auth, role(["adopter"]), adoptionRequestValidation.createRequestValidation], asyncHandler(adoptionRequestController.createRequest));

// Get the current adopter requests
router.get("/my", [auth, role(["adopter"]), adoptionRequestValidation.getMyRequestsValidation], asyncHandler(adoptionRequestController.getMyRequests));

// Get shelter adoption requests
router.get("/shelter", [auth, role(["shelterEmployee", "superadmin"]), adoptionRequestValidation.getShelterRequestsValidation], asyncHandler(adoptionRequestController.getShelterRequests));

// Get one adoption request
router.get("/:id", [auth, role(["adopter", "shelterEmployee", "superadmin"]), adoptionRequestValidation.getRequestByIdValidation], asyncHandler(adoptionRequestController.getRequestById));

// Move the request between review stages
router.patch("/:id/status", [auth, role(["shelterEmployee", "superadmin"]), adoptionRequestValidation.updateRequestStatusValidation], asyncHandler(adoptionRequestController.updateRequestStatus));

// Approve an adoption request
router.patch("/:id/approve", [auth, role(["shelterEmployee", "superadmin"]), adoptionRequestValidation.approveRequestValidation], asyncHandler(adoptionRequestController.approveRequest));

// Reject an adoption request
router.patch("/:id/reject", [auth, role(["shelterEmployee", "superadmin"]), adoptionRequestValidation.rejectRequestValidation], asyncHandler(adoptionRequestController.rejectRequest));

// Cancel the current adopter request
router.patch("/:id/cancel", [auth, role(["adopter"]), adoptionRequestValidation.cancelMyRequestValidation], asyncHandler(adoptionRequestController.cancelMyRequest));

// Complete the adoption process
router.patch("/:id/complete", [auth, role(["shelterEmployee", "superadmin"]), adoptionRequestValidation.completeRequestValidation], asyncHandler(adoptionRequestController.completeRequest));

// Cancel an approved adoption request
router.patch("/:id/cancel-approval", [auth, role(["shelterEmployee", "superadmin"]), adoptionRequestValidation.cancelApprovedRequestValidation], asyncHandler(adoptionRequestController.cancelApprovedRequest));

module.exports = router;