const sellerController = require('../controllers/seller.controller');

const express = require('express');
const router = express.Router();

router.post("/register-seller", sellerController.sellerRegister);
router.post("/items", sellerController.addItem);
router.get("/items", sellerController.getItems);
router.post("/updateItem/:itemId", sellerController.updateItem);
router.get('/seller/:phone', sellerController.getSellerProfile);
router.put('/seller/:phone', sellerController.updateSellerProfile);
router.get('/orders/:phone', sellerController.getOrdersForSeller);
router.put('/orders/:orderId/delivered', sellerController.markOrderAsDelivered);
router.get('/orders/items/:orderId', sellerController.getOrderItems);
router.post('/orders/delivery-type/:orderId', sellerController.updateOrderDeliveryType);
router.get('/membershipStatus', sellerController.checkMembershipStatusSeller);
router.get('/reviews/:sellerPhone', sellerController.getSellerReviews);
router.post('/renewMembership', sellerController.renewMembership);
router.put('/orders/cancel/:orderId', sellerController.cancelOrder);




module.exports = router;
