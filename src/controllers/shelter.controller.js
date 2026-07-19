const mongoose = require("mongoose");
const Shelter = require("../models/Shelter");
const User = require("../models/User");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");
const VetProfile = require("../models/VetProfile");

const { uploadBufferToCloudinary, deleteImage, deleteImages } = require("../services/cloudinary.service");

const Animal = require("../models/Animal");
const AdoptionRequest = require("../models/AdoptionRequest");

const {uploadBufferToCloudinary, deleteImage, deleteImages} = require("../services/cloudinary.service");

// Maximum number of gallery images for one shelter.
const MAX_SHELTER_IMAGES = 8;

//============================================================
// Check Shelter Employee Permission
//============================================================
const checkShelterEmployeePermission = async ({
  //
  // • Determines whether a user can manage a shelter
  //   and its employees.
  // • Grants full access to Super Admin for every shelter.
  // • Rejects all roles except Shelter Employees.
  // • Requires the employee to exist in the shelter's
  //   employee list.
  // • Requires an active Shelter Employee profile linked
  //   to the same shelter.
  // • Grants permission only when the employee position
  //   is Manager.
  // • The shelter creator does not receive permanent
  //   permission based only on createdBy.
  // • Supports an optional database session.
  //============================================================
  user,
  shelter,
  session = null,
}) => {
  if (user.role === "superadmin") {
    return true;
  }

  if (user.role !== "shelterEmployee") {
    return false;
  }

  const userId = user._id || user.id;

  if (!userId || !shelter?._id) {
    return false;
  }

  const existsInShelter = shelter.employees.some(
    (employeeId) => String(employeeId) === String(userId),
  );

  if (!existsInShelter) {
    return false;
  }

  let employeeProfileQuery = ShelterEmployeeProfile.findOne({
    userId,
    shelterId: shelter._id,
    isActive: true,
    position: "Manager",
  });

  if (session) {
    employeeProfileQuery = employeeProfileQuery.session(session);
  }

  const employeeProfile = await employeeProfileQuery;

  return Boolean(employeeProfile);
};

class ShelterController {
  //============================================================
  // Build Uploaded Image
  //============================================================
  // • Converts the Cloudinary upload response into
  //   the image structure stored in MongoDB.
  // • Stores both secure URL and public ID.
  //============================================================
  buildUploadedImage = (result) => ({
    url: result.secure_url,
    publicId: result.public_id,
  });

  //============================================================
  // Check Shelter Availability
  //============================================================
  // • Returns true only when the shelter is:
  //   approved, verified, and active.
  //============================================================
  isShelterAvailable = (shelter) => {
    return (
      shelter &&
      shelter.verificationStatus === "approved" &&
      shelter.isVerified === true &&
      shelter.isActive === true
    );
  };

  //============================================================
  // Create Shelter
  //============================================================
  createShelter = async (req, res) => {
    // • Creates a new shelter and records the authenticated
    //   user as the shelter creator.
    // • Prevents duplicate shelters by email.
    // • Does not accept logo or gallery images through
    //   the request body.
    // • Logo and gallery images must be managed through
    //   their dedicated upload endpoints.
    // • If the creator is a Shelter Employee, verifies
    //   that an active employee profile exists.
    // • Prevents the employee from creating another shelter
    //   while their profile is linked to an existing shelter.
    // • Automatically adds the creator as the first employee.
    // • Links the employee profile to the newly created shelter.
    // • Rolls back shelter creation if profile linking fails.
    // • Leaves the shelter pending and inactive until approved.
    //============================================================

    const {
      name,
      email,
      phone,

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

    // Images cannot be controlled through JSON data.
    if (req.body.logo !== undefined || req.body.images !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Shelter logo and images must be managed through image upload endpoints",
      });
    }

    const existingShelter = await Shelter.findOne({
      email,
    });

    if (existingShelter) {
      return res.status(409).json({
        success: false,
        message: "Shelter email already exists",
      });
    }

    let employeeProfile = null;

