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


router.post('/', createShelter);
router.get('/', getAllShelters);
router.get('/:id', getShelterById);
router.put('/:id', updateShelter);
router.patch('/:id/verify', verifyShelter);
router.patch('/:id/activation', toggleActivation);
router.delete('/:id', deleteShelter);

module.exports = router;