const router = require("express").Router();

const adoptionRequestController = require(
  "../controllers/adoptionRequest.controller",
);

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

router.post(
  "/",
  auth,
  role(["adopter"]),
  adoptionRequestController.createRequest,
);

router.get(
  "/my",
  auth,
  role(["adopter"]),
  adoptionRequestController.getMyRequests,
);

router.get(
  "/shelter",
  auth,
  role(["shelterEmployee", "superadmin"]),
  adoptionRequestController.getShelterRequests,
);

router.get(
  "/:id",
  auth,
  role([
    "adopter",
    "shelterEmployee",
    "superadmin",
  ]),
  adoptionRequestController.getRequestById,
);

router.patch(
  "/:id/status",
  auth,
  role(["shelterEmployee", "superadmin"]),
  adoptionRequestController.updateRequestStatus,
);

router.patch(
  "/:id/approve",
  auth,
  role(["shelterEmployee", "superadmin"]),
  adoptionRequestController.approveRequest,
);

router.patch(
  "/:id/reject",
  auth,
  role(["shelterEmployee", "superadmin"]),
  adoptionRequestController.rejectRequest,
);

router.patch(
  "/:id/cancel",
  auth,
  role(["adopter"]),
  adoptionRequestController.cancelMyRequest,
);

router.patch(
  "/:id/complete",
  auth,
  role(["shelterEmployee", "superadmin"]),
  adoptionRequestController.completeRequest,
);

router.patch(
  "/:id/cancel-approval",
  auth,
  role(["shelterEmployee", "superadmin"]),
  adoptionRequestController.cancelApprovedRequest,
);

module.exports = router;