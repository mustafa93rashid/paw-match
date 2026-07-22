require("dotenv").config();

const mongoose = require("mongoose");
const argon2 = require("argon2");

// ==================================================
// Models
// ==================================================
const User = require("./models/user");
const Shelter = require("./models/shelter");
const Animal = require("./models/animal");
const AdopterProfile = require("./models/adopterProfile");
const ShelterEmployeeProfile = require("./models/shelterEmployeeProfile");
const VetProfile = require("./models/vetProfile");
const AdoptionRequest = require("./models/adoptionRequest");
const VetAppointment = require("./models/vetAppointment");
const Review = require("./models/review");
const Notification = require("./models/notification");

// ==================================================
// Seed Configuration
// ==================================================
const DEFAULT_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD || "Password@123";

const seedEmails = [
  process.env.SUPER_ADMIN_EMAIL || "admin@pawmatch.com",

  "manager1@pawmatch.com",
  "manager2@pawmatch.com",

  "employee1@pawmatch.com",
  "employee2@pawmatch.com",

  "vet1@pawmatch.com",
  "vet2@pawmatch.com",

  "adopter1@pawmatch.com",
  "adopter2@pawmatch.com",
  "adopter3@pawmatch.com",
  "adopter4@pawmatch.com",
  "adopter5@pawmatch.com",
];

const seedShelterEmails = [
  "baghdad.shelter@pawmatch.com",
  "diyala.shelter@pawmatch.com",
];

// ==================================================
// Date Helpers
// ==================================================
const daysFromNow = (days, hours = 0) => {
  const date = new Date();

  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);

  return date;
};

const yearsAgo = (years, month = 0, day = 1) => {
  const date = new Date();

  date.setFullYear(date.getFullYear() - years);
  date.setMonth(month);
  date.setDate(day);

  return date;
};

// ==================================================
// Password Helper
// ==================================================
const hashPassword = async (password) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
};

// ==================================================
// User Creation Helper
// ==================================================
const createUser = async ({
  firstName,
  lastName,
  email,
  role,
  gender,
  phone,
  address,
  dateOfBirth,
}) => {
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  return User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    gender,
    phone,
    address,
    dateOfBirth,
    isActive: true,
  });
};

// ==================================================
// Remove Previous Seed Data
// ==================================================
// This removes only data belonging to the accounts and shelters
// created by this seed file. It does not delete normal project data.
// ==================================================
const clearPreviousSeedData = async () => {
  console.log("Removing previous seed data...");

  const existingUsers = await User.find({
    email: {
      $in: seedEmails,
    },
  }).select("_id");

  const existingUserIds = existingUsers.map((user) => user._id);

  const existingShelters = await Shelter.find({
    email: {
      $in: seedShelterEmails,
    },
  }).select("_id");

  const existingShelterIds = existingShelters.map(
    (shelter) => shelter._id,
  );

  const existingAnimals = await Animal.find({
    shelterId: {
      $in: existingShelterIds,
    },
  }).select("_id");

  const existingAnimalIds = existingAnimals.map(
    (animal) => animal._id,
  );

  const existingAdoptionRequests =
    await AdoptionRequest.find({
      $or: [
        {
          adopterId: {
            $in: existingUserIds,
          },
        },
        {
          shelterId: {
            $in: existingShelterIds,
          },
        },
        {
          animalId: {
            $in: existingAnimalIds,
          },
        },
      ],
    }).select("_id");

  const existingAdoptionRequestIds =
    existingAdoptionRequests.map((request) => request._id);

  const existingVetAppointments =
    await VetAppointment.find({
      $or: [
        {
          adopterId: {
            $in: existingUserIds,
          },
        },
        {
          vetId: {
            $in: existingUserIds,
          },
        },
      ],
    }).select("_id");

  const existingVetAppointmentIds =
    existingVetAppointments.map(
      (appointment) => appointment._id,
    );

  await Notification.deleteMany({
    $or: [
      {
        recipientId: {
          $in: existingUserIds,
        },
      },
      {
        senderId: {
          $in: existingUserIds,
        },
      },
      {
        referenceId: {
          $in: [
            ...existingAnimalIds,
            ...existingAdoptionRequestIds,
            ...existingVetAppointmentIds,
          ],
        },
      },
    ],
  });

  await Review.deleteMany({
    $or: [
      {
        adopterId: {
          $in: existingUserIds,
        },
      },
      {
        targetId: {
          $in: [...existingUserIds, ...existingShelterIds],
        },
      },
      {
        transactionId: {
          $in: [
            ...existingAdoptionRequestIds,
            ...existingVetAppointmentIds,
          ],
        },
      },
    ],
  });

  await VetAppointment.deleteMany({
    $or: [
      {
        adopterId: {
          $in: existingUserIds,
        },
      },
      {
        vetId: {
          $in: existingUserIds,
        },
      },
    ],
  });

  await AdoptionRequest.deleteMany({
    $or: [
      {
        adopterId: {
          $in: existingUserIds,
        },
      },
      {
        shelterId: {
          $in: existingShelterIds,
        },
      },
      {
        animalId: {
          $in: existingAnimalIds,
        },
      },
    ],
  });

  await Animal.deleteMany({
    shelterId: {
      $in: existingShelterIds,
    },
  });

  await AdopterProfile.deleteMany({
    userId: {
      $in: existingUserIds,
    },
  });

  await ShelterEmployeeProfile.deleteMany({
    userId: {
      $in: existingUserIds,
    },
  });

  await VetProfile.deleteMany({
    userId: {
      $in: existingUserIds,
    },
  });

  await Shelter.deleteMany({
    _id: {
      $in: existingShelterIds,
    },
  });

  await User.deleteMany({
    _id: {
      $in: existingUserIds,
    },
  });

  console.log("Previous seed data removed");
};

