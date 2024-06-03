const userController = require('../controllers/user.controller');

const express = require('express');
const router = express.Router();

router.post("/otpLogin", userController.otpLogin);
router.post("/verifyOTP", userController.verifyOtp);
router.post("/check-user-type", userController.checkUserType);
router.get("/communities", userController.getCommunities);

module.exports = router;