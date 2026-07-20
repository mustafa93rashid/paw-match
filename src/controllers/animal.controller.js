const mongoose = require("mongoose");

const Animal = require("../models/Animal");
const Shelter = require("../models/Shelter");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

const {
  checkAnimalMatchNotifications,
} = require("../services/matchNotification.service");

const {
  uploadBufferToCloudinary,
  deleteImages,
  deleteImage,
} = require("../services/cloudinary.service");

class AnimalsController {
  // ==================================================
  // Get current shelter employee profile
  // ==================================================
  // • Finds the active Shelter Employee profile.
  // • Used to determine the shelter assigned to the employee.
  // • Returns null if the employee has no active profile.
  // ==================================================
  getEmployeeProfile = async (userId) => {
    const employeeProfile = await ShelterEmployeeProfile.findOne({
      userId,
      isActive: true,
    });

    return employeeProfile;
  };

  // ==================================================
  // Check if the current user can manage an animal
  // ==================================================
  // • Super Admin can manage animals from any shelter.
  // • Shelter Employees can manage animals belonging
  //   to their assigned shelter only.
  // • The employee profile must be active.
  // • The employee must be assigned to a shelter.
  // • Other roles are not allowed to manage animals.
  // ==================================================
  canManageAnimal = async (user, animal) => {
    if (user.role === "superadmin") {
      return true;
    }

    if (user.role !== "shelterEmployee") {
      return false;
    }

    const employeeProfile = await this.getEmployeeProfile(user._id);

    if (!employeeProfile || !employeeProfile.shelterId) {
      return false;
    }

    return String(animal.shelterId) === String(employeeProfile.shelterId);
  };

  // ==================================================
  // Check if a shelter is approved and active
  // ==================================================
  // • Checks that the shelter exists.
  // • Checks that the shelter is verified.
  // • Checks that the verification status is approved.
  // • Checks that the shelter is currently active.
  // • Used when creating, transferring, or restoring animals.
  // ==================================================
  isShelterAvailable = (shelter) => {
    return (
      shelter &&
      shelter.verificationStatus === "approved" &&
      shelter.isVerified === true &&
      shelter.isActive === true
    );
  };

  // ==================================================
  // Create a new animal
  // ==================================================
  // • Allows Shelter Employees and Super Admin only.
  // • Shelter Employees can add animals to their shelter only.
  // • Super Admin must provide a valid Shelter ID.
  // • The shelter must be verified, approved, and active.
  // • Requires at least one uploaded animal image.
  // • Uploads images to Cloudinary.
  // • Stores the image URL and Cloudinary public ID.
  // • Removes uploaded images if animal creation fails.
  // • Prevents the client from controlling isActive,
  //   adoptionStatus, shelterId, addedBy, and images.
  // • Animals are created as active and available.
  // ==================================================
createAnimal = async (req, res) => {
  const currentUserId = req.user._id;

  let shelterId;

  // Shelter Employee uses the shelter assigned
  // to the active employee profile.
  if (req.user.role === "shelterEmployee") {
    const employeeProfile = await this.getEmployeeProfile(currentUserId);

    if (!employeeProfile) {
      return res.status(403).json({
        success: false,
        message: "Shelter employee profile not found or inactive",
      });
    }

    if (!employeeProfile.shelterId) {
      return res.status(403).json({
        success: false,
        message: "Shelter employee is not assigned to a shelter",
      });
    }

    shelterId = employeeProfile.shelterId;
  }

  // Super Admin must select the shelter manually.
  if (req.user.role === "superadmin") {
    shelterId = req.body.shelterId;

    if (!shelterId) {
      return res.status(400).json({
        success: false,
        message: "Shelter ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shelterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shelter ID",
      });
    }
  }

  const shelter = await Shelter.findById(shelterId);

  if (!shelter) {
    return res.status(404).json({
      success: false,
      message: "Shelter not found",
    });
  }

  if (!this.isShelterAvailable(shelter)) {
    return res.status(403).json({
      success: false,
      message: "Animals can only be added to approved and active shelters",
    });
  }

  // Only explicitly allowed fields are accepted.
  const {
    name,
    age,
    ageUnit,
    species,
    breed,
    gender,
    size,
    color,
    healthStatus,
    vaccinated,
    description,
    requirements,
  } = req.body;

  const animal = await Animal.create({
    name,
    age,
    ageUnit,
    species,
    breed,
    gender,
    size,
    color,
    healthStatus,
    vaccinated,
    description,
    requirements,
    images: [],
    shelterId,
    addedBy: currentUserId,
    adoptionStatus: "unavailable",
    isActive: true,
  });

  const populatedAnimal = await Animal.findById(animal._id)
    .populate("shelterId", "name city")
    .populate("addedBy", "firstName lastName role");

  return res.status(201).json({
    success: true,
    message: "Animal created successfully. Add at least one image to make it available for adoption",
    data: populatedAnimal,
  });
};

