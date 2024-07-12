const buyerController = require('../controllers/buyer.controller');

const express = require('express');
const router = express.Router();

router.get("/seller-with-items", buyerController.sellersWithItems);
router.post("/register-buyer", buyerController.buyerRegistration);
router.get("/by-community", buyerController.getSellersByCommunity);
router.get('/buyer/:phone', buyerController.getBuyerProfile);
router.put('/buyer/:phone', buyerController.updateBuyerProfile);
router.post('/placeOrder', buyerController.placeOrder);
router.get('/items/:itemId', buyerController.fetchItemDetails);
router.get('/orders/:phone', buyerController.getBuyerOrders);
router.post('/reviews/:orderId', buyerController.submitRatingAndReview);
router.post('/orderStatus', buyerController.updateOrderStatus);



module.exports = router;