// ==================================================
// Create Users
// ==================================================
const seedUsers = async () => {
  console.log("Creating users...");

  const superAdmin = await createUser({
    firstName:
      process.env.SUPER_ADMIN_FIRST_NAME || "Super",
    lastName:
      process.env.SUPER_ADMIN_LAST_NAME || "Admin",
    email:
      process.env.SUPER_ADMIN_EMAIL ||
      "admin@pawmatch.com",
    role: "superadmin",
    gender: "male",
    phone: "07700000001",
    address: "Baghdad, Iraq",
    dateOfBirth: yearsAgo(35, 2, 10),
  });

  const manager1 = await createUser({
    firstName: "Ahmed",
    lastName: "Hassan",
    email: "manager1@pawmatch.com",
    role: "shelterEmployee",
    gender: "male",
    phone: "07700000002",
    address: "Karrada, Baghdad",
    dateOfBirth: yearsAgo(34, 4, 15),
  });

  const manager2 = await createUser({
    firstName: "Sara",
    lastName: "Ali",
    email: "manager2@pawmatch.com",
    role: "shelterEmployee",
    gender: "female",
    phone: "07700000003",
    address: "Baqubah, Diyala",
    dateOfBirth: yearsAgo(31, 7, 20),
  });

  const employee1 = await createUser({
    firstName: "Omar",
    lastName: "Mahmoud",
    email: "employee1@pawmatch.com",
    role: "shelterEmployee",
    gender: "male",
    phone: "07700000004",
    address: "Mansour, Baghdad",
    dateOfBirth: yearsAgo(27, 1, 12),
  });

  const employee2 = await createUser({
    firstName: "Noor",
    lastName: "Khalid",
    email: "employee2@pawmatch.com",
    role: "shelterEmployee",
    gender: "female",
    phone: "07700000005",
    address: "Baqubah, Diyala",
    dateOfBirth: yearsAgo(26, 10, 5),
  });

  const vet1 = await createUser({
    firstName: "Ali",
    lastName: "Karim",
    email: "vet1@pawmatch.com",
    role: "vet",
    gender: "male",
    phone: "07700000006",
    address: "Baghdad, Iraq",
    dateOfBirth: yearsAgo(38, 3, 18),
  });

  const vet2 = await createUser({
    firstName: "Zainab",
    lastName: "Jassim",
    email: "vet2@pawmatch.com",
    role: "vet",
    gender: "female",
    phone: "07700000007",
    address: "Diyala, Iraq",
    dateOfBirth: yearsAgo(33, 8, 9),
  });

  const adopter1 = await createUser({
    firstName: "Mustafa",
    lastName: "Rashid",
    email: "adopter1@pawmatch.com",
    role: "adopter",
    gender: "male",
    phone: "07700000008",
    address: "Baqubah, Diyala",
    dateOfBirth: yearsAgo(25, 5, 11),
  });

  const adopter2 = await createUser({
    firstName: "Mariam",
    lastName: "Adnan",
    email: "adopter2@pawmatch.com",
    role: "adopter",
    gender: "female",
    phone: "07700000009",
    address: "Baghdad, Iraq",
    dateOfBirth: yearsAgo(29, 6, 21),
  });

  const adopter3 = await createUser({
    firstName: "Hussein",
    lastName: "Abbas",
    email: "adopter3@pawmatch.com",
    role: "adopter",
    gender: "male",
    phone: "07700000010",
    address: "Karbala, Iraq",
    dateOfBirth: yearsAgo(32, 9, 14),
  });

  const adopter4 = await createUser({
    firstName: "Fatima",
    lastName: "Nasser",
    email: "adopter4@pawmatch.com",
    role: "adopter",
    gender: "female",
    phone: "07700000011",
    address: "Baghdad, Iraq",
    dateOfBirth: yearsAgo(24, 11, 7),
  });

  const adopter5 = await createUser({
    firstName: "Youssef",
    lastName: "Salem",
    email: "adopter5@pawmatch.com",
    role: "adopter",
    gender: "male",
    phone: "07700000012",
    address: "Diyala, Iraq",
    dateOfBirth: yearsAgo(36, 0, 25),
  });

  return {
    superAdmin,
    manager1,
    manager2,
    employee1,
    employee2,
    vet1,
    vet2,
    adopter1,
    adopter2,
    adopter3,
    adopter4,
    adopter5,
  };
};