    if (req.user.role === "shelterEmployee") {
      employeeProfile = await ShelterEmployeeProfile.findOne({
        userId: req.user._id,
        isActive: true,
      });

      if (!employeeProfile) {
        return res.status(404).json({
          success: false,
          message: "Active shelter employee profile not found",
        });
      }

      if (employeeProfile.shelterId) {
        return res.status(409).json({
          success: false,
          message: "Employee already belongs to a shelter",
        });
      }
    }

    const shelterData = {
      name,
      email,
      phone,

      description,
      address,
      city,
      supportedSpecies,
      capacity,
      operatingHours,
      socialLinks,
      createdBy: req.user._id,

      // Explicit default administrative state.
      verificationStatus: "pending",
      isVerified: false,
      isActive: false,
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,

      // Images are managed separately.
      logo: null,
      images: [],
    };

    if (req.user.role === "shelterEmployee") {
      shelterData.employees = [req.user._id];
    }

    if (longitude !== undefined && latitude !== undefined) {
      shelterData.longitude = Number(longitude);

      shelterData.latitude = Number(latitude);

      shelterData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const shelter = await Shelter.create(shelterData);

    if (employeeProfile) {
      employeeProfile.shelterId = shelter._id;

      try {
        await employeeProfile.save();
      } catch (error) {
        await Shelter.findByIdAndDelete(shelter._id);

        throw error;
      }
    }

    return res.status(201).json({
      success: true,
      message: "Shelter created and waiting for superadmin approval",
      data: shelter,
    });
  };

