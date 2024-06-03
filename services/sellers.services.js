const db = require('../db/db');
const mysql = require('mysql2/promise'); // Import the promise-based version
const multer  = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads'); // File storage destination
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // File renaming to avoid duplicates
    }
});

const upload = multer({ storage: storage });

async function sellerRegistration(params, callback) {
    console.log(params);
    const { seller_name, seller_phone, seller_address, seller_upi, image, community, delivery_type } = params;
    
    if (!seller_name || !seller_phone || !seller_address || !seller_upi || !community || !delivery_type) {
        console.log("Missing fields");
        callback('All fields are required.', null);
        return;
    }

    try {

        const insertSellerQuery = 'INSERT INTO SELLER (seller_name, seller_phone, seller_address, seller_upi, seller_photo, seller_rating, seller_no_of_rating, seller_membership_status, community, delivery_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await db.promise().query(insertSellerQuery, [seller_name, seller_phone, seller_address, seller_upi, image, 0.0, 0, 1, community, delivery_type]);

        const updateBuyerQuery = 'UPDATE BUYER SET buyer_name = ?, buyer_address = ?, community = ? WHERE buyer_phone = ?';
        await db.promise().query(updateBuyerQuery, [seller_name, seller_address, community, seller_phone]);

        callback(null, { status: 'Success', message: 'Seller registered successfully' });
    } catch (err) {
        console.error('Error inserting data:', err);
        callback('Failed to register seller.', null);
    }
}

  

module.exports = { sellerRegistration };
