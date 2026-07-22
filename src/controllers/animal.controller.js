const mongoose = require("mongoose");

const Animal = require("../models/Animal");
const Shelter = require("../models/Shelter");
const ShelterEmployeeProfile = require(
  "../models/ShelterEmployeeProfile"
);

const {
  checkAnimalMatchNotifications,
} = require("../services/matchNotification.service");

const {
  uploadBufferToCloudinary,
  deleteImage,
  deleteImages,
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
    const employeeProfile =
      await ShelterEmployeeProfile.findOne({
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

    const currentUserId = user._id || user.id;

    if (!currentUserId || !animal?.shelterId) {
      return false;
    }

    const employeeProfile =
      await this.getEmployeeProfile(currentUserId);

    if (!employeeProfile || !employeeProfile.shelterId) {
      return false;
    }

    return (
      String(animal.shelterId) ===
      String(employeeProfile.shelterId)
    );
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
  // Build uploaded image object
  // ==================================================
  // • Converts the Cloudinary upload result into
  //   the image structure stored inside the Animal model.
  // • Stores the image URL, public ID, and primary state.
  // ==================================================
  buildUploadedImage = (result, isPrimary = false) => ({
    url: result.secure_url,
    publicId: result.public_id,
    isPrimary,
  });

  // ==================================================
  // Run animal matching notifications safely
  // ==================================================
  // • Matching notifications are a secondary process.
  // • A notification failure must not cancel the main action.
  // • Runs only when the animal is active and available.
  // ==================================================
  runMatchingNotifications = async (animal) => {
    if (
      !animal ||
      animal.isActive !== true ||
      animal.adoptionStatus !== "available"
    ) {
      return;
    }

    try {
      await checkAnimalMatchNotifications(animal._id);
    } catch (notificationError) {
      console.error(
        "Animal match notification failed:",
        notificationError.message
      );
    }
  };

  // ==================================================
  // Create a new animal
  // ==================================================
  // • Allows Shelter Employees and Super Admin only.
  // • Shelter Employees add animals to their assigned shelter.
  // • Super Admin must provide a valid Shelter ID.
  // • The shelter must be verified, approved, and active.
  // • Creates the animal without images.
  // • The animal remains unavailable until its first image
  //   is uploaded through the image endpoint.
  // • Prevents the client from controlling images,
  //   adoptionStatus, isActive, shelterId, and addedBy.
  // ==================================================
  createAnimal = async (req, res) => {
    const currentUserId = req.user._id || req.user.id;

    let shelterId;

    // Shelter Employee uses the shelter assigned
    // to the active employee profile.
    if (req.user.role === "shelterEmployee") {
      const employeeProfile =
        await this.getEmployeeProfile(currentUserId);

      if (!employeeProfile) {
        return res.status(403).json({
          success: false,
          message:
            "Shelter employee profile not found or inactive",
        });
      }

      if (!employeeProfile.shelterId) {
        return res.status(403).json({
          success: false,
          message:
            "Shelter employee is not assigned to a shelter",
        });
      }

      shelterId = employeeProfile.shelterId;
    }

    // Super Admin must provide the shelter ID.
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
        message:
          "Animals can only be added to approved and active shelters",
      });
    }

    // Only explicitly allowed animal fields are accepted.
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

      // Images are uploaded later through
      // the dedicated image endpoint.
      images: [],

      shelterId,
      addedBy: currentUserId,

      // The animal cannot be offered for adoption
      // before at least one image is uploaded.
      adoptionStatus: "unavailable",

      isActive: true,
    });

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city")
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(201).json({
      success: true,
      message:
        "Animal created successfully. Add at least one image to make it available for adoption",
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
      if (
        !mongoose.Types.ObjectId.isValid(shelterId)
      ) {
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
          message:
            "Vaccinated must be true or false",
        });
      }

      filter.vaccinated = vaccinated === "true";
    }

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false",
        });
      }
    }

    // Super Admin can retrieve active or inactive animals.
    // All other roles receive active animals only.
    if (
      req.user.role === "superadmin" &&
      isActive !== undefined
    ) {
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
      .populate(
        "shelterId",
        "name city address"
      )
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(200).json({
      success: true,
      message:
        "Animals retrieved successfully",
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
  // • Prevents changing images, isActive, or
  //   adoptionStatus through this endpoint.
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

    if (req.body.isActive !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Animal active status must be changed through delete or restore endpoints",
      });
    }

    if (req.body.adoptionStatus !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Animal adoption status must be changed through the adoption request process",
      });
    }

    if (req.body.images !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Animal images must be managed through image endpoints",
      });
    }

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

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        animal[field] = req.body[field];
      }
    });

    if (req.body.shelterId !== undefined) {
      if (req.user.role !== "superadmin") {
        return res.status(403).json({
          success: false,
          message:
            "Only Super Admin can change the animal shelter",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.shelterId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid shelter ID",
        });
      }

      const newShelter = await Shelter.findById(
        req.body.shelterId
      );

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

    if (req.body.requirements !== undefined) {
      const requirements = req.body.requirements;

      if (
        typeof requirements !== "object" ||
        requirements === null ||
        Array.isArray(requirements)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Animal requirements must be a valid object",
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

      if (!animal.requirements) {
        animal.requirements = {};
      }

      requirementFields.forEach((field) => {
        if (requirements[field] !== undefined) {
          animal.requirements[field] =
            requirements[field];
        }
      });

      animal.markModified("requirements");
    }

    await animal.save();

    if (matchingDataChanged) {
      await this.runMatchingNotifications(animal);
    }

    const populatedAnimal = await Animal.findById(
      animal._id
    )
      .populate("shelterId", "name city address")
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(200).json({
      success: true,
      message: "Animal updated successfully",
      data: populatedAnimal,
    });
  };

  // ==================================================
  // Soft delete animal
  // ==================================================
  // • Allows Super Admin to delete any animal.
  // • Shelter Employees can delete animals belonging
  //   to their assigned shelter only.
  // • Prevents deleting an already inactive animal.
  // • Prevents deleting an adopted animal.
  // • Changes isActive to false only.
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
        message:
          "You are not allowed to delete this animal",
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
        message:
          "Adopted animals cannot be deleted",
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
  // • Allows Super Admin to restore any animal.
  // • Shelter Employees can restore animals belonging
  //   to their assigned shelter only.
  // • The related shelter must be approved and active.
  // • Restores availability only when the animal
  //   still has at least one image.
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
        message:
          "You are not allowed to restore this animal",
      });
    }

    if (animal.isActive) {
      return res.status(400).json({
        success: false,
        message: "Animal is already active",
      });
    }

    const shelter = await Shelter.findById(
      animal.shelterId
    );

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

    if (
      !animal.images ||
      animal.images.length === 0
    ) {
      animal.adoptionStatus = "unavailable";
    }

    await animal.save();

    await this.runMatchingNotifications(animal);

    const populatedAnimal = await Animal.findById(
      animal._id
    )
      .populate("shelterId", "name city address")
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(200).json({
      success: true,
      message: "Animal restored successfully",
      data: populatedAnimal,
    });
  };

    // ==================================================
  // Add animal images
  // ==================================================
  // • Adds one or more images to an active animal.
  // • Prevents exceeding the maximum image count.
  // • Makes the first image primary automatically.
  // • Changes an unavailable animal to available after
  //   its first image is added.
  // • Deletes newly uploaded Cloudinary images if saving fails.
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

    if (
      currentImagesCount + requestedImagesCount >
      MAX_ANIMAL_IMAGES
    ) {
      return res.status(400).json({
        success: false,
        message: `Animal cannot have more than ${MAX_ANIMAL_IMAGES} images`,
      });
    }

    const uploadedImages = [];
    const isFirstUpload = currentImagesCount === 0;

    try {
      for (const file of req.files) {
        const uploaded = await uploadBufferToCloudinary({
          buffer: file.buffer,
          folder: "animal",
          originalName: file.originalname,
        });

        uploadedImages.push(
          this.buildUploadedImage(
            uploaded,
            currentImagesCount === 0 &&
              uploadedImages.length === 0
          )
        );
      }

      animal.images.push(...uploadedImages);

      if (
        isFirstUpload &&
        animal.adoptionStatus === "unavailable"
      ) {
        animal.adoptionStatus = "available";
      }

      await animal.save();

      if (isFirstUpload) {
        await this.runMatchingNotifications(animal);
      }

      const populatedAnimal = await Animal.findById(
        animal._id
      )
        .populate("shelterId", "name city address")
        .populate(
          "addedBy",
          "firstName lastName role"
        );

      return res.status(200).json({
        success: true,
        message: "Animal images added successfully",
        data: populatedAnimal,
      });
    } catch (error) {
      if (uploadedImages.length > 0) {
        try {
          await deleteImages(
            uploadedImages.map(
              (image) => image.publicId
            )
          );
        } catch (cleanupError) {
          console.error(
            "Failed to clean uploaded animal images:",
            cleanupError.message
          );
        }
      }

      throw error;
    }
  };

  // ==================================================
  // Delete animal image
  // ==================================================
  // • Deletes an image using its MongoDB image ID.
  // • If the primary image is deleted,
  //   the first remaining image becomes primary.
  // • If the last image is deleted,
  //   the animal becomes unavailable.
  // ==================================================
  deleteAnimalImage = async (req, res) => {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(
      req.user,
      animal
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this animal",
      });
    }

    const imageIndex = animal.images.findIndex(
      (image) =>
        String(image._id) === String(imageId)
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const image = animal.images[imageIndex];
    const wasPrimary = image.isPrimary;

    animal.images.splice(imageIndex, 1);

    if (animal.images.length === 0) {
      animal.adoptionStatus = "unavailable";
    } else if (wasPrimary) {
      animal.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }

    await animal.save();

    try {
      await deleteImage(image.publicId);
    } catch (cloudinaryError) {
      console.error(
        "Failed to delete animal image from Cloudinary:",
        cloudinaryError.message
      );
    }

    const populatedAnimal = await Animal.findById(
      animal._id
    )
      .populate("shelterId", "name city address")
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(200).json({
      success: true,
      message: "Animal image deleted successfully",
      data: populatedAnimal,
    });
  };

  // ==================================================
  // Set primary animal image
  // ==================================================
  // • Sets one image as primary.
  // • Removes primary status from all others.
  // ==================================================
  setPrimaryAnimalImage = async (req, res) => {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(
      req.user,
      animal
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this animal",
      });
    }

    const targetImage = animal.images.find(
      (image) =>
        String(image._id) === String(imageId)
    );

    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    animal.images.forEach((image) => {
      image.isPrimary =
        String(image._id) === String(imageId);
    });

    await animal.save();

    return res.status(200).json({
      success: true,
      message:
        "Primary animal image updated successfully",
      data: animal,
    });
  };

    // ==================================================
  // Delete all animal images
  // ==================================================
  // • Deletes all images belonging to an animal.
  // • Removes all image references from MongoDB.
  // • Changes the animal adoption status to unavailable.
  // • Attempts to remove all related files from Cloudinary.
  // • Cloudinary deletion failure does not cancel
  //   the database update.
  // ==================================================
  deleteAllAnimalImages = async (req, res) => {
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

    const allowed = await this.canManageAnimal(
      req.user,
      animal
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this animal",
      });
    }

    if (
      !animal.images ||
      animal.images.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Animal has no images",
      });
    }

    const publicIds = animal.images
      .map((image) => image.publicId)
      .filter(Boolean);

    animal.images = [];
    animal.adoptionStatus = "unavailable";

    await animal.save();

    if (publicIds.length > 0) {
      try {
        await deleteImages(publicIds);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete animal images from Cloudinary:",
          cloudinaryError.message
        );
      }
    }

    const populatedAnimal = await Animal.findById(
      animal._id
    )
      .populate(
        "shelterId",
        "name city address"
      )
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(200).json({
      success: true,
      message:
        "All animal images deleted successfully",
      data: populatedAnimal,
    });
  };

  // ==================================================
  // Replace animal image
  // ==================================================
  // • Replaces one animal image using its MongoDB image ID.
  // • Requires exactly one uploaded image.
  // • Preserves the previous isPrimary value.
  // • Uploads the new image before changing the database.
  // • Removes the newly uploaded image if saving fails.
  // • Deletes the old Cloudinary image after saving.
  // ==================================================
  replaceAnimalImage = async (req, res) => {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid animal ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const animal = await Animal.findById(id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal not found",
      });
    }

    const allowed = await this.canManageAnimal(
      req.user,
      animal
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this animal",
      });
    }

    if (!animal.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "Images cannot be replaced for an inactive animal",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const imageIndex = animal.images.findIndex(
      (image) =>
        String(image._id) === String(imageId)
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const oldImage = animal.images[imageIndex];

    let uploadedImage = null;

    try {
      uploadedImage =
        await uploadBufferToCloudinary({
          buffer: req.file.buffer,
          folder: "animal",
          originalName: req.file.originalname,
        });

      animal.images[imageIndex].url =
        uploadedImage.secure_url;

      animal.images[imageIndex].publicId =
        uploadedImage.public_id;

      animal.images[imageIndex].isPrimary =
        oldImage.isPrimary;

      await animal.save();
    } catch (error) {
      if (uploadedImage?.public_id) {
        try {
          await deleteImage(
            uploadedImage.public_id
          );
        } catch (cleanupError) {
          console.error(
            "Failed to clean replacement image:",
            cleanupError.message
          );
        }
      }

      throw error;
    }

    if (oldImage.publicId) {
      try {
        await deleteImage(oldImage.publicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete old animal image from Cloudinary:",
          cloudinaryError.message
        );
      }
    }

    const populatedAnimal = await Animal.findById(
      animal._id
    )
      .populate(
        "shelterId",
        "name city address"
      )
      .populate(
        "addedBy",
        "firstName lastName role"
      );

    return res.status(200).json({
      success: true,
      message:
        "Animal image replaced successfully",
      data: populatedAnimal,
    });
  };
}

module.exports = new AnimalsController();