  //============================================================
  // Get Public Shelters
  //============================================================
  getPublicShelters = async (req, res) => {
    // • Retrieves only approved, verified, and active shelters.
    // • Supports city and species filters.
    // • Supports keyword searching by name, description,
    //   and address.
    // • Returns public-facing shelter information only.
    //============================================================

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
      .select(
        [
          "name",
          "email",
          "phone",
          "logo",
          "images",
          "description",
          "address",
          "city",
          "location",
          "supportedSpecies",
          "capacity",
          "operatingHours",
          "socialLinks",
          "createdAt",
        ].join(" "),
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Shelters retrieved successfully",
      count: shelters.length,
      data: shelters,
    });
  };

  //============================================================
  // Get All Shelters
  //============================================================
  getAllShelters = async (req, res) => {
    // • Intended for Super Admin.
    // • Retrieves shelters regardless of verification
    //   and activation status.
    // • Supports verification status, active status,
    //   and city filters.
    //============================================================

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
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "Shelters retrieved successfully",
      data: shelters,
    });
  };
  //============================================================
  // Get Shelter by ID
  //============================================================
  getShelterById = async (req, res) => {
    // • Retrieves a shelter using its unique ID.
    // • Gives Super Admin full access to shelter details.
    // • Gives Shelter Employees administrative access only
    //   when they have an active profile linked to the shelter.
    // • Other users receive public information only.
    // • Public access is allowed only when the shelter is
    //   approved, verified, and active.
    //============================================================

    const shelterId = req.params.id;

    const currentUser = req.user;

    // Super Admin receives full details.
    if (currentUser.role === "superadmin") {
      const shelter = await Shelter.findById(shelterId)
        .populate({
          path: "createdBy",
          select: "firstName lastName email phone role isActive",
        })
        .populate({
          path: "verifiedBy",
          select: "firstName lastName email role",
        })
        .populate({
          path: "employees",
          select: "firstName lastName email phone role isActive",
        })
        .populate({
          path: "animalIds",
          select:
            "name species breed gender age ageUnit adoptionStatus healthStatus images isActive",
        });

      if (!shelter) {
        return res.status(404).json({
          success: false,
          message: "Shelter not found",
        });
      }

      return res.status(200).json({
        success: true,
        accessLevel: "superadmin",
        data: shelter,
      });
    }

    // Shelter Employees receive administrative details
    // only when their active profile is linked
    // to the requested shelter.
    if (currentUser.role === "shelterEmployee") {
      const employeeProfile = await ShelterEmployeeProfile.findOne({
        userId: currentUser._id,
        shelterId,
        isActive: true,
      });

      if (employeeProfile) {
        const shelter = await Shelter.findById(shelterId)
          .populate({
            path: "createdBy",
            select: "firstName lastName email phone role isActive",
          })
          .populate({
            path: "employees",
            select: "firstName lastName email phone role isActive",
          })
          .populate({
            path: "animalIds",
            select:
              "name species breed gender age ageUnit adoptionStatus healthStatus images isActive addedBy createdAt",
            populate: {
              path: "addedBy",
              select: "firstName lastName role",
            },
          });

        if (!shelter) {
          return res.status(404).json({
            success: false,
            message: "Shelter not found",
          });
        }

        return res.status(200).json({
          success: true,
          accessLevel: "shelterEmployee",
          data: shelter,
        });
      }
    }

    // Public access.
    const shelter = await Shelter.findOne({
      _id: shelterId,
      verificationStatus: "approved",
      isVerified: true,
      isActive: true,
    })
      .select(
        [
          "name",
          "logo",
          "images",
          "description",
          "address",
          "city",
          "location",
          "supportedSpecies",
          "capacity",
          "operatingHours",
          "socialLinks",
          "phone",
          "email",
          "verificationStatus",
          "isVerified",
          "isActive",
        ].join(" "),
      )
      .populate({
        path: "animalIds",
        match: {
          isActive: true,
          adoptionStatus: {
            $in: ["available", "pending"],
          },
        },
        select:
          "name species breed gender age ageUnit size color healthStatus vaccinated description images adoptionStatus",
      });

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found or is not publicly available",
      });
    }

    return res.status(200).json({
      success: true,
      accessLevel: "public",
      data: shelter,
    });
  };

  //============================================================
  // Update Shelter
  //============================================================
  updateShelter = async (req, res) => {
    // • Updates an existing shelter.
    // • Allows Super Admin or an authorized active Manager.
    // • Prevents direct updates to logo and images.
    // • Prevents direct updates to protected administrative fields.
    // • Shelter Employee updates return the shelter
    //   to pending verification.
    // • Super Admin updates preserve the current approval state.
    //============================================================

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const canManageShelter = await checkShelterEmployeePermission({
      user: req.user,
      shelter,
    });

    if (!canManageShelter) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this shelter",
      });
    }

    // Images must be managed through dedicated endpoints.
    if (req.body.logo !== undefined || req.body.images !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Shelter logo and images must be managed through image endpoints",
      });
    }

    // Protected administrative fields cannot be changed directly.
    const protectedFields = [
      "createdBy",
      "verifiedBy",
      "verifiedAt",
      "verificationStatus",
      "isVerified",
      "isActive",
      "rejectionReason",
      "employees",
      "animalIds",
    ];

    const hasProtectedField = protectedFields.some(
      (field) => req.body[field] !== undefined,
    );

    if (hasProtectedField) {
      return res.status(400).json({
        success: false,
        message: "Protected shelter fields cannot be updated directly",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",

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

    // Coordinates must be provided together.
    const hasLongitude = req.body.longitude !== undefined;

    const hasLatitude = req.body.latitude !== undefined;

    if (hasLongitude !== hasLatitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude must be provided together",
      });
    }

    if (hasLongitude && hasLatitude) {
      const longitude = Number(req.body.longitude);

      const latitude = Number(req.body.latitude);

      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return res.status(400).json({
          success: false,
          message: "Longitude and latitude must be valid numbers",
        });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Longitude must be between -180 and 180",
        });
      }

      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          message: "Latitude must be between -90 and 90",
        });
      }

      shelter.longitude = longitude;

      shelter.latitude = latitude;

      shelter.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    const isSuperAdmin = req.user.role === "superadmin";

    // Employee updates require review again.
    if (!isSuperAdmin) {
      shelter.verificationStatus = "pending";

      shelter.isVerified = false;

      shelter.isActive = false;

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

  //============================================================
  // Approve Shelter
  //============================================================
  approveShelter = async (req, res) => {
    // • Approves and activates the shelter.
    // • Prevents approving an already approved shelter.
    // • Clears previous rejection details.
    // • Records the Super Admin and approval date.
    //============================================================

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    if (
      shelter.verificationStatus === "approved" &&
      shelter.isVerified === true
    ) {
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

  //============================================================
  // Reject Shelter
  //============================================================
  rejectShelter = async (req, res) => {
    // • Rejects and deactivates the shelter.
    // • Requires a rejection reason.
    // • Records the Super Admin and review date.
    //============================================================

    const { reason } = req.body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
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

    shelter.isActive = false;

    shelter.rejectionReason = reason.trim();

    shelter.verifiedBy = req.user._id;

    shelter.verifiedAt = new Date();

    await shelter.save();

    return res.status(200).json({
      success: true,
      message: "Shelter rejected and deactivated successfully",
      data: shelter,
    });
  };

  //============================================================
  // Toggle Shelter Status
  //============================================================
  toggleShelterStatus = async (req, res) => {
    // • Activates or deactivates a shelter.
    // • Allows activation only when approved and verified.
    // • Deactivation does not remove employees or images.
    //============================================================

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const isTryingToActivate = !shelter.isActive;

    if (
      isTryingToActivate &&
      !this.isShelterAvailable({
        ...shelter.toObject(),
        isActive: true,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "Shelter must be approved and verified before activation",
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
  //============================================================
  // Permanently Delete Shelter
  //============================================================
  permanentlyDeleteShelter = async (req, res) => {
    // • Permanently removes an inactive shelter.
    // • Prevents deletion while active adoption requests exist.
    // • Collects the shelter and animal image public IDs
    //   before deleting database records.
    // • Removes employee and veterinarian relationships.
    // • Deletes completed, rejected, and cancelled adoption
    //   requests related to the shelter.
    // • Deletes all animals belonging to the shelter.
    // • Deletes the shelter document after cleaning relations.
    // • Attempts to remove Cloudinary files after the database
    //   deletion succeeds.
    // • Cloudinary cleanup failure does not make the completed
    //   database deletion fail.
    //============================================================

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    // The shelter must be inactive before permanent deletion.
    if (shelter.isActive) {
      return res.status(400).json({
        success: false,
        message: "Deactivate the shelter before permanently deleting it",
      });
    }

    // Active adoption requests prevent permanent deletion.
    const activeAdoptionRequestsCount = await AdoptionRequest.countDocuments({
      shelterId: shelter._id,
      status: {
        $nin: ["cancelled", "rejected", "completed"],
      },
    });

    if (activeAdoptionRequestsCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "All active adoption requests must be completed, rejected, or cancelled before permanently deleting the shelter",
        activeAdoptionRequestsCount,
      });
    }

    // Retrieve animals before deleting them
    // so their Cloudinary public IDs can be collected.
    const shelterAnimals = await Animal.find({
      shelterId: shelter._id,
    }).select("images");

    const cloudinaryPublicIds = [];

    // Collect the shelter logo public ID.
    if (shelter.logo?.publicId) {
      cloudinaryPublicIds.push(shelter.logo.publicId);
    }

    // Collect shelter gallery image public IDs.
    if (Array.isArray(shelter.images)) {
      shelter.images.forEach((image) => {
        if (image?.publicId) {
          cloudinaryPublicIds.push(image.publicId);
        }
      });
    }

    // Collect animal image public IDs.
    shelterAnimals.forEach((animal) => {
      if (Array.isArray(animal.images)) {
        animal.images.forEach((image) => {
          if (image?.publicId) {
            cloudinaryPublicIds.push(image.publicId);
          }
        });
      }
    });

    // Remove the shelter relationship from employee profiles.
    await ShelterEmployeeProfile.updateMany(
      {
        shelterId: shelter._id,
      },
      {
        $set: {
          shelterId: null,
          position: "Employee",
          employeeNumber: null,
          hireDate: null,
        },
      },
      {
        runValidators: true,
      },
    );

    // Remove the shelter relationship from veterinarian profiles.
    await VetProfile.updateMany(
      {
        shelterId: shelter._id,
      },
      {
        $set: {
          shelterId: null,
        },
      },
    );

    // All remaining requests are now terminal
    // because active requests were checked above.
    const deletedAdoptionRequests = await AdoptionRequest.deleteMany({
      shelterId: shelter._id,
    });

    // Delete all animals belonging to the shelter.
    const deletedAnimals = await Animal.deleteMany({
      shelterId: shelter._id,
    });

    // Delete the shelter after related database data is cleaned.
    await shelter.deleteOne();

    // Remove Cloudinary files after database deletion succeeds.
    if (cloudinaryPublicIds.length > 0) {
      try {
        await deleteImages([...new Set(cloudinaryPublicIds)]);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete some shelter Cloudinary files:",
          cloudinaryError.message,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Shelter and related data permanently deleted successfully",
      deletedData: {
        animals: deletedAnimals.deletedCount,
        adoptionRequests: deletedAdoptionRequests.deletedCount,
        cloudinaryFilesRequested: [...new Set(cloudinaryPublicIds)].length,
      },
    });
  };

  //============================================================
  // Add Employee to Shelter
  //============================================================
  addEmployee = async (req, res) => {
    // • Adds a Shelter Employee or Veterinarian to a shelter.
    // • Allows Super Admin or an authorized active Manager.
    // • Requires the shelter to be approved, verified,
    //   and active.
    // • Requires the selected user to be active.
    // • Requires an active profile matching the user's role.
    // • Prevents assigning a user to more than one shelter.
    // • Prevents duplicate membership.
    // • Updates both the shelter and the related profile.
    //============================================================

    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const canManageEmployees = await checkShelterEmployeePermission({
      user: req.user,
      shelter,
    });

    if (!canManageEmployees) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage employees in this shelter",
      });
    }

    if (!this.isShelterAvailable(shelter)) {
      return res.status(403).json({
        success: false,
        message:
          "Employees can only be added to an approved and active shelter",
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({
        success: false,
        message: "Inactive user cannot be added to a shelter",
      });
    }

    if (!["shelterEmployee", "vet"].includes(employee.role)) {
      return res.status(400).json({
        success: false,
        message: "User role must be shelterEmployee or vet",
      });
    }

    const employeeExists = shelter.employees.some(
      (id) => String(id) === String(employee._id),
    );

    if (employeeExists) {
      return res.status(409).json({
        success: false,
        message: "Employee already belongs to this shelter",
      });
    }

    let employeeProfile = null;

    if (employee.role === "shelterEmployee") {
      employeeProfile = await ShelterEmployeeProfile.findOne({
        userId: employee._id,
        isActive: true,
      });
    }

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

    if (
      employeeProfile.shelterId &&
      String(employeeProfile.shelterId) !== String(shelter._id)
    ) {
      return res.status(409).json({
        success: false,
        message: "Employee already belongs to another shelter",
      });
    }

    shelter.employees.push(employee._id);

    employeeProfile.shelterId = shelter._id;

    // Both documents are saved together.
    await Promise.all([shelter.save(), employeeProfile.save()]);

    const updatedShelter = await Shelter.findById(shelter._id).populate(
      "employees",
      "firstName lastName email phone role profileImage isActive",
    );

    return res.status(200).json({
      success: true,
      message: "Employee added to shelter successfully",
      data: updatedShelter,
    });
  };

  //============================================================
  // Remove Employee from Shelter
  //============================================================
  removeEmployee = async (req, res) => {
    // • Removes a Shelter Employee or Veterinarian.
    // • Allows Super Admin or an authorized active Manager.
    // • Prevents a Manager from removing themselves.
    // • Ensures the user belongs to the requested shelter.
    // • Removes the user from the shelter employee list.
    // • Clears the shelter relationship from the user's profile.
    // • Resets Shelter Employee job information when removed.
    //============================================================

    const { employeeId } = req.params;

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const canManageEmployees = await checkShelterEmployeePermission({
      user: req.user,
      shelter,
    });

    if (!canManageEmployees) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage employees in this shelter",
      });
    }

    if (
      req.user.role === "shelterEmployee" &&
      String(req.user._id) === String(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself from the shelter",
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

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let employeeProfile = null;

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

    if (
      !employeeProfile.shelterId ||
      String(employeeProfile.shelterId) !== String(shelter._id)
    ) {
      return res.status(409).json({
        success: false,
        message: "Employee profile is not linked to this shelter",
      });
    }

    shelter.employees = shelter.employees.filter(
      (id) => String(id) !== String(employeeId),
    );

    employeeProfile.shelterId = null;

    // Reset Shelter Employee job data after removal.
    if (employee.role === "shelterEmployee") {
      employeeProfile.position = "Employee";

      employeeProfile.employeeNumber = null;

      employeeProfile.hireDate = null;
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

  //============================================================
  // Get Nearest Shelters
  //============================================================
  getNearestShelters = async (req, res) => {
    // • Finds nearby shelters using longitude and latitude.
    // • Requires valid numeric coordinates.
    // • Requires distance in meters.
    // • Prevents unlimited or excessively large searches.
    // • Returns approved, verified, and active shelters only.
    // • Calculates distance in meters and kilometers.
    //============================================================

    const { lng, lat, distance } = req.query;

    const MAX_SEARCH_DISTANCE = 100000;

    if (lng === undefined || lat === undefined || distance === undefined) {
      return res.status(400).json({
        success: false,
        message: "lng, lat and distance are required",
      });
    }

    const longitude = Number(lng);

    const latitude = Number(lat);

    const searchDistance = Number(distance);

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(searchDistance)
    ) {
      return res.status(400).json({
        success: false,
        message: "lng, lat and distance must be valid numbers",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (searchDistance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Distance must be greater than zero",
      });
    }

    if (searchDistance > MAX_SEARCH_DISTANCE) {
      return res.status(400).json({
        success: false,
        message: `Distance cannot exceed ${MAX_SEARCH_DISTANCE} meters`,
      });
    }

    const shelters = await Shelter.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          key: "location",
          distanceField: "distanceInMeters",
          maxDistance: searchDistance,
          spherical: true,
          query: {
            verificationStatus: "approved",
            isVerified: true,
            isActive: true,
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          logo: 1,
          images: 1,
          address: 1,
          city: 1,
          phone: 1,
          supportedSpecies: 1,
          operatingHours: 1,
          location: 1,

          distanceInMeters: {
            $round: ["$distanceInMeters", 0],
          },

          distanceInKm: {
            $round: [
              {
                $divide: ["$distanceInMeters", 1000],
              },
              2,
            ],
          },
        },
      },
      {
        $sort: {
          distanceInMeters: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message:
        shelters.length > 0
          ? "Nearest shelters retrieved successfully"
          : "No nearby shelters found within this distance",
      count: shelters.length,
      data: shelters,
    });
  };
  
}
//============================================================
// Build Uploaded Image Object
//============================================================
buildUploadedImage = (result) => ({
  url: result.secure_url,
  publicId: result.public_id,
});


//============================================================
// Upload Shelter Logo
//============================================================
// • Uploads the first logo for the shelter.
// • Allows Super Admin or authorized shelter employee.
// • Prevents uploading another logo if one already exists.
// • Requires one uploaded image file.
// • Uploads the file to Cloudinary before saving its
//   information in MongoDB.
// • Deletes uploaded Cloudinary image if saving fails.
//============================================================

uploadLogo = async (req, res) => {

  const shelter = await Shelter.findById(req.params.id);


  if (!shelter) {
    return res.status(404).json({
      success: false,
      message: "Shelter not found",
    });
  }


  const canManage = await checkShelterEmployeePermission({
    user: req.user,
    shelter,
  });


  if (!canManage) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to update this shelter",
    });
  }


  if (shelter.logo) {
    return res.status(400).json({
      success: false,
      message: "Logo already exists. Use replace endpoint",
    });
  }


  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Logo image is required",
    });
  }


  let uploadedImage = null;


  try {

    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder: "shelterLogo",
      originalName: req.file.originalname,
    });


    uploadedImage = this.buildUploadedImage(uploaded);


    shelter.logo = uploadedImage;


    await shelter.save();


    return res.status(200).json({
      success: true,
      message: "Shelter logo uploaded successfully",
      data: shelter,
    });


  } catch (error) {


    if (uploadedImage?.publicId) {

      try {

        await deleteImage(uploadedImage.publicId);

      } catch (cleanupError) {

        console.error(
          "Failed to clean uploaded shelter logo:",
          cleanupError.message
        );

      }

    }


    throw error;

  }

};



