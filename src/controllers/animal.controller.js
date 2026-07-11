const mongoose = require("mongoose");
const Animal = require("../models/Animal");
const Shelter = require("../models/Shelter");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

class AnimalsController {
  // Get current shelter employee profile
  getEmployeeProfile = async (userId) => {
    const employeeProfile = await ShelterEmployeeProfile.findOne({
      userId,
      isActive: true,
    });

    return employeeProfile;
  };

  // Check if the user can manage the animal
  canManageAnimal = async (user, animal) => {
    if (user.role === "superadmin") {
      return true;
    }

    if (user.role !== "shelterEmployee") {
      return false;
    }

    const currentUserId = user._id || user.id;

    const employeeProfile = await this.getEmployeeProfile(currentUserId);

    if (!employeeProfile || !employeeProfile.shelterId) {
      return false;
    }

    return String(animal.shelterId) === String(employeeProfile.shelterId);
  };

  // Create a new animal
  createAnimal = async (req, res) => {
    const currentUserId = req.user._id || req.user.id;

    let shelterId;

    if (req.user.role === "shelterEmployee") {
      const employeeProfile = await this.getEmployeeProfile(currentUserId);

      if (!employeeProfile) {
        return res.status(403).json({
          success: false,
          message: "Shelter employee profile not found",
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

    if (req.user.role === "superadmin") {
      shelterId = req.body.shelterId;

      if (!shelterId) {
        return res.status(400).json({
          success: false,
          message: "Shelter ID is required",
        });
      }
    }

    const animal = await Animal.create({
      ...req.body,
      shelterId,
      addedBy: currentUserId,
    });

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city")
      .populate("addedBy", "firstName lastName role");

    return res.status(201).json({
      success: true,
      message: "Animal created successfully",
      data: populatedAnimal,
    });
  };

  // Get all animals
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
      sort = "-createdAt",
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
      filter.vaccinated = vaccinated === "true";
    }

    if (isActive !== undefined) {
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
      .populate("addedBy", "firstName lastName email role")
      .sort(sort);

    return res.status(200).json({
      success: true,
      message: "Animals retrieved successfully",
      data: animals,
    });
  };

  // Get animal by ID
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
      .populate("addedBy", "firstName lastName email role");

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

  // Update animal
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
      "images",
      "adoptionStatus",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        animal[field] = req.body[field];
      }
    });

    if (req.user.role === "superadmin" && req.body.shelterId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(req.body.shelterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shelter ID",
        });
      }

      const shelterExists = await Shelter.exists({
        _id: req.body.shelterId,
        isActive: true,
      });

      if (!shelterExists) {
        return res.status(404).json({
          success: false,
          message: "Shelter not found or inactive",
        });
      }

      animal.shelterId = req.body.shelterId;
    }

    if (req.body.requirements) {
      const requirements = req.body.requirements;

      const requirementFields = [
        "homeType",
        "suitableForKids",
        "goodWithOtherPets",
        "experienceLevel",
        "dailyActivityLevel",
        "ownerType",
        "isAllergic",
      ];

      requirementFields.forEach((field) => {
        if (requirements[field] !== undefined) {
          animal.requirements[field] = requirements[field];
        }
      });
    }

    await animal.save();

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName email role");

    return res.status(200).json({
      success: true,
      message: "Animal updated successfully",
      data: populatedAnimal,
    });
  };

  // Soft delete animal
  removeAnimal = async (req, res) => {
    const animal = await Animal.findById(req.params.id);

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

    animal.isActive = false;
    animal.adoptionStatus = "unavailable";

    await animal.save();

    return res.status(200).json({
      success: true,
      message: "Animal deleted successfully",
      data: animal,
    });
  };

  // Restore deleted animal
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

    animal.isActive = true;
    animal.adoptionStatus = "available";

    await animal.save();

    return res.status(200).json({
      success: true,
      message: "Animal restored successfully",
      data: animal,
    });
  };
}

module.exports = new AnimalsController();
