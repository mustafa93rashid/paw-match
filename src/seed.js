const mongoose = require("mongoose");
const User = require("./models/User.js");
const passwordService = require("./utils/passwordService");


const MONGODB_URL = "mongodb://127.0.0.1:27017/pawmatch";

const seedSuperAdmin = async () => {
  const adminEmail = "admin@pawmatch.com";

  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    const hashedPassword = await passwordService.hash("Admin@12345");


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
    });

    console.log("Super Admin created");
  } else {
    console.log(" Admin already exists");
  }

  return admin; 
};
const main = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("MongoDB connected");

    const admin = await seedSuperAdmin();

    console.log(admin.email);

    await mongoose.disconnect();
    console.log("MongoDB disconnected");

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main();