//============================================================
// Replace Shelter Logo
//============================================================
// • Replaces the current shelter logo.
// • Requires a new uploaded image.
// • Saves the new logo before deleting old one.
// • Deletes newly uploaded image if saving fails.
// • Failure to delete old Cloudinary image does not
//   rollback the successful MongoDB update.
//============================================================

replaceLogo = async (req, res) => {


  const shelter = await Shelter.findById(req.params.id);



  if (!shelter) {

    return res.status(404).json({
      success:false,
      message:"Shelter not found",
    });

  }



  const canManage = await checkShelterEmployeePermission({
    user:req.user,
    shelter,
  });



  if (!canManage) {

    return res.status(403).json({
      success:false,
      message:"You are not allowed to update this shelter",
    });

  }



  if (!shelter.logo) {

    return res.status(404).json({
      success:false,
      message:"Logo not found. Use upload endpoint",
    });

  }



  if (!req.file) {

    return res.status(400).json({
      success:false,
      message:"Logo image is required",
    });

  }



  const oldLogo = shelter.logo;

  let newLogo = null;



  try {


    const uploaded = await uploadBufferToCloudinary({

      buffer:req.file.buffer,
      folder:"shelterLogo",
      originalName:req.file.originalname,

    });



    newLogo = this.buildUploadedImage(uploaded);



    shelter.logo = newLogo;



    await shelter.save();



    // Delete old Cloudinary file only after
    // saving the new logo successfully.

    if(oldLogo?.publicId){

      try {

        await deleteImage(oldLogo.publicId);

      } catch (cloudinaryError) {

        console.error(
          "Failed to delete old shelter logo:",
          cloudinaryError.message
        );

      }

    }



    return res.status(200).json({

      success:true,
      message:"Shelter logo replaced successfully",
      data:shelter,

    });



  } catch(error){



    if(newLogo?.publicId){

      try {

        await deleteImage(newLogo.publicId);

      } catch(cleanupError){

        console.error(
          "Failed to clean new shelter logo:",
          cleanupError.message
        );

      }

    }



    throw error;

  }

};
//============================================================
// Delete Shelter Logo
//============================================================
// • Removes the shelter logo.
// • Allows Super Admin or authorized shelter employee.
// • Removes logo reference from MongoDB.
// • Deletes Cloudinary file after database update succeeds.
// • Cloudinary deletion failure does not restore database data.
//============================================================

