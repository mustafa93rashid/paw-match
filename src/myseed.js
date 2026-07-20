// ==================================================================
// seed2.js
// --------------------------------------------------------------
// يزرع بيانات أساسية جاهزة للاختبار مباشرة عبر Postman:
//   1) Super Admin              -> admin@pawmatch.com
//   2) Shelter Employee (User)  -> shelter.employee@pawmatch.com
//   3) Shelter (Approved+Active) مرتبط بالموظف
//   4) حيوانين (Luna و Max) تابعين لنفس الملجأ

// تشغيل:  node src/seed2.js
// ==================================================================

const mongoose = require("mongoose");

const User = require("./models/User.js");
const Shelter = require("./models/Shelter.js");
const ShelterEmployeeProfile = require("./models/ShelterEmployeeProfile.js");
const Animal = require("./models/Animal.js");

const passwordService = require("./utils/passwordService");

const MONGODB_URL = "mongodb://127.0.0.1:27017/pawmatch";

// ==================================================================
//  Super Admin
// ==================================================================
const seedSuperAdmin = async () => {
  // ملاحظة: نفس القيم المستخدمة كـ default في كوليكشن Postman
  // (superAdminEmail / superAdminPassword) عشان تشتغل من غير أي تعديل يدوي
  const adminEmail = "superadmin@pawmatch.com";

  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    const hashedPassword = await passwordService.hash("SuperAdminP@ss1");

    admin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: adminEmail,
      password: hashedPassword,
      phone: "07700000000",
      address: "Baghdad",
      gender: "male",
      dateOfBirth: new Date("2000-05-10"),
      role: "superadmin",
      isActive: true,
    });

    console.log(" Super Admin created:", admin.email);
  } else {
    console.log(" Super Admin already exists:", admin.email);
  }

  return admin;
};

// ==================================================================
//  Shelter Employee (User + ShelterEmployeeProfile)
// ==================================================================
const seedShelterEmployee = async () => {
  const employeeEmail = "shelter.employee@pawmatch.com";

  let employee = await User.findOne({ email: employeeEmail });

  if (!employee) {
    const hashedPassword = await passwordService.hash("ShelterEmpP@ss1");

    employee = await User.create({
      firstName: "Sara",
      lastName: "ShelterStaff",
      email: employeeEmail,
      password: hashedPassword,
      phone: "07700000001",
      address: "Baghdad",
      gender: "female",
      dateOfBirth: new Date("1995-03-15"),
      role: "shelterEmployee",
      isActive: true,
    });

    console.log("Shelter Employee user created:", employee.email);
  } else {
    console.log(" Shelter Employee user already exists:", employee.email);
  }

  let profile = await ShelterEmployeeProfile.findOne({ userId: employee._id });

  if (!profile) {
    profile = await ShelterEmployeeProfile.create({
      userId: employee._id,
      position: "Manager",
      employeeNumber: "EMP-0001",
      hireDate: new Date("2024-01-01"),
      isActive: true,
    });

    console.log("ShelterEmployeeProfile created for:", employee.email);
  } else {
    console.log("  ShelterEmployeeProfile already exists for:", employee.email);
  }

  return { employee, profile };
};

// ==================================================================
//  Shelter (approved + active), linked to the employee above
// ==================================================================
const seedShelter = async ({ employee, profile }) => {
  const shelterEmail = "contact@hopepaws.org";

  let shelter = await Shelter.findOne({ email: shelterEmail });

  if (!shelter) {
    shelter = await Shelter.create({
      name: "Hope Paws Shelter",
      email: shelterEmail,
      phone: "+9647700000002",
      description:
        "A community shelter dedicated to rescuing and rehoming stray dogs and cats.",
      address: "123 Al-Manara Street",
      city: "Baghdad",
      latitude: 33.3152,
      longitude: 44.3661,
      location: {
        type: "Point",
        coordinates: [44.3661, 33.3152], // [lng, lat]
      },
      supportedSpecies: ["dog", "cat"],
      capacity: 50,
      operatingHours: { open: "08:00", close: "18:00" },
      socialLinks: {
        facebook: "https://facebook.com/hopepaws",
        instagram: "https://instagram.com/hopepaws",
        website: "https://hopepaws.org",
      },
      employees: [employee._id],
      createdBy: employee._id,

      // مباشرة معتمدة ونشطة عشان تظهر فوراً في listing العام
      // (بدل ما تعدي على فلو approve/reject يدوي)
      verificationStatus: "approved",
      isVerified: true,
      isActive: true,
      verifiedBy: employee._id,
      verifiedAt: new Date(),
    });

    console.log(" Shelter created:", shelter.name);
  } else {
    console.log("Shelter already exists:", shelter.name);
  }

  // اربط بروفايل الموظف بالملجأ لو مش مربوط
  if (!profile.shelterId) {
    profile.shelterId = shelter._id;
    await profile.save();
    console.log("Linked employee profile to shelter");
  }

  return shelter;
};

// ==================================================================
//  حيوانين تابعين للملجأ
// ==================================================================
const seedAnimals = async ({ shelter, employee }) => {
  const animalsToSeed = [
    {
      name: "Luna",
      age: 2,
      ageUnit: "years",
      species: "dog",
      breed: "Labrador Mix",
      gender: "female",
      size: "medium",
      color: "Golden",
      healthStatus: "healthy",
      vaccinated: true,
      description: "Friendly and playful, great with kids.",
      requirements: {
        homeType: "any",
        suitableForKids: true,
        goodWithOtherPets: true,
        experienceLevel: "any",
        dailyActivityLevel: "medium",
        ownerType: "any",
        isAllergic: false,
      },
    },
    {
      name: "Max",
      age: 4,
      ageUnit: "years",
      species: "cat",
      breed: "Domestic Shorthair",
      gender: "male",
      size: "small",
      color: "Black and White",
      healthStatus: "needsCare",
      vaccinated: false,
      description: "A calm and affectionate cat looking for a quiet home.",
      requirements: {
        homeType: "apartment",
        suitableForKids: true,
        goodWithOtherPets: false,
        experienceLevel: "beginner",
        dailyActivityLevel: "low",
        ownerType: "any",
        isAllergic: false,
      },
    },
  ];

  const createdAnimals = [];

  for (const animalData of animalsToSeed) {
    let animal = await Animal.findOne({
      name: animalData.name,
      shelterId: shelter._id,
    });

    if (!animal) {
      animal = await Animal.create({
        ...animalData,
        shelterId: shelter._id,
        addedBy: employee._id,
      });

      console.log("Animal created:", animal.name);
    } else {
      console.log(" Animal already exists:", animal.name);
    }

    createdAnimals.push(animal);
  }

  return createdAnimals;
};

// ==================================================================
// Main
// ==================================================================
const main = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("MongoDB connected");

    const admin = await seedSuperAdmin();
    const { employee, profile } = await seedShelterEmployee();
    const shelter = await seedShelter({ employee, profile });
    const animals = await seedAnimals({ shelter, employee });

    console.log("\n================ SEED SUMMARY ================");
    console.log("Super Admin       :", admin.email, "/ SuperAdminP@ss1");
    console.log("Shelter Employee  :", employee.email, "/ ShelterEmpP@ss1");
    console.log("Shelter           :", shelter.name, `(${shelter._id})`);
    console.log(
      "Animals           :",
      animals.map((a) => `${a.name} (${a._id})`).join(", "),
    );
    console.log("================================================\n");

    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

main();