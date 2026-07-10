const express = require('express');
const router = express.Router();
const animalController = require("../controllers/animal.controller");
const asyncHandler = require("../utils/asyncHandler");
const role = require('../middlewares/role');
const auth = require('../middlewares/auth');

// 1. create Animal
router.post('/' ,[auth ,role(['shelterEmployee', 'superadmin'])], asyncHandler(animalController.createAnimal));

// 2. Get All Animals
router.get('/',[auth] , asyncHandler(animalController.getAll));

// 3. Get Animal By ID
router.get('/:id' ,[auth] , asyncHandler(animalController.getOne));
 
// 4. Update Animal
router.put('/:id',[auth ,role(['shelterEmployee', 'superadmin'])], asyncHandler(animalController.updateAnimal));

// 5. Delete Animal 
router.delete('/:id',[auth ,role(['shelterEmployee', 'superadmin'])], asyncHandler(animalController.removeAnimal));

module.exports = router;
