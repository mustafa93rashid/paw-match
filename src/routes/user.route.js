const express = require('express');
const router = express.Router();
const userController = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");

// 1. Get All Users
router.get('/', asyncHandler(userController.getAll));

// 2. Get User By ID
router.get('/:id' , asyncHandler(userController.getOne));
 
// 3. Update User Role 
router.put('/:id/role', asyncHandler(userController.updateRole));

// 4. Delete User 
router.delete('/:id', asyncHandler(userController.remove));

module.exports = router;