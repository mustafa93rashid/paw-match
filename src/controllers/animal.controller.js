const Animal = require("../models/Animal");

class AnimalsController {
  createAnimal = async (req, res) => {
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
      images,
      adoptionStatus,
      shelterId,
      addedBy,
      requirements,
      isActive,
    } = req.body;

    const existingAnimal = await Animal.findOne({ addedBy, name, shelterId });
    if (existingAnimal) {
      return res
        .status(400)
        .json({ message: "you are already added this animal" });
    }

    const newAnimal = await Animal.create({
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
      images,
      adoptionStatus,
      shelterId,
      addedBy,
      requirements,
      isActive,
    });
    return res.status(201).json({
      success: true,
      message: "Animal created successfully",
      data: newAnimal
    });
  };

  getAll = async (req, res) => {
    const animals = await Animal.find();
    res.status(200).json({
      success: true,
      data: animals,
    });
  };

  getOne = async (req, res) => {
    const id = req.params.id;
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ message: "Animal Not Found" });
    }

    res.status(200).json({
      success: true,
      data: animal,
    });
  };

  updateAnimal = async (req, res) => {
    const id = req.params.id;
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "Animal Not Found",
      });
    }

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
      images,
      adoptionStatus,
      shelterId,
      addedBy,
      requirements,
      isActive,
    } = req.body;

    animal.name = name ?? animal.name;
    animal.age = age ?? animal.age;
    animal.ageUnit = ageUnit ?? animal.ageUnit;
    animal.species = species ?? animal.species;
    animal.breed = breed ?? animal.breed;
    animal.gender = gender ?? animal.gender;
    animal.size = size ?? animal.size;
    animal.color = color ?? animal.color;
    animal.healthStatus = healthStatus ?? animal.healthStatus;
    animal.vaccinated = vaccinated ?? animal.vaccinated;
    animal.description = description ?? animal.description;
    animal.images = images ?? animal.images;
    animal.adoptionStatus = adoptionStatus ?? animal.adoptionStatus;
    animal.shelterId = shelterId ?? animal.shelterId;
    animal.addedBy = addedBy ?? animal.addedBy;
    animal.requirements = requirements ?? animal.requirements;
    animal.isActive = isActive ?? animal.isActive;

    animal.save();
    res.status(200).json({
      success: true,
      message: "Animal updated successfully",
      data: animal,
    });
  };

  removeAnimal = async (req, res) => {
      const id = req.params.id;
      const animal = await Animal.findById(id);
      if (!animal) {
          return res.status(404).json({
              success: false,
              message: "Animal Not Found" });
      }
      await Animal.findByIdAndDelete(id);
      res.status(200).json({
          success: true,
          message: "Animal deleted successfully" });
  };


}

module.exports = new AnimalsController();
