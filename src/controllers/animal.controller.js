const mongoose = require("mongoose");

const Animal = require("../models/Animal");
const Shelter = require("../models/Shelter");
const ShelterEmployeeProfile = require("../models/ShelterEmployeeProfile");

const { calculateMatchScore } = require("../services/matching.service");
const AdopterProfile = require("../models/adopterProfile");
const { uploadBufferToCloudinary, deleteImage, deleteImages } = require("../services/cloudinary.service");

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
  // • Checks that the shelter is verified and approved.
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
  // • Accepts only explicitly allowed animal fields.
  // • Prevents the client from controlling isActive,
  //   adoptionStatus, shelterId, and addedBy.
  // • Animals are created as active and available.
  // ==================================================
createAnimal = async (req, res) => {
  const currentUserId = req.user._id;

  let shelterId;
  let uploadedImages = [];

  try {

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


    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one animal image is required",
      });
    }


    for (const file of req.files) {

      const uploaded = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: "animal",
        originalName: file.originalname,
      });


      uploadedImages.push(
        this.buildUploadedImage(
          uploaded,
          uploadedImages.length === 0
        )
      );
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

      images: uploadedImages,

      shelterId,
      addedBy: currentUserId,

      adoptionStatus: "available",
      isActive: true,

    });



    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city")
      .populate("addedBy", "firstName lastName role");



    return res.status(201).json({

      success: true,

      message: "Animal created successfully",

      data: populatedAnimal,

    });



  } catch(error) {


    if(uploadedImages.length > 0){

      await deleteImages(
        uploadedImages.map(image => image.publicId)
      );

    }


    throw error;

  }

};

  // ==================================================
  // Get all animals
  // ==================================================
  // • Returns animals based on the provided filters.
  // • Supports searching by name, breed, and description.
  // • Validates Boolean query values before using them.
  // • Returns active animals by default.
  // • Only Super Admin can request inactive animals.
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
  // • Does not expose the email of the employee
  //   who added the animal.
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
  // • Prevents changing isActive through this endpoint.
  // • Prevents changing adoptionStatus through this endpoint.
  // • Adoption status must be controlled through
  //   the Adoption Request workflow.
  // • Super Admin can transfer an animal to another
  //   approved and active shelter.
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
      // "images",
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

    if (
      req.user.role !== "superadmin" &&
      req.body.shelterId !== undefined
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can change the animal shelter",
      });
    }

    if (req.body.requirements !== undefined) {
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

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Animal restored successfully",
      data: populatedAnimal,
    });
  };
  buildUploadedImage = (result, isPrimary = false) => ({
    url: result.secure_url,
    publicId: result.public_id,
    isPrimary,
  });

 addAnimalImages = async (req, res) => {

  const { id } = req.params;

  const uploadedImages = [];


  try {


    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success:false,
        message:"Invalid animal ID",
      });
    }


    const animal = await Animal.findById(id);


    if(!animal){
      return res.status(404).json({
        success:false,
        message:"Animal not found",
      });
    }



    const allowed = await this.canManageAnimal(
      req.user,
      animal
    );


    if(!allowed){

      return res.status(403).json({
        success:false,
        message:"You are not allowed to update this animal",
      });

    }



    if(!req.files || req.files.length === 0){

      return res.status(400).json({
        success:false,
        message:"At least one image is required",
      });

    }



    for(const file of req.files){


      const uploaded = await uploadBufferToCloudinary({

        buffer:file.buffer,

        folder:"animal",

        originalName:file.originalname,

      });



      const isPrimary =
        animal.images.length === 0 &&
        uploadedImages.length === 0;



      uploadedImages.push(

        this.buildUploadedImage(
          uploaded,
          isPrimary
        )

      );

    }




    animal.images.push(...uploadedImages);


    await animal.save();




    return res.status(200).json({

      success:true,

      message:"Animal images added successfully",

      data:animal,

    });



  }catch(error){



    if(uploadedImages.length > 0){

      await deleteImages(
        uploadedImages.map(image=>image.publicId)
      );

    }


    throw error;


  }

};
deleteAnimalImage = async (req,res)=>{

const {id,imageId}=req.params;


try{


const animal=await Animal.findById(id);


if(!animal){

return res.status(404).json({

success:false,

message:"Animal not found"

});

}



const allowed=await this.canManageAnimal(
req.user,
animal
);


if(!allowed){

return res.status(403).json({

success:false,

message:"You are not allowed to update this animal"

});

}



const imageIndex=animal.images.findIndex(
img=>String(img._id)===String(imageId)
);



if(imageIndex===-1){

return res.status(404).json({

success:false,

message:"Image not found"

});

}



const image=animal.images[imageIndex];



animal.images.splice(imageIndex,1);



if(image.isPrimary && animal.images.length>0){

animal.images[0].isPrimary=true;

}



await animal.save();



try{

await deleteImage(image.publicId);

}catch(cloudinaryError){

console.log(
"Cloudinary delete failed:",
cloudinaryError.message
);

}




return res.status(200).json({

success:true,

message:"Animal image deleted successfully",

data:animal

});



}catch(error){

throw error;

}


};
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
    return res.status(404).json({ success: false, message: "Animal not found" });
  }

  const allowed = await this.canManageAnimal(req.user, animal);
  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to update this animal",
    });
  }

  const targetImage = animal.images.find(
    (img) => String(img._id) === String(imageId),
  );

  if (!targetImage) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  animal.images.forEach((img) => {
    img.isPrimary = String(img._id) === String(imageId);
  });

  await animal.save();

  const populatedAnimal = await Animal.findById(animal._id)
    .populate("shelterId", "name city address")
    .populate("addedBy", "firstName lastName email role");

  return res.status(200).json({
    success: true,
    message: "Primary animal image updated successfully",
    data: populatedAnimal,
  });
};

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
      message: "No animal images found",
    });
  }

  const imageIds = animal.images.map(
    (image) => image.publicId
  );

  try {

    animal.images = [];

    await animal.save();

    try {
      await deleteImages(imageIds);
    } catch (cloudinaryError) {
      console.log(
        "Cloudinary delete failed:",
        cloudinaryError.message
      );
    }

    const populatedAnimal = await Animal.findById(animal._id)
      .populate("shelterId", "name city address")
      .populate("addedBy", "name email role");

    return res.status(200).json({
      success: true,
      message: "All animal images deleted successfully",
      data: populatedAnimal,
    });

  } catch (error) {
    throw error;
  }
};
}

module.exports = new AnimalsController();