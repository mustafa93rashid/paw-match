const Shelter = require("../models/Shelter");
const User = require("../models/User");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");
const VetProfile = require("../models/VetProfile");
class ShelterController {
  // Create shelter
  createShelter = async (req, res) => {
    const {
      name,
      email,
      phone,
      logo,
      images,
      description,
      address,
      city,
      latitude,
      longitude,
      supportedSpecies,
      capacity,
      operatingHours,
      socialLinks,
    } = req.body;

    const existingShelter = await Shelter.findOne({ email });

    if (existingShelter) {
      return res.status(409).json({
        success: false,
        message: "Shelter email already exists",
      });
    }

    const shelterData = {
      name,
      email,
      phone,
      logo,
      images,
      description,
      address,
      city,
      supportedSpecies,
      capacity,
      operatingHours,
      socialLinks,
      createdBy: req.user._id,
      verificationStatus: "pending",
      isVerified: false,
      isActive: true,
    };

    /*
      GeoJSON coordinates order:
      [longitude, latitude]
    */
    if (longitude !== undefined && latitude !== undefined) {
      shelterData.longitude = longitude;
      shelterData.latitude = latitude;

      shelterData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const shelter = await Shelter.create(shelterData);

    return res.status(201).json({
      success: true,
      message: "Shelter created and waiting for superadmin approval",
      data: shelter,
    });
  };

  // Get approved and active shelters for public users
  getPublicShelters = async (req, res) => {
    const { city, species, search } = req.query;

    const filter = {
      isVerified: true,
      verificationStatus: "approved",
      isActive: true,
    };

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (species) {
      filter.supportedSpecies = species;
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          address: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const shelters = await Shelter.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .populate("verifiedBy", "firstName lastName");

    return res.status(200).json({
      success: true,
      message: "Shelters retrieved successfully",
      data: shelters,
    });
  };

  // Get all shelters for superadmin
  getAllShelters = async (req, res) => {
    const { verificationStatus, isActive, city } = req.query;

    const filter = {};

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    const shelters = await Shelter.find(filter)
      .populate("createdBy", "firstName lastName email role")
      .populate("verifiedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Shelters retrieved successfully",
      data: shelters,
    });
  };

  // Get one shelter
  getShelterById = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id)
      .populate("createdBy", "firstName lastName email phone role profileImage")
      .populate(
        "employees",
        "firstName lastName email phone role profileImage isActive",
      )
      .populate("animalIds")
      .populate("verifiedBy", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName");

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    /*
      المستخدم العادي لا يستطيع مشاهدة ملجأ:
      - غير مقبول
      - أو غير فعال
    */
    const isSuperAdmin = req.user?.role === "superadmin";

    if (
      !isSuperAdmin &&
      (!shelter.isVerified ||
        shelter.verificationStatus !== "approved" ||
        !shelter.isActive)
    ) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shelter retrieved successfully",
      data: shelter,
    });
  };

  // Update shelter
  updateShelter = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

const currentUserId = String(req.user._id);
    const isOwner = String(shelter.createdBy) === currentUserId;
    const isSuperAdmin = req.user.role === "superadmin";

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this shelter",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "logo",
      "images",
      "description",
      "address",
      "city",
      "supportedSpecies",
      "capacity",
      "operatingHours",
      "socialLinks",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shelter[field] = req.body[field];
      }
    });

    if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
      shelter.longitude = Number(req.body.longitude);
      shelter.latitude = Number(req.body.latitude);

      shelter.location = {
        type: "Point",
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    /*
      عند تعديل البيانات من مالك الملجأ،
      يرجع طلب الموافقة إلى pending.
      تعديل السوبر أدمن لا يلغي الموافقة.
    */
    if (!isSuperAdmin) {
      shelter.verificationStatus = "pending";
      shelter.isVerified = false;
      shelter.verifiedBy = null;
      shelter.verifiedAt = null;
      shelter.rejectionReason = null;
    }

    await shelter.save();

    return res.status(200).json({
      success: true,
      message: isSuperAdmin
        ? "Shelter updated successfully"
        : "Shelter updated and sent for approval again",
      data: shelter,
    });
  };

  // Approve shelter - superadmin only
  approveShelter = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    if (shelter.verificationStatus === "approved" && shelter.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Shelter is already approved",
      });
    }

    shelter.verificationStatus = "approved";
    shelter.isVerified = true;
    shelter.isActive = true;
    shelter.rejectionReason = null;
shelter.verifiedBy = req.user._id;
    shelter.verifiedAt = new Date();

    await shelter.save();

    return res.status(200).json({
      success: true,
      message: "Shelter approved successfully",
      data: shelter,
    });
  };

  // Reject shelter - superadmin only
  rejectShelter = async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    shelter.verificationStatus = "rejected";
    shelter.isVerified = false;
    shelter.rejectionReason = reason.trim();
