const AdoptionRequest = require("../models/AdoptionRequest");
const Animal = require("../models/Animal");
const AdopterProfile = require("../models/AdopterProfile");
const ShelterEmployeeProfile = require(
  "../models/ShelterEmployeeProfile",
);

class AdoptionRequestController {
  /*
  |--------------------------------------------------------------------------
  | Helper: التحقق من صلاحية موظف الملجأ
  |--------------------------------------------------------------------------
  */

  checkShelterPermission = async (user, shelterId) => {
    // السوبر أدمن يستطيع إدارة جميع الملاجئ
    if (user.role === "superadmin") {
      return true;
    }

    if (user.role !== "shelterEmployee") {
      return false;
    }

    const employeeProfile =
      await ShelterEmployeeProfile.findOne({
        userId: user._id,
        isActive: true,
      });

    if (!employeeProfile || !employeeProfile.shelterId) {
      return false;
    }

    return (
      employeeProfile.shelterId.toString() ===
      shelterId.toString()
    );
  };

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/adoptions
  | إنشاء طلب تبني
  |--------------------------------------------------------------------------
  */

  createRequest = async (req, res) => {
    const { animalId, message } = req.body;

    if (!animalId) {
      return res.status(400).json({
        success: false,
        message: "Animal ID is required",
      });
    }

    const adopterProfile = await AdopterProfile.findOne({
      userId: req.user._id,
    });

    if (!adopterProfile) {
      return res.status(404).json({
        success: false,
        message: "Adopter profile not found",
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
        message: "Animal is not available for adoption",
      });
    }

    const existingRequest = await AdoptionRequest.findOne({
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
      return res.status(400).json({
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
        message: message || null,
      });

    const populatedRequest =
      await AdoptionRequest.findById(
        adoptionRequest._id,
      )
        .populate(
          "adopterId",
          "firstName lastName email phone profileImage",
        )
        .populate(
          "animalId",
          "name species breed gender age ageUnit images adoptionStatus",
        )
        .populate("shelterId", "name city address");

    return res.status(201).json({
      success: true,
      message: "Adoption request created successfully",
      data: populatedRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/adoptions/my
  | عرض طلبات المتبني الحالي
  |--------------------------------------------------------------------------
  */

  getMyRequests = async (req, res) => {
    const {
      status,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const filter = {
      adopterId: req.user._id,
    };

    if (status) {
      filter.status = status;
    }

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * pageLimit;

    const [requests, total] = await Promise.all([
      AdoptionRequest.find(filter)
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
        )
        .sort(sort)
        .skip(skip)
        .limit(pageLimit),

      AdoptionRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Adoption requests retrieved successfully",
      data: requests,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/adoptions/:id
  | عرض طلب واحد
  |--------------------------------------------------------------------------
  */

  getRequestById = async (req, res) => {
    const request = await AdoptionRequest.findById(
      req.params.id,
    )
      .populate(
        "adopterId",
        "firstName lastName email phone address profileImage",
      )
      .populate(
        "animalId",
        "name species breed gender age ageUnit size healthStatus vaccinated images adoptionStatus",
      )
      .populate(
        "shelterId",
        "name city address phone logo",
      )
      .populate(
        "reviewedBy",
        "firstName lastName role",
      );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    if (req.user.role === "adopter") {
      if (
        request.adopterId._id.toString() !==
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
          request.shelterId._id,
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this request",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Adoption request retrieved successfully",
      data: request,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/adoptions/shelter
  | عرض طلبات الملجأ الخاص بالموظف
  |--------------------------------------------------------------------------
  */

  getShelterRequests = async (req, res) => {
    const {
      shelterId,
      animalId,
      adopterId,
      status,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (req.user.role === "superadmin") {
      if (shelterId) {
        filter.shelterId = shelterId;
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

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * pageLimit;

    const [requests, total] = await Promise.all([
      AdoptionRequest.find(filter)
        .populate(
          "adopterId",
          "firstName lastName email phone address profileImage isProfileCompleted",
        )
        .populate(
          "animalId",
          "name species breed gender age ageUnit images adoptionStatus",
        )
        .populate("shelterId", "name city address")
        .populate(
          "reviewedBy",
          "firstName lastName role",
        )
        .sort(sort)
        .skip(skip)
        .limit(pageLimit),

      AdoptionRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Shelter adoption requests retrieved successfully",
      data: requests,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/adoptions/:id/status
  | نقل الطلب بين مراحل المراجعة
  |--------------------------------------------------------------------------
  */

  updateRequestStatus = async (req, res) => {
    const { status } = req.body;

    const reviewStatuses = [
      "pendingReview",
      "interview",
      "homeCheck",
    ];

    if (!reviewStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be pendingReview, interview or homeCheck",
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
      !allowedTransitions[request.status]?.includes(status)
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
      await AdoptionRequest.findById(request._id)
        .populate(
          "adopterId",
          "firstName lastName email phone profileImage",
        )
        .populate(
          "animalId",
          "name species breed images adoptionStatus",
        )
        .populate("shelterId", "name city")
        .populate(
          "reviewedBy",
          "firstName lastName role",
        );

    return res.status(200).json({
      success: true,
      message:
        "Adoption request status updated successfully",
      data: populatedRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/adoptions/:id/approve
  | قبول طلب واحد ورفض الطلبات الأخرى
  |--------------------------------------------------------------------------
  */

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

    if (
      [
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ].includes(request.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "This request cannot be approved",
      });
    }

    const animal = await Animal.findOneAndUpdate(
      {
        _id: request.animalId,
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
      return res.status(400).json({
        success: false,
        message:
          "Animal is not available or already has an approved request",
      });
    }

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.approvedAt = new Date();
    request.rejectionReason = null;

    await request.save();

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
          reviewedBy: req.user._id,
        },
      },
    );

    const populatedRequest =
      await AdoptionRequest.findById(request._id)
        .populate(
          "adopterId",
          "firstName lastName email phone profileImage",
        )
        .populate(
          "animalId",
          "name species breed images adoptionStatus",
        )
        .populate("shelterId", "name city")
        .populate(
          "reviewedBy",
          "firstName lastName role",
        );

    return res.status(200).json({
      success: true,
      message:
        "Adoption request approved successfully",
      data: populatedRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/adoptions/:id/reject
  | رفض طلب
  |--------------------------------------------------------------------------
  */

  rejectRequest = async (req, res) => {
    const { rejectionReason } = req.body;

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
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

    if (
      [
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ].includes(request.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "This request cannot be rejected",
      });
    }

    request.status = "rejected";
    request.rejectionReason =
      rejectionReason.trim();
    request.reviewedBy = req.user._id;

    await request.save();

    const populatedRequest =
      await AdoptionRequest.findById(request._id)
        .populate(
          "adopterId",
          "firstName lastName email phone profileImage",
        )
        .populate(
          "animalId",
          "name species breed images adoptionStatus",
        )
        .populate("shelterId", "name city")
        .populate(
          "reviewedBy",
          "firstName lastName role",
        );

    return res.status(200).json({
      success: true,
      message:
        "Adoption request rejected successfully",
      data: populatedRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/adoptions/:id/cancel
  | إلغاء الطلب من المتبني
  |--------------------------------------------------------------------------
  */

  cancelMyRequest = async (req, res) => {
    const request = await AdoptionRequest.findOne({
      _id: req.params.id,
      adopterId: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Adoption request not found",
      });
    }

    if (
      [
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ].includes(request.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "This request cannot be cancelled",
      });
    }

    request.status = "cancelled";

    await request.save();

    return res.status(200).json({
      success: true,
      message:
        "Adoption request cancelled successfully",
      data: request,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/adoptions/:id/complete
  | إكمال عملية التبني
  |--------------------------------------------------------------------------
  */

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

    const animal = await Animal.findOne({
      _id: request.animalId,
      isActive: true,
    });

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    if (animal.adoptionStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Animal is not pending adoption",
      });
    }

    request.status = "completed";
    request.completedAt = new Date();
    request.reviewedBy = req.user._id;

    await request.save();

    animal.adoptionStatus = "adopted";

    await animal.save();

    const populatedRequest =
      await AdoptionRequest.findById(request._id)
        .populate(
          "adopterId",
          "firstName lastName email phone profileImage",
        )
        .populate(
          "animalId",
          "name species breed images adoptionStatus",
        )
        .populate("shelterId", "name city")
        .populate(
          "reviewedBy",
          "firstName lastName role",
        );

    return res.status(200).json({
      success: true,
      message:
        "Adoption process completed successfully",
      data: populatedRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/adoptions/:id/cancel-approval
  | إلغاء الموافقة وإعادة الحيوان إلى available
  |--------------------------------------------------------------------------
  */

  cancelApprovedRequest = async (req, res) => {
    const { reason } = req.body;

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

    const animal = await Animal.findById(
      request.animalId,
    );

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    request.status = "rejected";
    request.rejectionReason =
      reason?.trim() ||
      "Approved adoption request was cancelled";
    request.reviewedBy = req.user._id;

    await request.save();

    animal.adoptionStatus = "available";

    await animal.save();

    return res.status(200).json({
      success: true,
      message:
        "Approved request cancelled and animal is available again",
      data: request,
    });
  };
}

module.exports = new AdoptionRequestController();