  // ==================================================
  // Get all animals
  // ==================================================
  // • Returns animals based on the provided filters.
  // • Supports searching by name, breed, and description.
  // • Validates Boolean query values before using them.
  // • Returns active animals by default.
  // • Only Super Admin can request inactive animals.
  // • Supports filtering by shelter and adoption status.
  // ==================================================
  getAll = async (req, res) => {
    const {
      species,
      breed,
      gender,
      size,
      healthStatus,
      adoptionStatus,
      shelterId,
      vaccinated,
      isActive,
      search,
    } = req.query;

    const filter = {};

    if (species) {
      filter.species = species;
    }

    if (breed) {
      filter.breed = {
        $regex: breed,
        $options: "i",
      };
    }

    if (gender) {
      filter.gender = gender;
    }

    if (size) {
      filter.size = size;
    }

    if (healthStatus) {
      filter.healthStatus = healthStatus;
    }

    if (adoptionStatus) {
      filter.adoptionStatus = adoptionStatus;
    }

    if (shelterId) {
      if (!mongoose.Types.ObjectId.isValid(shelterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shelter ID",
        });
      }

      filter.shelterId = shelterId;
    }

    if (vaccinated !== undefined) {
      if (!["true", "false"].includes(vaccinated)) {
        return res.status(400).json({
          success: false,
          message: "Vaccinated must be true or false",
        });
      }

      filter.vaccinated = vaccinated === "true";
    }

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }
    }

    // Super Admin can request active or inactive animals.
    // Other roles always receive active animals only.
    if (req.user.role === "superadmin" && isActive !== undefined) {
      filter.isActive = isActive === "true";
    } else {
      filter.isActive = true;
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
          breed: {
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
      ];
    }

    const animals = await Animal.find(filter)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Animals retrieved successfully",
      data: animals,
    });
  };

  // ==================================================
  // Get animal by ID
  // ==================================================
  // • Validates the Animal ID.
  // • Returns active animals only.
  // • Returns basic shelter information.
  // • Does not expose the employee email.
  // ==================================================
  getOne = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    const animal = await Animal.findOne({
      _id: id,
      isActive: true,
    })
      .populate("shelterId", "name city address phone")
      .populate("addedBy", "firstName lastName role");

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Animal retrieved successfully",
      data: animal,
    });
  };
  // ==================================================
  // Update animal
  // ==================================================
  // • Allows Super Admin to update any animal.
  // • Shelter Employees can update animals belonging
  //   to their assigned shelter only.
  // • Updates only explicitly allowed animal fields.
  // • Prevents changing images through this endpoint.
  // • Prevents changing isActive through this endpoint.
  // • Prevents changing adoptionStatus through this endpoint.
  // • Adoption status must be controlled through
  //   the Adoption Request workflow.
  // • Super Admin can transfer an animal to another
  //   approved and active shelter.
  // • Rechecks matching notifications when matching-related
  //   animal data has changed.
  // ==================================================
  updateAnimal = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(req.user, animal);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this animal",
      });
    }

    // Prevent changing the active status manually.
    if (req.body.isActive !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Animal active status must be changed through delete or restore endpoints",
      });
    }

    // Prevent changing adoption status manually.
    if (req.body.adoptionStatus !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Animal adoption status must be changed through the adoption request process",
      });
    }

    // Images must only be managed through
    // the image add and delete endpoints.
    if (req.body.images !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Animal images must be managed through image endpoints",
      });
    }

    // Determine whether any matching-related
    // animal information has changed.
    const matchingDataChanged =
      req.body.species !== undefined ||
      req.body.requirements !== undefined ||
      req.body.shelterId !== undefined;

    const allowedFields = [
      "name",
      "age",
      "ageUnit",
      "species",
      "breed",
      "gender",
      "size",
      "color",
      "healthStatus",
      "vaccinated",
      "description",
    ];

    // Update only explicitly allowed fields.
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        animal[field] = req.body[field];
      }
    });

    // Only Super Admin can transfer an animal
    // to another approved and active shelter.
    if (req.user.role === "superadmin" && req.body.shelterId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(req.body.shelterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shelter ID",
        });
      }

      const newShelter = await Shelter.findById(req.body.shelterId);

      if (!newShelter) {
        return res.status(404).json({
          success: false,
          message: "Shelter not found",
        });
      }

      if (!this.isShelterAvailable(newShelter)) {
        return res.status(403).json({
          success: false,
          message:
            "Animal can only be transferred to an approved and active shelter",
        });
      }

      animal.shelterId = newShelter._id;
    }

    // Shelter Employees are not allowed
    // to transfer animals between shelters.
    if (req.user.role !== "superadmin" && req.body.shelterId !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can change the animal shelter",
      });
    }

    // Update animal matching requirements safely.
    if (req.body.requirements !== undefined) {
      const requirements = req.body.requirements;

      if (
        typeof requirements !== "object" ||
        requirements === null ||
        Array.isArray(requirements)
      ) {
        return res.status(400).json({
          success: false,
          message: "Animal requirements must be a valid object",
        });
      }

      const requirementFields = [
        "homeType",
        "suitableForKids",
        "goodWithOtherPets",
        "experienceLevel",
        "dailyActivityLevel",
        "ownerType",
        "hypoallergenic",
      ];

      // Ensure the nested requirements object exists.
      if (!animal.requirements) {
        animal.requirements = {};
      }

      requirementFields.forEach((field) => {
        if (requirements[field] !== undefined) {
          animal.requirements[field] = requirements[field];
        }
      });

      // Notify Mongoose that the nested object
      // has been modified.
      animal.markModified("requirements");
    }

    await animal.save();

    // Matching notifications are a secondary process.
    // Their failure must not cancel the animal update.
    if (
      matchingDataChanged &&
      animal.isActive === true &&
      animal.adoptionStatus === "available"
    ) {
      try {
        await checkAnimalMatchNotifications(animal._id);
      } catch (notificationError) {
        console.error(
          "Animal match notification failed:",
          notificationError.message,
        );
      }
    }

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Animal updated successfully",
      data: populatedAnimal,
    });
  };

  // ==================================================
  // Soft delete animal
  // ==================================================
  // • Validates the Animal ID before querying.
  // • Allows Super Admin to delete any animal.
  // • Shelter Employees can delete animals belonging
  //   to their assigned shelter only.
  // • Prevents deleting an already inactive animal.
  // • Prevents deleting an adopted animal.
  // • Changes isActive to false only.
  // • Keeps the current adoptionStatus so it can be
  //   preserved if the animal is restored later.
  // • Does not delete the animal images from Cloudinary.
  // ==================================================
  removeAnimal = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(req.user, animal);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this animal",
      });
    }

    if (!animal.isActive) {
      return res.status(400).json({
        success: false,
        message: "Animal is already inactive",
      });
    }

    if (animal.adoptionStatus === "adopted") {
      return res.status(400).json({
        success: false,
        message: "Adopted animals cannot be deleted",
      });
    }

    animal.isActive = false;

    await animal.save();

    return res.status(200).json({
      success: true,
      message: "Animal deleted successfully",
      data: animal,
    });
  };

  // ==================================================
  // Restore deleted animal
  // ==================================================
  // • Validates the Animal ID before querying.
  // • Allows Super Admin to restore any animal.
  // • Shelter Employees can restore animals belonging
  //   to their assigned shelter only.
  // • Prevents restoring an already active animal.
  // • The related shelter must still be verified,
  //   approved, and active.
  // • Changes isActive to true only.
  // • Preserves the animal's previous adoptionStatus.
  // • Rechecks matching notifications when the restored
  //   animal is still available for adoption.
  // ==================================================
  restoreAnimal = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(req.user, animal);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to restore this animal",
      });
    }

    if (animal.isActive) {
      return res.status(400).json({
        success: false,
        message: "Animal is already active",
      });
    }

    const shelter = await Shelter.findById(animal.shelterId);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: "Animal shelter not found",
      });
    }

    if (!this.isShelterAvailable(shelter)) {
      return res.status(403).json({
        success: false,
        message:
          "Animal cannot be restored because the shelter is not approved and active",
      });
    }

    animal.isActive = true;

    await animal.save();

    // Matching notifications are a secondary process.
    // Their failure must not cancel the restore process.
    if (animal.adoptionStatus === "available") {
      try {
        await checkAnimalMatchNotifications(animal._id);
      } catch (notificationError) {
        console.error(
          "Animal match notification failed:",
          notificationError.message,
        );
      }
    }

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Animal restored successfully",
      data: populatedAnimal,
    });
  };

  // ==================================================
  // Build uploaded image object
  // ==================================================
  // • Converts the Cloudinary upload result into
  //   the image structure stored inside the Animal model.
  // • Stores both the secure URL and public ID.
  // ==================================================
  buildUploadedImage = (result) => ({
    url: result.secure_url,
    publicId: result.public_id,
  });

  // ==================================================
  // Add animal images
  // ==================================================
  // • Allows Shelter Employees and Super Admin only.
  // • Shelter Employees can add images only to animals
  //   belonging to their assigned shelter.
  // • Super Admin can add images to any animal.
  // • Prevents adding images to inactive animals.
  // • Requires at least one uploaded image.
  // • Prevents exceeding the maximum image count.
  // • Uploads images to Cloudinary.
  // • Stores the image URL and Cloudinary public ID.
  // • Removes newly uploaded images if saving fails.
  // ==================================================