// ==================================================
// Create Shelters
// ==================================================
const seedShelters = async (users) => {
  console.log("Creating shelters...");

  const shelter1 = await Shelter.create({
    name: "Baghdad Happy Paws Shelter",
    email: "baghdad.shelter@pawmatch.com",
    phone: "07800000001",

    description:
      "A verified animal shelter providing rescue, rehabilitation, veterinary care, and responsible adoption services.",

    address: "Karrada, Baghdad, Iraq",
    city: "Baghdad",

    latitude: 33.3128,
    longitude: 44.3615,

    location: {
      type: "Point",
      coordinates: [44.3615, 33.3128],
    },

    employees: [
      users.manager1._id,
      users.employee1._id,
    ],

    animalIds: [],

    supportedSpecies: [
      "dog",
      "cat",
      "bird",
      "rabbit",
    ],

    capacity: 80,

    verificationStatus: "approved",
    isVerified: true,
    rejectionReason: null,
    isActive: true,

    operatingHours: {
      open: "08:00",
      close: "18:00",
    },

    socialLinks: {
      facebook:
        "https://facebook.com/baghdad-happy-paws",
      instagram:
        "https://instagram.com/baghdad-happy-paws",
      website:
        "https://baghdad-happy-paws.example.com",
    },

    createdBy: users.manager1._id,
    verifiedBy: users.superAdmin._id,
    verifiedAt: daysFromNow(-120),
  });

  const shelter2 = await Shelter.create({
    name: "Diyala Animal Rescue Center",
    email: "diyala.shelter@pawmatch.com",
    phone: "07800000002",

    description:
      "A local rescue center focused on helping abandoned animals and finding suitable permanent homes.",

    address: "Baqubah Center, Diyala, Iraq",
    city: "Diyala",

    latitude: 33.7476,
    longitude: 44.6572,

    location: {
      type: "Point",
      coordinates: [44.6572, 33.7476],
    },

    employees: [
      users.manager2._id,
      users.employee2._id,
    ],

    animalIds: [],

    supportedSpecies: [
      "dog",
      "cat",
      "rabbit",
      "fish",
    ],

    capacity: 50,

    verificationStatus: "approved",
    isVerified: true,
    rejectionReason: null,
    isActive: true,

    operatingHours: {
      open: "09:00",
      close: "17:00",
    },

    socialLinks: {
      facebook:
        "https://facebook.com/diyala-animal-rescue",
      instagram:
        "https://instagram.com/diyala-animal-rescue",
      website: null,
    },

    createdBy: users.manager2._id,
    verifiedBy: users.superAdmin._id,
    verifiedAt: daysFromNow(-90),
  });

  return {
    shelter1,
    shelter2,
  };
};

