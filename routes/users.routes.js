const userController = require('../controllers/user.controller');
const pushNotifcationController = require('../controllers/push_notification.controller')
const express = require('express');
const router = express.Router();

router.post("/otpLogin", userController.otpLogin);
router.post("/verifyOTP", userController.verifyOtp);
router.post("/check-user-type", userController.checkUserType);
router.get("/communities", userController.getCommunities);
router.get("/SendNotification", pushNotifcationController.SendNotification);
router.post("/SendNotificationToDevice", pushNotifcationController.SendNotificationToDevice);
router.post("/check-user-type-withoutplayerid", userController.checkUserTypeWithoutPlayerid);
module.exports = router;