addAnimalImages = async (req, res) => {
  const { id } = req.params;

  const MAX_ANIMAL_IMAGES = 8;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid animal ID",
    });
  }

  const animal = await Animal.findById(id);

  if (!animal) {
    return res.status(404).json({
      success: false,
      message: "Animal not found",
    });
  }

  const allowed = await this.canManageAnimal(req.user, animal);

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to update this animal",
    });
  }

  if (!animal.isActive) {
    return res.status(400).json({
      success: false,
      message: "Images cannot be added to an inactive animal",
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one image is required",
    });
  }

  const currentImagesCount = animal.images?.length || 0;
  const requestedImagesCount = req.files.length;

  if (currentImagesCount + requestedImagesCount > MAX_ANIMAL_IMAGES) {
    return res.status(400).json({
      success: false,
      message: `Animal cannot have more than ${MAX_ANIMAL_IMAGES} images`,
    });
  }

  const isFirstImageUpload = currentImagesCount === 0;
  const uploadedImages = [];

  try {
    for (const file of req.files) {
      const uploaded = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: "animal",
        originalName: file.originalname,
      });

      uploadedImages.push(this.buildUploadedImage(uploaded));
    }

    animal.images.push(...uploadedImages);

    // The first image makes the animal available
    // for adoption and matching.
    if (
      isFirstImageUpload &&
      animal.adoptionStatus === "unavailable"
    ) {
      animal.adoptionStatus = "available";
    }

    await animal.save();

    // Smart matching starts only after the animal
    // has at least one image and becomes available.
    if (
      isFirstImageUpload &&
      animal.adoptionStatus === "available"
    ) {
      try {
        await checkAnimalMatchNotifications(animal._id);
      } catch (notificationError) {
        console.error(
          "Animal match notification failed:",
          notificationError.message,
        );
      }
    }

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Animal images added successfully",
      data: populatedAnimal,
    });
  } catch (error) {
    if (uploadedImages.length > 0) {
      try {
        await deleteImages(
          uploadedImages.map((image) => image.publicId),
        );
      } catch (cleanupError) {
        console.error(
          "Failed to clean uploaded animal images:",
          cleanupError.message,
        );
      }
    }

    throw error;
  }
};

  // ==================================================
  // Delete animal image
  // ==================================================
  // • Allows Shelter Employees and Super Admin only.
  // • Shelter Employees can delete images only from
  //   animals belonging to their assigned shelter.
  // • Super Admin can delete images from any animal.
  // • Receives the Cloudinary public ID from req.body.
  // • Prevents deleting the last remaining image.
  // • Removes the image from MongoDB first.
  // • Then attempts to remove it from Cloudinary.
  // • A Cloudinary failure does not restore a removed
  //   MongoDB image reference.
  // ==================================================
  deleteAnimalImage = async (req, res) => {
    const { id } = req.params;
    const { publicId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    if (!publicId || typeof publicId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Image public ID is required",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(req.user, animal);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this animal",
      });
    }

    if (!animal.images || animal.images.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Animal has no images",
      });
    }

    if (animal.images.length <= 1) {
      return res.status(400).json({
        success: false,
        message: "Animal must have at least one image",
      });
    }

    const imageIndex = animal.images.findIndex(
      (image) => String(image.publicId) === String(publicId),
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const imageToDelete = animal.images[imageIndex];

    // Remove the image reference from MongoDB first.
    animal.images.splice(imageIndex, 1);

    await animal.save();

    // Cloudinary deletion is handled separately.
    // Its failure must not make the database response fail.
    try {
      await deleteImage(imageToDelete.publicId);
    } catch (cloudinaryError) {
      console.error(
        "Failed to delete animal image from Cloudinary:",
        cloudinaryError.message,
      );
    }

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Animal image deleted successfully",
      data: populatedAnimal,
    });
  };
}

module.exports = new AnimalsController();