// ==================================================
// Create Shelter Employee Profiles
// ==================================================
const seedEmployeeProfiles = async (
  users,
  shelters,
) => {
  console.log("Creating shelter employee profiles...");

  await ShelterEmployeeProfile.create([
    {
      userId: users.manager1._id,
      shelterId: shelters.shelter1._id,
      position: "manager",
      employeeNumber: "BGD-MGR-001",
      hireDate: daysFromNow(-700),
      isActive: true,
    },
    {
      userId: users.employee1._id,
      shelterId: shelters.shelter1._id,
      position: "employee",
      employeeNumber: "BGD-EMP-001",
      hireDate: daysFromNow(-300),
      isActive: true,
    },
    {
      userId: users.manager2._id,
      shelterId: shelters.shelter2._id,
      position: "manager",
      employeeNumber: "DYL-MGR-001",
      hireDate: daysFromNow(-600),
      isActive: true,
    },
    {
      userId: users.employee2._id,
      shelterId: shelters.shelter2._id,
      position: "employee",
      employeeNumber: "DYL-EMP-001",
      hireDate: daysFromNow(-250),
      isActive: true,
    },
  ]);
};

// ==================================================
// Create Veterinarian Profiles
// ==================================================
const seedVetProfiles = async (users, shelters) => {
  console.log("Creating veterinarian profiles...");

  await VetProfile.create([
    {
      userId: users.vet1._id,
      shelterId: shelters.shelter1._id,
      specialization:
        "Small Animal Medicine and Surgery",
      bio:
        "Veterinarian specializing in dogs and cats, preventive care, vaccinations, and minor surgery.",
      experienceYears: 10,
      availableDays: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
      ],
      consultationTypes: [
        "vetConsultation",
        "behaviorTraining",
      ],
      isActive: true,
    },
    {
      userId: users.vet2._id,
      shelterId: null,
      specialization:
        "Animal Behavior and Preventive Medicine",
      bio:
        "Independent veterinarian providing health consultations and behavioral training.",
      experienceYears: 7,
      availableDays: [
        "saturday",
        "sunday",
        "tuesday",
        "thursday",
      ],
      consultationTypes: [
        "vetConsultation",
        "behaviorTraining",
      ],
      isActive: true,
    },
  ]);
};

// ==================================================
// Create Adopter Profiles
// ==================================================
const seedAdopterProfiles = async (users) => {
  console.log("Creating adopter profiles...");

  await AdopterProfile.create([
    {
      userId: users.adopter1._id,
      homeType: "house",
      hasKids: false,
      hasOtherPets: true,
      experienceLevel: "expert",
      dailyActivityLevel: "high",
      isAllergic: false,
      ownerType: "family",
      preferredSpecies: ["dog", "cat"],
      isActive: true,
    },
    {
      userId: users.adopter2._id,
      homeType: "apartment",
      hasKids: true,
      hasOtherPets: false,
      experienceLevel: "beginner",
      dailyActivityLevel: "medium",
      isAllergic: false,
      ownerType: "family",
      preferredSpecies: ["cat", "bird"],
      isActive: true,
    },
    {
      userId: users.adopter3._id,
      homeType: "farm",
      hasKids: false,
      hasOtherPets: true,
      experienceLevel: "expert",
      dailyActivityLevel: "high",
      isAllergic: false,
      ownerType: "single",
      preferredSpecies: ["dog", "rabbit"],
      isActive: true,
    },
    {
      userId: users.adopter4._id,
      homeType: "apartment",
      hasKids: false,
      hasOtherPets: false,
      experienceLevel: "intermediate",
      dailyActivityLevel: "low",
      isAllergic: true,
      ownerType: "single",
      preferredSpecies: ["cat"],
      isActive: true,
    },
    {
      userId: users.adopter5._id,
      homeType: "house",
      hasKids: true,
      hasOtherPets: true,
      experienceLevel: "intermediate",
      dailyActivityLevel: "medium",
      isAllergic: false,
      ownerType: "family",
      preferredSpecies: ["dog", "cat", "rabbit"],
      isActive: true,
    },
  ]);
};

// ==================================================
// Animal Image Helper
// ==================================================
const animalImage = (name, number = 1) => ({
  url: `https://images.example.com/paw-match/${name}-${number}.jpg`,
  publicId: `paw-match/animal/${name}-${number}`,
});