deleteLogo = async (req, res) => {


  const shelter = await Shelter.findById(req.params.id);



  if (!shelter) {

    return res.status(404).json({
      success:false,
      message:"Shelter not found",
    });

  }



  const canManage = await checkShelterEmployeePermission({
    user:req.user,
    shelter,
  });



  if(!canManage){

    return res.status(403).json({
      success:false,
      message:"You are not allowed to update this shelter",
    });

  }



  if(!shelter.logo){

    return res.status(404).json({
      success:false,
      message:"Logo not found",
    });

  }



  const logoToDelete = shelter.logo;



  // Remove MongoDB reference first.
  shelter.logo = null;



  await shelter.save();



  // Delete Cloudinary file after MongoDB succeeds.

  if(logoToDelete.publicId){

    try {

      await deleteImage(logoToDelete.publicId);

    } catch(cloudinaryError){

      console.error(
        "Failed to delete shelter logo from Cloudinary:",
        cloudinaryError.message
      );

    }

  }



  return res.status(200).json({

    success:true,
    message:"Shelter logo deleted successfully",
    data:shelter,

  });


};




//============================================================
// Add Shelter Images
//============================================================
// • Adds one or more gallery images to the shelter.
// • Allows Super Admin or authorized shelter employee.
// • Requires at least one uploaded image.
// • Saves image URL and Cloudinary public ID.
// • Removes all newly uploaded Cloudinary files if
//   uploading or saving fails.
//============================================================

