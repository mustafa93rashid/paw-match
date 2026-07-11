const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); 
const User = require("./models/user.js");

const MONGODB_URL = "mongodb://127.0.0.1:27017/pawmatch"; 

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB for seeding...");

        const adminEmail = "admin@pawmatch.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            
            const hashedPassword = await bcrypt.hash("Admin@12345", 10);

          
            await User.create({
                firstName: "Super",
                lastName: "Admin",
                email: adminEmail,
                password: hashedPassword,
                phone: "07700000000",          
                address: "Baghdad",        
                gender: "male",               
                dateOfBirth: new Date("2000-05-10"), 
                role: "superadmin" 
            });

            console.log("✅ [SUCCESS]: Super Admin created successfully.");
        } else {
            console.log("⚠️ [INFO]: Super Admin already exists. No action taken.");
        }

    } catch (error) {
        console.error("❌ [ERROR]: Seeding failed:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
};

seedSuperAdmin();