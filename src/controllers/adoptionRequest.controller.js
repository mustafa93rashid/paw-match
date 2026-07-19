const AdoptionRequest = require("../models/AdoptionRequest");
const Animal = require("../models/Animal");
const Shelter = require("../models/Shelter");
const AdopterProfile = require("../models/AdopterProfile");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

class AdoptionRequestController {
  // ==================================================
  // Check Shelter Permission
  // ==================================================
  // • Confirms that the shelter is approved, verified, and active.
  // • Allows the Super Admin to manage any available shelter.
  // • Requires the shelter employee to have an active employee profile.
  // • Confirms that the employee profile is linked to the same shelter.
  // • Returns true when the user has permission and false otherwise.
  // ==================================================

  checkShelterPermission = async (
    user,
    shelterId,
  ) => {
    const shelter = await Shelter.findOne({
      _id: shelterId,
      verificationStatus: "approved",
      isVerified: true,
      isActive: true,
    });

    if (!shelter) {
      return false;
    }

    if (user.role === "superadmin") {
      return true;
    }

    if (user.role !== "shelterEmployee") {
      return false;
    }

    const employeeProfile =
      await ShelterEmployeeProfile.findOne({
        userId: user._id,
        shelterId: shelter._id,
        isActive: true,
      });

    if (!employeeProfile) {
      return false;
    }

    return true;
  };

  // ==================================================
  // Populate Adoption Request
  // ==================================================
  // • Retrieves one adoption request by its ID.
  // • Populates the adopter, animal, shelter, and reviewer details.
  // • Limits the returned fields to the information needed by the client.
  // • Reuses the same population structure across controller functions.
  // ==================================================

  populateRequest = async (requestId) => {
    return AdoptionRequest.findById(requestId)
      .populate(
        "adopterId",
        "firstName lastName email phone address profileImage isProfileCompleted",
      )
      .populate(
        "animalId",
        "name species breed gender age ageUnit size healthStatus vaccinated images adoptionStatus isActive",
      )
      .populate(
        "shelterId",
        "name city address phone logo",
      )
      .populate(
        "reviewedBy",
        "firstName lastName role",
      );
  };

  // ==================================================
  // Create Adoption Request
  // ==================================================
  // • Allows only an adopter to submit an adoption request.
  // • Confirms that the adopter profile exists.
  // • Requires the adopter profile to be completed.
  // • Confirms that the animal exists, is active, and is available.
  // • Confirms that the animal belongs to an approved and active shelter.
  // • Prevents the adopter from creating another active request for the same animal.
  // • Stores the shelter ID directly from the selected animal.
  // ==================================================

