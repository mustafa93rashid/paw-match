const express = require('express');
const router = express.Router();
const userController = require("../controllers/user.controller");
const asyncHandler = require("../utils/asyncHandler");
const role = require("../middlewares/role");
const auth = require("../middlewares/auth");

router.get("/profile", [auth], asyncHandler(userController.profile));

router.put("/profile", [auth], asyncHandler(userController.updateProfile));

router.get('/', [auth, role(["superadmin"])], asyncHandler(userController.getAll));

router.get('/:id' , [auth, role(["superadmin"])], asyncHandler(userController.getOne));
 
router.put('/:id/role', [auth, role(["superadmin"])], asyncHandler(userController.updateRole));

router.put("/:id/status", [auth, role(["superadmin"])], asyncHandler(userController.updateStatus));



module.exports = router;