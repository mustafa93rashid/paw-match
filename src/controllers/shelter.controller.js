const Shelter = require("../models/Shelter");
const User = require("../models/User");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");
const VetProfile = require("../models/VetProfile");
const Animal = require("../models/Animal");
const AdoptionRequest = require("../models/AdoptionRequest");

//============================================================
// Check Shelter Employee Permission
//============================================================

const checkShelterEmployeePermission = async ({
  //
  // • Determines whether a user can manage a shelter
  //   and its employees.
  //
  // • Grants full access to superadmins for every shelter.
  //
  // • Rejects all roles except shelter employees.
  //
  // • Requires the user and shelter to have valid IDs.
  //
  // • Verifies that the user exists in the shelter's
  //   employee list.
  //
  // • Requires an active employee profile linked to the
  //   same shelter.
  //
  // • Grants permission only when the employee position
  //   is Manager.
  //
  // • Supports an optional database session when the
  //   permission check runs inside a transaction.
  //
  //============================================================
  user,
  shelter,
  session = null,
}) => {
  // Important: Superadmins can manage employees in any shelter.
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

  // Important: The employee must exist in the shelter's employee list.
  const existsInShelter = shelter.employees.some(
    (employeeId) => String(employeeId) === String(userId),
  );

  if (!existsInShelter) {
    return false;
  }

  // Important: Permission requires an active Manager profile linked to the same shelter.
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
  // Create Shelter
  //============================================================
  createShelter = async (req, res) => {
    //
    // • Creates a new shelter and records the authenticated user
    //   as the shelter creator.
    //
    // • Prevents duplicate shelters by ensuring the email address
    //   is unique before creation.
    //
    // • If the creator is a shelter employee, verifies that they
    //   have an active employee profile and are not already linked
    //   to another shelter.
    //
    // • Automatically adds the shelter employee as the first
    //   employee of the newly created shelter.
    //
    // • Converts the provided latitude and longitude into a
    //   GeoJSON Point using the required [longitude, latitude] format.
    //
    // • Links the employee profile to the newly created shelter.
    //
    // • Rolls back the shelter creation if linking the employee
    //   profile fails to keep the database consistent.
    //
    // • Leaves the shelter in the pending state until it is
    //   approved by a superadmin.
    //
    //============================================================
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

    // Important: Prevent duplicate shelter emails.
    const existingShelter = await Shelter.findOne({ email });

    if (existingShelter) {
      return res.status(409).json({
        success: false,
        message: "Shelter email already exists",
      });
    }

    let employeeProfile;

    // Important: Shelter employees can only create one shelter.
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
          message: "Employee already belongs to another shelter",
        });
      }
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
    };

    // Important: Add the creator as the first shelter employee.
    if (req.user.role === "shelterEmployee") {
      shelterData.employees = [req.user._id];
    }

    // Important: GeoJSON coordinates must be [longitude, latitude].
    if (longitude !== undefined && latitude !== undefined) {
      shelterData.longitude = Number(longitude);
      shelterData.latitude = Number(latitude);

      shelterData.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const shelter = await Shelter.create(shelterData);

    // Important: Link the employee profile to the newly created shelter.
    if (employeeProfile) {
      employeeProfile.shelterId = shelter._id;

      try {
        await employeeProfile.save();
      } catch (error) {
        // Important: Roll back the shelter creation if profile linking fails.
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
    //
    // • Retrieves only shelters that are approved, verified,
    //   and currently active.
    //
    // • Supports optional filtering by city and supported species.
    //
    // • Allows keyword searching across the shelter name,
    //   description, and address.
    //
    // • Returns only public-facing shelter information while
    //   excluding internal and administrative data.
    //
    // • Sorts the results by the most recently created shelters.
    //
    //============================================================
    const { city, species, search } = req.query;

    // Important: Only approved, verified, and active shelters are publicly visible.
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

    // Important: Perform a case-insensitive search across public shelter information.
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
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Shelters retrieved successfully",
      count: shelters.length,
      data: shelters,
    });
  };

  //============================================================
  // Get All Shelters (Superadmin)
  //============================================================
  getAllShelters = async (req, res) => {
    //
    // • Retrieves all shelters regardless of their approval
    //   or activation status.
    //
    // • Supports optional filtering by verification status,
    //   activation status, and city.
    //
    // • Includes information about the user who created
    //   the shelter and the superadmin who verified it.
    //
    // • Returns the results ordered from the newest shelters
    //   to the oldest.
    //
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
      .sort({ createdAt: -1 });

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
    //
    // • Retrieves a shelter using its unique ID.
    //
    // • Returns different levels of information depending on
    //   the authenticated user's role and relationship to the shelter.
    //
    // • Gives superadmins full access to shelter details,
    //   including verification data, employees, and animals.
    //
    // • Gives shelter employees administrative access only when
    //   they have an active profile linked to the requested shelter.
    //
    // • Treats employees from other shelters as public users.
    //
    // • Returns public information only when the shelter is
    //   approved, verified, and active.
    //
    // • Includes only active animals that are currently available
    //   or pending adoption in the public response.
    //
    //============================================================
    const shelterId = req.params.id;
    const currentUser = req.user;

    // Important: Superadmins can access all shelter details.
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

    // Important: Shelter employees receive administrative details only
    // when their active profile is linked to the requested shelter.
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

    // Important: Public access is limited to approved, verified,
    // and active shelters with publicly available animals only.
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
    //
    // • Updates an existing shelter using its unique ID.
    //
    // • Allows access only to a superadmin or an authorized
    //   shelter manager who can manage the requested shelter.
    //
    // • Restricts updates to an approved list of editable fields
    //   to prevent changes to protected administrative data.
    //
    // • Updates the GeoJSON location only when both longitude
    //   and latitude are provided.
    //
    // • Keeps the current approval status when the update is
    //   performed by a superadmin.
    //
    // • Resets the shelter to pending verification when an
    //   authorized shelter employee updates its information.
    //
    // • Clears previous verification and rejection data before
    //   sending the shelter for superadmin approval again.
    //
    //============================================================
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    const isSuperAdmin = req.user.role === "superadmin";

    // Important: Only a superadmin or an authorized shelter manager can update the shelter.
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

    // Important: Prevent direct updates to protected administrative fields.
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

    // Important: GeoJSON coordinates must follow [longitude, latitude].
    if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
      shelter.longitude = Number(req.body.longitude);
      shelter.latitude = Number(req.body.latitude);

      shelter.location = {
        type: "Point",
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    // Important: Employee updates require the shelter to be reviewed again.
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

  //============================================================
  // Approve Shelter
  //============================================================
  approveShelter = async (req, res) => {
    //
    // • Approves a shelter after it has been reviewed by
    //   a superadmin.
    //
    // • Prevents approving a shelter that is already verified
    //   and marked as approved.
    //
    // • Updates the verification status and marks the shelter
    //   as officially verified.
    //
    // • Activates the shelter immediately after approval.
    //
    // • Clears any previous rejection reason.
    //
    // • Records the superadmin who approved the shelter
    //   and the exact approval date.
    //
    //============================================================
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    // Important: Prevent approving an already approved shelter.
    if (shelter.verificationStatus === "approved" && shelter.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Shelter is already approved",
      });
    }

    // Important: Approval also activates the shelter and records verification details.
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
    //
    // • Rejects a shelter after review by a superadmin.
    //
    // • Requires a rejection reason before the request
    //   can be completed.
    //
    // • Marks the shelter as rejected and removes its
    //   verified status.
    //
    // • Deactivates the shelter to prevent public access.
    //
    // • Stores the rejection reason together with the
    //   superadmin who performed the review and the
    //   review date.
    //
    //============================================================
    const { reason } = req.body;

    // Important: A rejection reason is required for review history.
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

    // Important: Rejected shelters are automatically deactivated.
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
    //
    // • Activates or deactivates a shelter.
    //
    // • Allows activation only when the shelter has already
    //   been approved and verified.
    //
    // • Prevents rejected or pending shelters from becoming
    //   publicly active.
    //
    // • Preserves all shelter information while changing only
    //   its activation status.
    //
    //============================================================

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    // Important: Determine whether the current action is an activation request.
    const isTryingToActivate = !shelter.isActive;

    // Important: Only approved and verified shelters can be activated.
    if (
      isTryingToActivate &&
      (!shelter.isVerified || shelter.verificationStatus !== "approved")
    ) {
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

  //============================================================
  // Permanently Delete Shelter
  //============================================================
  permanentlyDeleteShelter = async (req, res) => {
    //
    // • Permanently removes a shelter from the system.
    //
    // • Allows deletion only after the shelter has been
    //   deactivated.
    //
    // • Prevents deletion while there are active adoption
    //   requests associated with the shelter.
    //
    // • Removes all relationships between the shelter and
    //   its employees and veterinarians.
    //
    // • Deletes cancelled adoption requests before removing
    //   the shelter's animals.
    //
    // • Deletes all animals that belong to the shelter.
    //
    // • Removes the shelter only after all related data has
    //   been cleaned to preserve database consistency.
    //
    //============================================================
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    // Important: A shelter must be deactivated before it can be permanently deleted.
    if (shelter.isActive) {
      return res.status(400).json({
        success: false,
        message: "Deactivate the shelter before permanently deleting it",
      });
    }

    // Important: Prevent deletion while active adoption requests still exist.
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
          "All adoption requests must be cancelled before permanently deleting the shelter",
        activeAdoptionRequestsCount,
      });
    }

    // Important: Remove employee references to the shelter.
    await ShelterEmployeeProfile.updateMany(
      {
        shelterId: shelter._id,
      },
      {
        $set: {
          shelterId: null,
        },
      },
    );

    // Important: Remove veterinarian references to the shelter.
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

    // Important: Cancelled adoption requests must be deleted before removing the shelter's animals.
    const deletedAdoptionRequests = await AdoptionRequest.deleteMany({
      shelterId: shelter._id,
      status: "cancelled",
    });

    // Important: Delete all animals that belong to the shelter.
    const deletedAnimals = await Animal.deleteMany({
      shelterId: shelter._id,
    });

    // Important: Delete the shelter after cleaning all related data.
    await shelter.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Shelter and related data permanently deleted successfully",
      deletedData: {
        animals: deletedAnimals.deletedCount,
        adoptionRequests: deletedAdoptionRequests.deletedCount,
      },
    });
  };

  //============================================================
  // Add Employee to Shelter
  //============================================================
  addEmployee = async (req, res) => {
    //
    // • Adds a shelter employee or veterinarian to an
    //   existing shelter.
    //
    // • Allows this action only for a superadmin or an
    //   authorized shelter manager.
    //
    // • Requires the shelter to be approved, verified,
    //   and active before accepting new employees.
    //
    // • Ensures that the selected user exists, is active,
    //   and has an allowed role.
    //
    // • Requires the user to have an active profile that
    //   matches their assigned role.
    //
    // • Prevents assigning a user who already belongs to
    //   another shelter.
    //
    // • Prevents adding the same employee to the shelter
    //   more than once.
    //
    // • Updates both the shelter employee list and the
    //   related employee profile.
    //
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

    // Important: Only authorized shelter managers or superadmins can manage employees.
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

    // Important: Employees can only join approved, verified, and active shelters.
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

    // Important: Only shelter employees and veterinarians can be assigned.
    if (!["shelterEmployee", "vet"].includes(employee.role)) {
      return res.status(400).json({
        success: false,
        message: "User role must be shelterEmployee or vet",
      });
    }

    let employeeProfile;

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

    // Important: A user cannot belong to more than one shelter.
    if (
      employeeProfile.shelterId &&
      String(employeeProfile.shelterId) !== String(shelter._id)
    ) {
      return res.status(409).json({
        success: false,
        message: "Employee already belongs to another shelter",
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

    shelter.employees.push(employee._id);
    employeeProfile.shelterId = shelter._id;

    // Important: Update both records together to keep the relationship consistent.
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
    //
    // • Removes a shelter employee or veterinarian from an
    //   existing shelter.
    //
    // • Allows this action only for a superadmin or an
    //   authorized shelter manager.
    //
    // • Prevents a shelter manager from removing themselves.
    //
    // • Ensures that the selected user exists and has a
    //   related employee or veterinarian profile.
    //
    // • Verifies that the user is currently assigned to the
    //   requested shelter before removing them.
    //
    // • Removes the user from the shelter employee list.
    //
    // • Clears the shelter reference from the related profile
    //   when it points to the same shelter.
    //
    // • Updates both the shelter and the employee profile to
    //   keep the relationship consistent.
    //
    //============================================================
    const { employeeId } = req.params;

    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Shelter not found",
      });
    }

    // Important: Only authorized shelter managers or superadmins can manage employees.
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

    // Important: A shelter manager cannot remove themselves.
    if (
      req.user.role === "shelterEmployee" &&
      String(req.user._id) === String(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove yourself from the shelter",
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

    // Important: Clear the profile relationship only when it belongs to this shelter.
    if (
      employeeProfile.shelterId &&
      String(employeeProfile.shelterId) === String(shelter._id)
    ) {
      employeeProfile.shelterId = null;
    }

    // Important: Update both records together to keep the relationship consistent.
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
    //
    // • Finds the nearest shelters based on the user's
    //   longitude, latitude, and maximum search distance.
    //
    // • Requires all location parameters and ensures they
    //   contain valid numeric values.
    //
    // • Validates longitude and latitude against their
    //   accepted geographic ranges.
    //
    // • Rejects zero or negative search distances.
    //
    // • Returns only shelters that are approved, verified,
    //   and currently active.
    //
    // • Calculates the distance from the provided location
    //   in both meters and kilometers.
    //
    // • Sorts the shelters from the nearest to the farthest.
    //
    //============================================================
    const { lng, lat, distance } = req.query;

    if (!lng || !lat || !distance) {
      return res.status(400).json({
        success: false,
        message: "lng, lat and distance are required",
      });
    }

    const longitude = Number(lng);
    const latitude = Number(lat);
    const searchDistance = Number(distance);

    // Important: Location parameters must contain valid numeric values.
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

    // Important: Coordinates must remain within valid geographic ranges.
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

    // Important: GeoJSON coordinates must follow [longitude, latitude].
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
          address: 1,
          city: 1,
          phone: 1,
          supportedSpecies: 1,

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
module.exports = new ShelterController();