shelter.verifiedBy = req.user._id;
    shelter.verifiedAt = new Date();

    await shelter.save();

    return res.status(200).json({
      success: true,
      message: "Shelter rejected successfully",
      data: shelter,
    });
  };

  // Toggle shelter status - soft delete
  toggleShelterStatus = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    if (!shelter.isActive && !shelter.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Shelter must be approved before activation",
      });
    }

    shelter.isActive = !shelter.isActive;

    await shelter.save();

    return res.status(200).json({
      success: true,
      message: shelter.isActive
        ? "Shelter activated successfully"
        : "Shelter deactivated successfully",
      data: shelter,
    });
  };

  // Permanent delete - superadmin only
  permanentlyDeleteShelter = async (req, res) => {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    /*
      يفضل السماح بالحذف النهائي فقط بعد تعطيل الملجأ
      لمنع الحذف بالخطأ.
    */
    if (shelter.isActive) {
      return res.status(400).json({
        success: false,
        message: "Deactivate the shelter before permanently deleting it",
      });
    }

    await shelter.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Shelter permanently deleted successfully",
    });
  };

  // Add employee to shelter
// Add employee to shelter
addEmployee = async (req, res) => {
  const { employeeId } = req.body;

  // التحقق من إرسال employeeId
  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: "Employee ID is required",
    });
  }

  // جلب الملجأ من ID الموجود في الرابط
  const shelter = await Shelter.findById(req.params.id);

  if (!shelter) {
    return res.status(404).json({
      success: false,
      message: "Shelter not found",
    });
  }

  // منع إضافة موظفين إلى ملجأ غير موافق عليه أو غير فعال
  if (
    !shelter.isVerified ||
    shelter.verificationStatus !== "approved" ||
    !shelter.isActive
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Employees can only be added to an approved and active shelter",
    });
  }

  // جلب المستخدم المراد إضافته
  const employee = await User.findById(employeeId);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // منع إضافة حساب غير فعال
  if (!employee.isActive) {
    return res.status(403).json({
      success: false,
      message: "Inactive user cannot be added to a shelter",
    });
  }

  // السماح فقط لموظف ملجأ أو طبيب
  if (!["shelterEmployee", "vet"].includes(employee.role)) {
    return res.status(400).json({
      success: false,
      message: "User role must be shelterEmployee or vet",
    });
  }

  let employeeProfile;

  // جلب بروفايل موظف الملجأ
  if (employee.role === "shelterEmployee") {
    employeeProfile = await ShelterEmployeeProfile.findOne({
      userId: employee._id,
      isActive: true,
    });
  }

  // جلب بروفايل الطبيب
  if (employee.role === "vet") {
    employeeProfile = await VetProfile.findOne({
      userId: employee._id,
      isActive: true,
    });
  }

  if (!employeeProfile) {
    return res.status(404).json({
      success: false,
      message:
        employee.role === "vet"
          ? "Active vet profile not found"
          : "Active shelter employee profile not found",
    });
  }

  // منع إضافة الموظف إذا كان تابعًا إلى ملجأ آخر
  if (
    employeeProfile.shelterId &&
    String(employeeProfile.shelterId) !== String(shelter._id)
  ) {
    return res.status(409).json({
      success: false,
      message: "Employee already belongs to another shelter",
    });
  }

  // التحقق هل الموظف موجود أصلًا داخل الملجأ
  const employeeExists = shelter.employees.some(
    (id) => String(id) === String(employee._id),
  );

  if (employeeExists) {
    return res.status(409).json({
      success: false,
      message: "Employee already belongs to this shelter",
    });
  }

  // إضافة المستخدم إلى قائمة موظفي الملجأ
  shelter.employees.push(employee._id);

  // ربط بروفايل الموظف بالملجأ
  employeeProfile.shelterId = shelter._id;

  // حفظ التعديلين معًا
  await Promise.all([
    shelter.save(),
    employeeProfile.save(),
  ]);

  // إرجاع الملجأ بعد تعبئة بيانات الموظفين
  const updatedShelter = await Shelter.findById(
    shelter._id,
  ).populate(
    "employees",
    "firstName lastName email phone role profileImage isActive",
  );

  return res.status(200).json({
    success: true,
    message: "Employee added to shelter successfully",
    data: updatedShelter,
  });
};

  // Remove employee from shelter
  removeEmployee = async (req, res) => {
    const { employeeId } = req.params;

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let employeeProfile;

    if (employee.role === "shelterEmployee") {
      employeeProfile = await ShelterEmployeeProfile.findOne({
        userId: employee._id,
      });
    }

    if (employee.role === "vet") {
      employeeProfile = await VetProfile.findOne({
        userId: employee._id,
      });
    }

    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const employeeExists = shelter.employees.some(
      (id) => String(id) === String(employeeId),
    );

    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in this shelter",
      });
    }

    shelter.employees = shelter.employees.filter(
      (id) => String(id) !== String(employeeId),
    );

    if (
      employeeProfile.shelterId &&
      String(employeeProfile.shelterId) === String(shelter._id)
    ) {
      employeeProfile.shelterId = null;
    }

    await Promise.all([shelter.save(), employeeProfile.save()]);

    const updatedShelter = await Shelter.findById(shelter._id).populate(
      "employees",
      "firstName lastName email phone role profileImage isActive",
    );

    return res.status(200).json({
      success: true,
      message: "Employee removed from shelter successfully",
      data: updatedShelter,
    });
  };
}

module.exports = new ShelterController();
