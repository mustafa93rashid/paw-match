const User = require("../models/User");
//const { stripPassword } = require("../utils/userHelpers");

class UsersController {
  
    getAll = async (req, res) => {
        const users = await User.find({}).select("-password");
        res.status(200).json({ 
            success: true,  
            data: users });
    };

    getOne = async (req, res) => {
        const id = req.params.id;
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        res.status(200).json({ 
             success : true,
             data: user });
    };

   
    updateRole = async (req, res) => {
         const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                  success: false,  
                  message: "User Not Found" });
        }

        const { role } = req.body;
        
        // التحقق من أن القيمة المرسلة مسموحة ضمن الـ Enums المتفق عليها
        const allowedRoles = ['superadmin', 'shelterEmployee', 'vet', 'adopter'];
        if (role !== undefined && allowedRoles.includes(role)) {
            user.role = role;
        } else  {
            return res.status(400).json({
                success: false,  
                message: "Invalid role" });
        }

        await user.save();
        res.status(200).json({ 
            success: true,  
            message: "User role updated successfully",
            data:  {
                "_id" : user.id ,
                "role" : user.role }  } );
    };


    remove = async (req, res) => {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User Not Found" });
        }

        // prevent Superadmin from deleting their own account
        if (req.user.id === id) {
            return res.status(400).json({ 
                success: false, 
                message: "Security error: You cannot delete your own admin account" });
        }
        await Promise.all([
            User.findByIdAndDelete(id),
        ]);

        res.status(200).json({
            success: true,
            message: "User deleted successfully" });
    };
}

module.exports = new UsersController();