  createRequest = async (req, res) => {
    const { animalId, message } = req.body;

    const adopterProfile =
      await AdopterProfile.findOne({
        userId: req.user._id,
      });

    if (!adopterProfile) {
      return res.status(404).json({
        success: false,
        message: "Adopter profile not found",
      });
    }

    const isProfileCompleted =
      adopterProfile.homeType &&
      adopterProfile.ownerType &&
      adopterProfile.experienceLevel &&
      adopterProfile.dailyActivityLevel &&
      adopterProfile.isAllergic !== null &&
      adopterProfile.isAllergic !== undefined;

    if (!isProfileCompleted) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete your profile before submitting an adoption request",
      });
    }

    const animal = await Animal.findOne({
      _id: animalId,
      isActive: true,
    });

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    if (animal.adoptionStatus !== "available") {
      return res.status(400).json({
        success: false,
        message:
          "Animal is not available for adoption",
      });
    }

    const shelter = await Shelter.findOne({
      _id: animal.shelterId,
      verificationStatus: "approved",
      isVerified: true,
      isActive: true,
    });

    if (!shelter) {
      return res.status(400).json({
        success: false,
        message:
          "The shelter is not currently available",
      });
    }

    const existingRequest =
      await AdoptionRequest.findOne({
        adopterId: req.user._id,
        animalId: animal._id,
        status: {
          $in: [
            "pendingReview",
            "interview",
            "homeCheck",
            "approved",
          ],
        },
      });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active adoption request for this animal",
      });
    }

    const adoptionRequest =
      await AdoptionRequest.create({
        adopterId: req.user._id,
        animalId: animal._id,
        shelterId: animal.shelterId,
        message: message?.trim() || null,
      });

    const populatedRequest =
      await this.populateRequest(
        adoptionRequest._id,
      );

    return res.status(201).json({
      success: true,
      message:
        "Adoption request created successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Get Current Adopter Requests
  // ==================================================
  // • Retrieves all adoption requests created by the current adopter.
  // • Allows filtering the requests by status.
  // • Prevents the adopter from viewing requests owned by another user.
  // • Returns the related animal, shelter, and reviewer information.
  // ==================================================

  getMyRequests = async (req, res) => {
    const { status } = req.query;

    const filter = {
      adopterId: req.user._id,
    };

    if (status) {
      filter.status = status;
    }

    const requests = await AdoptionRequest.find(
      filter,
    )
      .populate(
        "animalId",
        "name species breed gender age ageUnit images adoptionStatus isActive",
      )
      .populate(
        "shelterId",
        "name city address phone logo",
      )
      .populate(
        "reviewedBy",
        "firstName lastName role",
      );

    return res.status(200).json({
      success: true,
      message:
        "Adoption requests retrieved successfully",
      data: requests,
    });
  };

  // ==================================================
  // Get Adoption Request By ID
  // ==================================================
  // • Retrieves one adoption request using its ID.
  // • Allows the adopter to view only their own request.
  // • Allows a shelter employee to view requests belonging to their shelter.
  // • Allows the Super Admin to view requests from active approved shelters.
  // • Returns the populated request after permission verification.
  // ==================================================

  getRequestById = async (req, res) => {
    const request = await AdoptionRequest.findById(
      req.params.id,
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    if (req.user.role === "adopter") {
      if (
        request.adopterId.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this request",
        });
      }
    } else {
      const hasPermission =
        await this.checkShelterPermission(
          req.user,
          request.shelterId,
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this request",
        });
      }
    }

    const populatedRequest =
      await this.populateRequest(request._id);

    return res.status(200).json({
      success: true,
      message:
        "Adoption request retrieved successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Get Shelter Adoption Requests
  // ==================================================
  // • Retrieves adoption requests related to a shelter.
  // • Allows the Super Admin to filter requests by shelter.
  // • Returns only requests from approved and active shelters to the Super Admin.
  // • Requires the shelter employee to have an active profile linked to an active shelter.
  // • Allows filtering by animal, adopter, and request status.
  // ==================================================

  getShelterRequests = async (req, res) => {
    const {
      shelterId,
      animalId,
      adopterId,
      status,
    } = req.query;

    const filter = {};

    if (req.user.role === "superadmin") {
      if (shelterId) {
        const shelter = await Shelter.findOne({
          _id: shelterId,
          verificationStatus: "approved",
          isVerified: true,
          isActive: true,
        });

        if (!shelter) {
          return res.status(404).json({
            success: false,
            message:
              "Active approved shelter not found",
          });
        }

        filter.shelterId = shelter._id;
      } else {
        const activeShelters =
          await Shelter.find({
            verificationStatus: "approved",
            isVerified: true,
            isActive: true,
          }).select("_id");

        filter.shelterId = {
          $in: activeShelters.map(
            (shelter) => shelter._id,
          ),
        };
      }
    } else {
      const employeeProfile =
        await ShelterEmployeeProfile.findOne({
          userId: req.user._id,
          isActive: true,
        });

      if (
        !employeeProfile ||
        !employeeProfile.shelterId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to an active shelter",
        });
      }

      const hasPermission =
        await this.checkShelterPermission(
          req.user,
          employeeProfile.shelterId,
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message:
            "Your shelter is not active or approved",
        });
      }

      filter.shelterId =
        employeeProfile.shelterId;
    }

    if (animalId) {
      filter.animalId = animalId;
    }

    if (adopterId) {
      filter.adopterId = adopterId;
    }

    if (status) {
      filter.status = status;
    }

    const requests = await AdoptionRequest.find(
      filter,
    )
      .populate(
        "adopterId",
        "firstName lastName email phone address profileImage",
      )
      .populate(
        "animalId",
        "name species breed gender age ageUnit images adoptionStatus",
      )
      .populate(
        "shelterId",
        "name city address",
      )
      .populate(
        "reviewedBy",
        "firstName lastName role",
      );

    return res.status(200).json({
      success: true,
      message:
        "Shelter adoption requests retrieved successfully",
      data: requests,
    });
  };

  // ==================================================
  // Update Adoption Request Status
  // ==================================================
  // • Allows the employee or Super Admin to move a request through review stages.
  // • Confirms that the user can manage the shelter related to the request.
  // • Prevents changing requests that are already closed.
  // • Enforces the review sequence from pending review to interview and home check.
  // • Stores the user who performed the latest review action.
  // ==================================================

  updateRequestStatus = async (req, res) => {
    const { status } = req.body;

    const request = await AdoptionRequest.findById(
      req.params.id,
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    const hasPermission =
      await this.checkShelterPermission(
        req.user,
        request.shelterId,
      );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to manage this adoption request",
      });
    }

    const closedStatuses = [
      "approved",
      "rejected",
      "cancelled",
      "completed",
    ];

    if (closedStatuses.includes(request.status)) {
      return res.status(400).json({
        success: false,
        message:
          "The status of this request cannot be changed",
      });
    }

    const allowedTransitions = {
      pendingReview: ["interview"],
      interview: ["homeCheck"],
      homeCheck: [],
    };

    if (
      status !== request.status &&
      !allowedTransitions[
        request.status
      ]?.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot change request status from ${request.status} to ${status}`,
      });
    }

    request.status = status;
    request.reviewedBy = req.user._id;

    await request.save();

    const populatedRequest =
      await this.populateRequest(request._id);

    return res.status(200).json({
      success: true,
      message:
        "Adoption request status updated successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Approve Adoption Request
  // ==================================================
  // • Allows approval only after the request reaches the home check stage.
  // • Confirms that the employee can manage the request shelter.
  // • Changes the animal from available to pending using a conditional update.
  // • Prevents two requests from approving the same animal at the same time.
  // • Restores the animal to available if saving the approved request fails.
  // • Rejects the remaining active requests related to the same animal.
  // ==================================================

  approveRequest = async (req, res) => {
    const request = await AdoptionRequest.findById(
      req.params.id,
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    const hasPermission =
      await this.checkShelterPermission(
        req.user,
        request.shelterId,
      );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to approve this request",
      });
    }

    if (request.status !== "homeCheck") {
      return res.status(400).json({
        success: false,
        message:
          "Only a request that passed the home check can be approved",
      });
    }

    const animal = await Animal.findOneAndUpdate(
      {
        _id: request.animalId,
        shelterId: request.shelterId,
        isActive: true,
        adoptionStatus: "available",
      },
      {
        $set: {
          adoptionStatus: "pending",
        },
      },
      {
        new: true,
      },
    );

    if (!animal) {
      return res.status(409).json({
        success: false,
        message:
          "Animal is not available or already has an approved request",
      });
    }

    const previousRequestData = {
      status: request.status,
      reviewedBy: request.reviewedBy,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      cancelledAt: request.cancelledAt,
      completedAt: request.completedAt,
      rejectionReason:
        request.rejectionReason,
    };

    const approvalDate = new Date();

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.approvedAt = approvalDate;
    request.rejectedAt = null;
    request.cancelledAt = null;
    request.completedAt = null;
    request.rejectionReason = null;

    try {
      await request.save();
    } catch (error) {
      await Animal.findOneAndUpdate(
        {
          _id: animal._id,
          adoptionStatus: "pending",
        },
        {
          $set: {
            adoptionStatus: "available",
          },
        },
      );

      throw error;
    }

    try {
      await AdoptionRequest.updateMany(
        {
          animalId: request.animalId,
          _id: {
            $ne: request._id,
          },
          status: {
            $in: [
              "pendingReview",
              "interview",
              "homeCheck",
            ],
          },
        },
        {
          $set: {
            status: "rejected",
            rejectionReason:
              "Another adoption request was approved for this animal",
            rejectedAt: approvalDate,
            approvedAt: null,
            cancelledAt: null,
            completedAt: null,
            reviewedBy: req.user._id,
          },
        },
      );
    } catch (error) {
      await AdoptionRequest.findByIdAndUpdate(
        request._id,
        {
          $set: previousRequestData,
        },
      );

      await Animal.findOneAndUpdate(
        {
          _id: animal._id,
          adoptionStatus: "pending",
        },
        {
          $set: {
            adoptionStatus: "available",
          },
        },
      );

      throw error;
    }

    const populatedRequest =
      await this.populateRequest(request._id);

    return res.status(200).json({
      success: true,
      message:
        "Adoption request approved successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Reject Adoption Request
  // ==================================================
  // • Requires a rejection reason.
  // • Confirms that the user can manage the request shelter.
  // • Allows rejecting only requests that are still under review.
  // • Prevents rejecting approved, rejected, cancelled, or completed requests.
  // • Updates the request conditionally to avoid conflicting status changes.
  // • Stores the reviewer and rejection date.
  // ==================================================

  rejectRequest = async (req, res) => {
    const { rejectionReason } = req.body;

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required",
      });
    }

    const request = await AdoptionRequest.findById(
      req.params.id,
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    const hasPermission =
      await this.checkShelterPermission(
        req.user,
        request.shelterId,
      );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to reject this request",
      });
    }

    const rejectedAt = new Date();

    const rejectedRequest =
      await AdoptionRequest.findOneAndUpdate(
        {
          _id: request._id,
          status: {
            $in: [
              "pendingReview",
              "interview",
              "homeCheck",
            ],
          },
        },
        {
          $set: {
            status: "rejected",
            rejectionReason:
              rejectionReason.trim(),
            rejectedAt,
            reviewedBy: req.user._id,
            approvedAt: null,
            cancelledAt: null,
            completedAt: null,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!rejectedRequest) {
      return res.status(409).json({
        success: false,
        message:
          "This request cannot be rejected because its status has already changed",
      });
    }

    const populatedRequest =
      await this.populateRequest(
        rejectedRequest._id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Adoption request rejected successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Cancel Current Adopter Request
  // ==================================================
  // • Allows the adopter to cancel only their own request.
  // • Allows cancellation only while the request is still under review.
  // • Prevents cancellation after approval, rejection, cancellation, or completion.
  // • Updates the request conditionally to prevent conflicting status changes.
  // • Stores the cancellation date.
  // • Clears data related to other request states.
  // ==================================================

  cancelMyRequest = async (req, res) => {
    const request =
      await AdoptionRequest.findOne({
        _id: req.params.id,
        adopterId: req.user._id,
      });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    const cancelledRequest =
      await AdoptionRequest.findOneAndUpdate(
        {
          _id: request._id,
          adopterId: req.user._id,
          status: {
            $in: [
              "pendingReview",
              "interview",
              "homeCheck",
            ],
          },
        },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            approvedAt: null,
            rejectedAt: null,
            completedAt: null,
            rejectionReason: null,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!cancelledRequest) {
      return res.status(409).json({
        success: false,
        message:
          "This request cannot be cancelled because its status has already changed",
      });
    }

    const populatedRequest =
      await this.populateRequest(
        cancelledRequest._id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Adoption request cancelled successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Complete Adoption Request
  // ==================================================
  // • Allows completion only for an approved adoption request.
  // • Confirms that the user can manage the request shelter.
  // • Changes the animal from pending to adopted using a conditional update.
  // • Prevents completing the request when the animal is no longer pending.
  // • Updates the request only if it is still approved.
  // • Restores the animal to pending if completing the request fails.
  // • Stores the completion date and the user who completed the process.
  // ==================================================

  completeRequest = async (req, res) => {
    const request = await AdoptionRequest.findById(
      req.params.id,
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    const hasPermission =
      await this.checkShelterPermission(
        req.user,
        request.shelterId,
      );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to complete this request",
      });
    }

    if (request.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Only an approved adoption request can be completed",
      });
    }

    const animal = await Animal.findOneAndUpdate(
      {
        _id: request.animalId,
        shelterId: request.shelterId,
        isActive: true,
        adoptionStatus: "pending",
      },
      {
        $set: {
          adoptionStatus: "adopted",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!animal) {
      return res.status(409).json({
        success: false,
        message:
          "Animal is not pending adoption",
      });
    }

    const completionDate = new Date();

    let completedRequest;

    try {
      completedRequest =
        await AdoptionRequest.findOneAndUpdate(
          {
            _id: request._id,
            status: "approved",
          },
          {
            $set: {
              status: "completed",
              completedAt: completionDate,
              reviewedBy: req.user._id,
              rejectedAt: null,
              cancelledAt: null,
              rejectionReason: null,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        );
    } catch (error) {
      await Animal.findOneAndUpdate(
        {
          _id: animal._id,
          adoptionStatus: "adopted",
        },
        {
          $set: {
            adoptionStatus: "pending",
          },
        },
      );

      throw error;
    }

    if (!completedRequest) {
      await Animal.findOneAndUpdate(
        {
          _id: animal._id,
          adoptionStatus: "adopted",
        },
        {
          $set: {
            adoptionStatus: "pending",
          },
        },
      );

      return res.status(409).json({
        success: false,
        message:
          "The adoption request status was changed before completion",
      });
    }

    const populatedRequest =
      await this.populateRequest(
        completedRequest._id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Adoption process completed successfully",
      data: populatedRequest,
    });
  };

  // ==================================================
  // Cancel Approved Adoption Request
  // ==================================================
  // • Allows cancellation only for an approved request.
  // • Requires a reason for cancelling the approval.
  // • Confirms that the user can manage the request shelter.
  // • Changes the animal from pending back to available.
  // • Updates the request only if it is still approved.
  // • Changes the request from approved to rejected.
  // • Clears the approval date and stores the rejection date.
  // • Restores the animal to pending if updating the request fails.
  // ==================================================

  cancelApprovedRequest = async (req, res) => {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Approval cancellation reason is required",
      });
    }

    const request = await AdoptionRequest.findById(
      req.params.id,
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    const hasPermission =
      await this.checkShelterPermission(
        req.user,
        request.shelterId,
      );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to cancel this approval",
      });
    }

    if (request.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Only an approved request can have its approval cancelled",
      });
    }

    const animal = await Animal.findOneAndUpdate(
      {
        _id: request.animalId,
        shelterId: request.shelterId,
        isActive: true,
        adoptionStatus: "pending",
      },
      {
        $set: {
          adoptionStatus: "available",
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!animal) {
      return res.status(409).json({
        success: false,
        message:
          "The animal status does not allow cancelling the approval",
      });
    }

    const rejectionDate = new Date();

    let rejectedRequest;

    try {
      rejectedRequest =
        await AdoptionRequest.findOneAndUpdate(
          {
            _id: request._id,
            status: "approved",
          },
          {
            $set: {
              status: "rejected",
              rejectionReason: reason.trim(),
              rejectedAt: rejectionDate,
              reviewedBy: req.user._id,
              approvedAt: null,
              cancelledAt: null,
              completedAt: null,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        );
    } catch (error) {
      await Animal.findOneAndUpdate(
        {
          _id: animal._id,
          adoptionStatus: "available",
        },
        {
          $set: {
            adoptionStatus: "pending",
          },
        },
      );

      throw error;
    }

    if (!rejectedRequest) {
      await Animal.findOneAndUpdate(
        {
          _id: animal._id,
          adoptionStatus: "available",
        },
        {
          $set: {
            adoptionStatus: "pending",
          },
        },
      );

      return res.status(409).json({
        success: false,
        message:
          "The adoption request status was changed before cancelling the approval",
      });
    }

    const populatedRequest =
      await this.populateRequest(
        rejectedRequest._id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Approved request cancelled and animal is available again",
      data: populatedRequest,
    });
  };
}

module.exports =
  new AdoptionRequestController();