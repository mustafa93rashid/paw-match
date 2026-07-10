const express = require('express');
const router = express.Router();
const {
    createShelter,
    getAllShelters,
    getShelterById,
    updateShelter,
    verifyShelter,
    toggleActivation,
    deleteShelter
} = require('../controllers/shelter.controller');



router.patch('/:id/activation', toggleActivation);
router.delete('/:id', deleteShelter);

module.exports = router;