// ==================================================
// Create Animals
// ==================================================
const seedAnimals = async (users, shelters) => {
  console.log("Creating animals...");

  const max = await Animal.create({
    name: "Max",
    age: 2,
    ageUnit: "years",
    species: "dog",
    breed: "Golden Retriever",
    gender: "male",
    size: "large",
    color: "Golden",
    healthStatus: "healthy",
    vaccinated: true,
    description:
      "Friendly, active, trained, and suitable for families.",
    images: [
      animalImage("max", 1),
      animalImage("max", 2),
    ],
    adoptionStatus: "available",
    shelterId: shelters.shelter1._id,
    addedBy: users.manager1._id,
    requirements: {
      homeType: "house",
      suitableForKids: true,
      goodWithOtherPets: true,
      experienceLevel: "intermediate",
      dailyActivityLevel: "high",
      ownerType: "family",
      hypoallergenic: false,
    },
    isActive: true,
  });

  const luna = await Animal.create({
    name: "Luna",
    age: 1,
    ageUnit: "years",
    species: "cat",
    breed: "British Shorthair",
    gender: "female",
    size: "medium",
    color: "Gray",
    healthStatus: "healthy",
    vaccinated: true,
    description:
      "Calm indoor cat that enjoys quiet homes.",
    images: [animalImage("luna", 1)],
    adoptionStatus: "pending",
    shelterId: shelters.shelter1._id,
    addedBy: users.employee1._id,
    requirements: {
      homeType: "apartment",
      suitableForKids: true,
      goodWithOtherPets: false,
      experienceLevel: "beginner",
      dailyActivityLevel: "low",
      ownerType: "any",
      hypoallergenic: false,
    },
    isActive: true,
  });

  const rocky = await Animal.create({
    name: "Rocky",
    age: 3,
    ageUnit: "years",
    species: "dog",
    breed: "German Shepherd",
    gender: "male",
    size: "large",
    color: "Black and Tan",
    healthStatus: "healthy",
    vaccinated: true,
    description:
      "Intelligent and energetic dog for an experienced adopter.",
    images: [animalImage("rocky", 1)],
    adoptionStatus: "adopted",
    shelterId: shelters.shelter1._id,
    addedBy: users.manager1._id,
    requirements: {
      homeType: "house",
      suitableForKids: false,
      goodWithOtherPets: true,
      experienceLevel: "expert",
      dailyActivityLevel: "high",
      ownerType: "any",
      hypoallergenic: false,
    },
    isActive: true,
  });

  const coco = await Animal.create({
    name: "Coco",
    age: 8,
    ageUnit: "months",
    species: "bird",
    breed: "Cockatiel",
    gender: "female",
    size: "small",
    color: "Yellow and Gray",
    healthStatus: "healthy",
    vaccinated: false,
    description:
      "Social bird that enjoys interacting with people.",
    images: [animalImage("coco", 1)],
    adoptionStatus: "available",
    shelterId: shelters.shelter1._id,
    addedBy: users.employee1._id,
    requirements: {
      homeType: "any",
      suitableForKids: true,
      goodWithOtherPets: false,
      experienceLevel: "beginner",
      dailyActivityLevel: "medium",
      ownerType: "any",
      hypoallergenic: false,
    },
    isActive: true,
  });

  const bella = await Animal.create({
    name: "Bella",
    age: 2,
    ageUnit: "years",
    species: "cat",
    breed: "Persian",
    gender: "female",
    size: "medium",
    color: "White",
    healthStatus: "underTreatment",
    vaccinated: true,
    description:
      "Quiet Persian cat currently receiving routine treatment.",
    images: [animalImage("bella", 1)],
    adoptionStatus: "unavailable",
    shelterId: shelters.shelter2._id,
    addedBy: users.manager2._id,
    requirements: {
      homeType: "apartment",
      suitableForKids: false,
      goodWithOtherPets: false,
      experienceLevel: "intermediate",
      dailyActivityLevel: "low",
      ownerType: "single",
      hypoallergenic: false,
    },
    isActive: true,
  });

  const charlie = await Animal.create({
    name: "Charlie",
    age: 10,
    ageUnit: "months",
    species: "dog",
    breed: "Beagle",
    gender: "male",
    size: "medium",
    color: "Brown and White",
    healthStatus: "healthy",
    vaccinated: true,
    description:
      "Playful young dog suitable for an active family.",
    images: [animalImage("charlie", 1)],
    adoptionStatus: "available",
    shelterId: shelters.shelter2._id,
    addedBy: users.employee2._id,
    requirements: {
      homeType: "house",
      suitableForKids: true,
      goodWithOtherPets: true,
      experienceLevel: "beginner",
      dailyActivityLevel: "high",
      ownerType: "family",
      hypoallergenic: false,
    },
    isActive: true,
  });

  const snow = await Animal.create({
    name: "Snow",
    age: 7,
    ageUnit: "months",
    species: "rabbit",
    breed: "Mini Lop",
    gender: "female",
    size: "small",
    color: "White",
    healthStatus: "healthy",
    vaccinated: false,
    description:
      "Gentle rabbit suitable for calm households.",
    images: [animalImage("snow", 1)],
    adoptionStatus: "available",
    shelterId: shelters.shelter2._id,
    addedBy: users.manager2._id,
    requirements: {
      homeType: "any",
      suitableForKids: true,
      goodWithOtherPets: true,
      experienceLevel: "beginner",
      dailyActivityLevel: "low",
      ownerType: "any",
      hypoallergenic: true,
    },
    isActive: true,
  });

  const simba = await Animal.create({
    name: "Simba",
    age: 4,
    ageUnit: "years",
    species: "cat",
    breed: "Domestic Longhair",
    gender: "male",
    size: "medium",
    color: "Orange",
    healthStatus: "specialNeeds",
    vaccinated: true,
    description:
      "Affectionate special-needs cat requiring an experienced adopter.",
    images: [animalImage("simba", 1)],
    adoptionStatus: "available",
    shelterId: shelters.shelter2._id,
    addedBy: users.employee2._id,
    requirements: {
      homeType: "apartment",
      suitableForKids: false,
      goodWithOtherPets: false,
      experienceLevel: "expert",
      dailyActivityLevel: "low",
      ownerType: "single",
      hypoallergenic: false,
    },
    isActive: true,
  });

  await Shelter.findByIdAndUpdate(
    shelters.shelter1._id,
    {
      $set: {
        animalIds: [
          max._id,
          luna._id,
          rocky._id,
          coco._id,
        ],
      },
    },
  );

  await Shelter.findByIdAndUpdate(
    shelters.shelter2._id,
    {
      $set: {
        animalIds: [
          bella._id,
          charlie._id,
          snow._id,
          simba._id,
        ],
      },
    },
  );

  return {
    max,
    luna,
    rocky,
    coco,
    bella,
    charlie,
    snow,
    simba,
  };
};