addShelterImages = async (req,res)=>{


 const shelter = await Shelter.findById(req.params.id);



 if(!shelter){

  return res.status(404).json({

    success:false,
    message:"Shelter not found",

  });

 }



 const canManage = await checkShelterEmployeePermission({

  user:req.user,
  shelter,

 });



 if(!canManage){

  return res.status(403).json({

   success:false,
   message:"You are not allowed to update this shelter",

  });

 }



 if(!req.files || req.files.length===0){

  return res.status(400).json({

   success:false,
   message:"At least one image is required",

  });

 }



 const uploadedImages=[];



 try{


  for(const file of req.files){



   const uploaded = await uploadBufferToCloudinary({

    buffer:file.buffer,
    folder:"shelterImage",
    originalName:file.originalname,

   });



   uploadedImages.push(

    this.buildUploadedImage(uploaded)

   );


  }




  if(!Array.isArray(shelter.images)){

    shelter.images=[];

  }




  shelter.images.push(...uploadedImages);



  await shelter.save();




  return res.status(200).json({

   success:true,
   message:"Shelter images added successfully",
   data:shelter,

  });





 }catch(error){



  if(uploadedImages.length > 0){

    try{

      await deleteImages(

        uploadedImages.map(
          image=>image.publicId
        )

      );


    }catch(cleanupError){


      console.error(

        "Failed to clean uploaded shelter images:",
        cleanupError.message

      );


    }

  }



  throw error;


 }


};
//============================================================
// Delete Shelter Image
//============================================================
// • Deletes one shelter gallery image.
// • Allows Super Admin or authorized shelter employee.
// • Receives image id from route params.
// • Removes MongoDB image reference.
// • Deletes Cloudinary file after database update succeeds.
//============================================================

