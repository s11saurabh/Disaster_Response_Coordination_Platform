const express = require('express');
const disasterController = require('../controllers/disaster');
const geocodingController = require('../controllers/geocoding');
const socialMediaController = require('../controllers/socialMedia');
const browseController = require('../controllers/browse');
const resourcesController = require('../controllers/resources');
const verificationController = require('../controllers/verification');
const { auth } = require('../middleware/auth');
const { apiLimiter, createLimiter, verificationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(apiLimiter);

router.post('/disasters', createLimiter, auth, disasterController.createDisaster);
router.get('/disasters', disasterController.getDisasters);
router.get('/disasters/:id', disasterController.getDisasterById);
router.put('/disasters/:id', auth, disasterController.updateDisaster);
router.delete('/disasters/:id', auth, disasterController.deleteDisaster);

router.post('/geocode', geocodingController.geocodeLocation);

router.get('/disasters/:id/social-media', socialMediaController.getSocialMediaReports);
router.get('/mock-social-media', socialMediaController.getMockSocialMedia);

router.get('/disasters/:id/resources', resourcesController.getNearbyResources);
router.post('/disasters/:id/resources', auth, resourcesController.createResource);

router.get('/disasters/:id/official-updates', browseController.getOfficialUpdates);
router.get('/official-updates/sources', browseController.getAvailableSources);
router.get('/official-updates/category/:category', browseController.getUpdatesByCategory);
router.get('/official-updates/search', browseController.searchAllUpdates);

router.post('/disasters/:id/verify-image', verificationLimiter, auth, verificationController.verifyImage);

router.post('/disasters/:id/reports', createLimiter, auth, disasterController.createReport);
router.get('/disasters/:id/reports', disasterController.getReports);

module.exports = router;