// ==================================================
// Create Adoption Requests
// ==================================================
const seedAdoptionRequests = async (
  users,
  shelters,
  animals,
) => {
  console.log("Creating adoption requests...");

  const pendingRequest = await AdoptionRequest.create({
    adopterId: users.adopter1._id,
    animalId: animals.max._id,
    shelterId: shelters.shelter1._id,
    message:
      "I have experience with large dogs and a suitable home.",
    status: "pendingReview",
  });

  const interviewRequest =
    await AdoptionRequest.create({
      adopterId: users.adopter2._id,
      animalId: animals.coco._id,
      shelterId: shelters.shelter1._id,
      message:
        "I am interested in adopting Coco and can provide a safe indoor space.",
      status: "interview",
      reviewedBy: users.manager1._id,
    });

  const homeCheckRequest =
    await AdoptionRequest.create({
      adopterId: users.adopter3._id,
      animalId: animals.snow._id,
      shelterId: shelters.shelter2._id,
      message:
        "I have a farm and experience caring for rabbits.",
      status: "homeCheck",
      reviewedBy: users.manager2._id,
    });

  const approvedRequest =
    await AdoptionRequest.create({
      adopterId: users.adopter4._id,
      animalId: animals.luna._id,
      shelterId: shelters.shelter1._id,
      message:
        "I would like to provide Luna with a quiet indoor home.",
      status: "approved",
      reviewedBy: users.manager1._id,
      approvedAt: daysFromNow(-3),
    });

  const completedRequest =
    await AdoptionRequest.create({
      adopterId: users.adopter5._id,
      animalId: animals.rocky._id,
      shelterId: shelters.shelter1._id,
      message:
        "Our family has experience with German Shepherds.",
      status: "completed",
      reviewedBy: users.manager1._id,
      approvedAt: daysFromNow(-30),
      completedAt: daysFromNow(-20),
    });

  const rejectedRequest =
    await AdoptionRequest.create({
      adopterId: users.adopter2._id,
      animalId: animals.simba._id,
      shelterId: shelters.shelter2._id,
      message:
        "I am interested in adopting Simba.",
      status: "rejected",
      rejectionReason:
        "The current home environment does not meet Simba's special-care requirements.",
      reviewedBy: users.manager2._id,
      rejectedAt: daysFromNow(-8),
    });

  const cancelledRequest =
    await AdoptionRequest.create({
      adopterId: users.adopter3._id,
      animalId: animals.charlie._id,
      shelterId: shelters.shelter2._id,
      message:
        "I initially wanted to adopt Charlie.",
      status: "cancelled",
      cancelledAt: daysFromNow(-5),
    });

  return {
    pendingRequest,
    interviewRequest,
    homeCheckRequest,
    approvedRequest,
    completedRequest,
    rejectedRequest,
    cancelledRequest,
  };
};