deleteShelterImage = async(req,res)=>{


 const shelter = await Shelter.findById(req.params.id);



 if(!shelter){

  return res.status(404).json({

   success:false,
   message:"Shelter not found",

  });

 }



 const canManage = await checkShelterEmployeePermission({

  user:req.user,
  shelter,

 });



 if(!canManage){

  return res.status(403).json({

   success:false,
   message:"You are not allowed to update this shelter",

  });

 }



 const {imageId}=req.params;



 const imageIndex = shelter.images.findIndex(

  img => String(img._id) === String(imageId)

 );



 if(imageIndex === -1){

  return res.status(404).json({

   success:false,
   message:"Image not found",

  });

 }



 const image = shelter.images[imageIndex];



 // Remove MongoDB reference first.

 shelter.images.splice(imageIndex,1);



 await shelter.save();



 // Delete Cloudinary file after MongoDB succeeds.

 if(image.publicId){

  try{

    await deleteImage(image.publicId);


  }catch(cloudinaryError){


    console.error(

      "Failed to delete shelter image from Cloudinary:",
      cloudinaryError.message

    );


  }

 }



 return res.status(200).json({

  success:true,
  message:"Shelter image deleted successfully",
  data:shelter,

 });


};




//============================================================
// Delete All Shelter Images
//============================================================
// • Deletes all shelter gallery images.
// • Allows Super Admin or authorized shelter employee.
// • Removes MongoDB references.
// • Deletes Cloudinary files after database update succeeds.
//============================================================

deleteAllShelterImages = async(req,res)=>{


 const shelter = await Shelter.findById(req.params.id);



 if(!shelter){

  return res.status(404).json({

   success:false,
   message:"Shelter not found",

  });

 }



 const canManage = await checkShelterEmployeePermission({

  user:req.user,
  shelter,

 });



 if(!canManage){

  return res.status(403).json({

   success:false,
   message:"You are not allowed to update this shelter",

  });

 }



 if(!shelter.images || shelter.images.length===0){

  return res.status(404).json({

   success:false,
   message:"No shelter images found",

  });

 }



 const imagesToDelete = shelter.images;



 // Remove MongoDB references first.

 shelter.images=[];



 await shelter.save();




 // Delete Cloudinary files after MongoDB succeeds.

 try{


  await deleteImages(

    imagesToDelete.map(
      image=>image.publicId
    )

  );


 }catch(cloudinaryError){


  console.error(

    "Failed to delete shelter images from Cloudinary:",
    cloudinaryError.message

  );


 }



 return res.status(200).json({

  success:true,
  message:"All shelter images deleted successfully",
  data:shelter,

 });


};
module.exports = new ShelterController();