// ==================================================
// Create Veterinarian Appointments
// ==================================================
const seedVetAppointments = async (users) => {
  console.log("Creating veterinarian appointments...");

  const completedAppointment =
    await VetAppointment.create({
      adopterId: users.adopter1._id,
      vetId: users.vet1._id,
      appointmentDate: daysFromNow(-15),
      duration: 30,
      status: "completed",
      requestMessage:
        "General health consultation for my dog.",
      vetNotes:
        "The animal is healthy. Continue routine vaccination and nutrition plan.",
      completedAt: daysFromNow(-15, 1),
    });

  const scheduledAppointment =
    await VetAppointment.create({
      adopterId: users.adopter2._id,
      vetId: users.vet1._id,
      appointmentDate: daysFromNow(3),
      duration: 45,
      status: "scheduled",
      requestMessage:
        "My cat has reduced appetite and needs examination.",
      vetNotes:
        "Bring previous vaccination and medical records.",
    });

  const pendingAppointment =
    await VetAppointment.create({
      adopterId: users.adopter3._id,
      vetId: users.vet2._id,
      appointmentDate: null,
      duration: 30,
      status: "pending",
      requestMessage:
        "I need behavioral advice for my recently adopted dog.",
    });

  const rejectedAppointment =
    await VetAppointment.create({
      adopterId: users.adopter4._id,
      vetId: users.vet2._id,
      appointmentDate: null,
      duration: 30,
      status: "rejected",
      requestMessage:
        "I need an urgent appointment today.",
      rejectionReason:
        "No appointment slots are available on the requested day.",
    });

  const cancelledAppointment =
    await VetAppointment.create({
      adopterId: users.adopter5._id,
      vetId: users.vet1._id,
      appointmentDate: daysFromNow(5),
      duration: 30,
      status: "cancelled",
      requestMessage:
        "Routine follow-up appointment.",
      cancelledAt: daysFromNow(-1),
    });

  return {
    completedAppointment,
    scheduledAppointment,
    pendingAppointment,
    rejectedAppointment,
    cancelledAppointment,
  };
};

// ==================================================
// Create Reviews
// ==================================================
const seedReviews = async ({
  users,
  shelters,
  adoptionRequests,
  vetAppointments,
}) => {
  console.log("Creating reviews...");

  const shelterReview = new Review({
    adopterId: users.adopter5._id,
    targetType: "shelter",
    targetId: shelters.shelter1._id,
    transactionId:
      adoptionRequests.completedRequest._id,
    rating: 5,
    comment:
      "The adoption process was professional and the staff were very helpful.",
    reply: {
      text:
        "Thank you for providing Rocky with a loving home.",
      createdAt: daysFromNow(-18),
      repliedBy: users.manager1._id,
    },
    status: "published",
    isEdited: false,
  });

  await shelterReview.save();

  const vetReview = new Review({
    adopterId: users.adopter1._id,
    targetType: "vet",
    targetId: users.vet1._id,
    transactionId:
      vetAppointments.completedAppointment._id,
    rating: 4,
    comment:
      "The veterinarian explained the health plan clearly and answered all questions.",
    reply: {
      text:
        "Thank you for your review. I am glad the consultation was helpful.",
      createdAt: daysFromNow(-13),
      repliedBy: users.vet1._id,
    },
    status: "published",
    isEdited: false,
  });

  await vetReview.save();

  return {
    shelterReview,
    vetReview,
  };
};

// ==================================================
// Create Notifications
// ==================================================
const seedNotifications = async ({
  users,
  animals,
  adoptionRequests,
  vetAppointments,
}) => {
  console.log("Creating notifications...");

  await Notification.create([
    {
      recipientId: users.adopter1._id,
      senderId: null,
      type: "animalMatch",
      title: "New animal match",
      message:
        "Max matches your adoption preferences by 92%.",
      referenceId: animals.max._id,
      referenceModel: "Animal",
      metadata: {
        matchPercentage: 92,
      },
      isRead: false,
      readAt: null,
    },
    {
      recipientId: users.adopter2._id,
      senderId: users.manager1._id,
      type: "adoptionRequest",
      title: "Adoption interview",
      message:
        "Your adoption request has moved to the interview stage.",
      referenceId:
        adoptionRequests.interviewRequest._id,
      referenceModel: "AdoptionRequest",
      metadata: {
        matchPercentage: null,
      },
      isRead: false,
      readAt: null,
    },
    {
      recipientId: users.adopter4._id,
      senderId: users.manager1._id,
      type: "adoptionRequest",
      title: "Adoption request approved",
      message:
        "Your request to adopt Luna has been approved.",
      referenceId:
        adoptionRequests.approvedRequest._id,
      referenceModel: "AdoptionRequest",
      metadata: {
        matchPercentage: null,
      },
      isRead: true,
      readAt: daysFromNow(-2),
    },
    {
      recipientId: users.adopter2._id,
      senderId: users.vet1._id,
      type: "appointment",
      title: "Veterinary appointment scheduled",
      message:
        "Your veterinary appointment has been scheduled.",
      referenceId:
        vetAppointments.scheduledAppointment._id,
      referenceModel: "VetAppointment",
      metadata: {
        matchPercentage: null,
      },
      isRead: false,
      readAt: null,
    },
    {
      recipientId: users.adopter4._id,
      senderId: users.vet2._id,
      type: "appointment",
      title: "Appointment request rejected",
      message:
        "Your requested veterinary appointment could not be scheduled.",
      referenceId:
        vetAppointments.rejectedAppointment._id,
      referenceModel: "VetAppointment",
      metadata: {
        matchPercentage: null,
      },
      isRead: true,
      readAt: daysFromNow(-1),
    },
    {
      recipientId: users.superAdmin._id,
      senderId: null,
      type: "system",
      title: "Seed data created",
      message:
        "Paw Match development seed data was created successfully.",
      referenceId: null,
      referenceModel: null,
      metadata: {
        matchPercentage: null,
      },
      isRead: false,
      readAt: null,
    },
  ]);
};

// ==================================================
// Print Login Accounts
// ==================================================
const printLoginAccounts = () => {
  console.log("");
  console.log("========================================");
  console.log("Seed completed successfully");
  console.log("========================================");
  console.log(`Password for all users: ${DEFAULT_PASSWORD}`);
  console.log("");

  console.log("Super Admin:");
  console.log(
    process.env.SUPER_ADMIN_EMAIL ||
      "admin@pawmatch.com",
  );

  console.log("");
  console.log("Shelter Managers:");
  console.log("manager1@pawmatch.com");
  console.log("manager2@pawmatch.com");

  console.log("");
  console.log("Shelter Employees:");
  console.log("employee1@pawmatch.com");
  console.log("employee2@pawmatch.com");

  console.log("");
  console.log("Veterinarians:");
  console.log("vet1@pawmatch.com");
  console.log("vet2@pawmatch.com");

  console.log("");
  console.log("Adopters:");
  console.log("adopter1@pawmatch.com");
  console.log("adopter2@pawmatch.com");
  console.log("adopter3@pawmatch.com");
  console.log("adopter4@pawmatch.com");
  console.log("adopter5@pawmatch.com");

  console.log("========================================");
};

// ==================================================
// Run Seed
// ==================================================
const runSeed = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error(
        "MONGODB_URL is not defined in the .env file",
      );
    }

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("Database connected successfully");

    await clearPreviousSeedData();

    const users = await seedUsers();
    const shelters = await seedShelters(users);

    await seedEmployeeProfiles(users, shelters);
    await seedVetProfiles(users, shelters);
    await seedAdopterProfiles(users);

    const animals = await seedAnimals(users, shelters);

    const adoptionRequests =
      await seedAdoptionRequests(
        users,
        shelters,
        animals,
      );

    const vetAppointments =
      await seedVetAppointments(users);

    await seedReviews({
      users,
      shelters,
      adoptionRequests,
      vetAppointments,
    });

    await seedNotifications({
      users,
      animals,
      adoptionRequests,
      vetAppointments,
    });

    printLoginAccounts();
  } catch (error) {
    console.error("");
    console.error("Seed failed:", error.message);

    if (error.errors) {
      Object.values(error.errors).forEach(
        (validationError) => {
          console.error(
            `${validationError.path}: ${validationError.message}`,
          );
        },
      );
    }

    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("Database connection closed");
    }
  }
};

runSeed();