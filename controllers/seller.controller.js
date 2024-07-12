const express = require('express');
const multer = require('multer');
const path = require('path');
const sellerServices = require('../services/sellers.services');
const db = require('../db/db');
const moment = require('moment-timezone');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // File storage destination
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // File renaming to avoid duplicates
    }
});


const checkMembershipStatus = async (req, res, next) => {
     console.log("Checking for membership status");
    const phone = req.query.phone;
    try {
        const [seller] = await db.promise().query('SELECT membership_end_date FROM SELLER WHERE seller_phone = ?', [phone]);
	console.log("Queried");
        if (seller.length > 0) {
	console.log("Selle length is greater than 0"); 
           const membershipEndDate = moment(seller[0].membership_end_date);
		console.log(membershipEndDate);
            const currentDate = moment();
            if (currentDate.isAfter(membershipEndDate)) {
		console.log("Membership expired");
                return res.status(403).json({message :'Membership expired'});
            }
		console.log("hey there");
            next();
        } else {
		console.log("Seller not found");
            res.status(404).send('Seller not found');
        }
    } catch (error) {
        console.log('Error', error);
        res.status(500).send('Failed to check membership status');
    }
};

exports.checkMembershipStatusSeller = async (req, res, nexr) => {
const phone = req.query.phone;
    try {
        const [seller] = await db.promise().query('SELECT membership_end_date FROM SELLER WHERE seller_phone = ?', [phone]);
        if (seller.length > 0) {
            const membershipEndDate = moment(seller[0].membership_end_date);
            const currentDate = moment();
            if (currentDate.isAfter(membershipEndDate)) {
                return res.status(403).json({message :'Membership expired'});
            }
            else{
		console.log("Active Membership");
                return res.status(200).json({message : "Membership active"});
            }
            next();
        } else {
            res.status(404).send('Seller not found');
        }
    } catch (error) {
        console.log('Error checking membership status:', error);
        res.status(500).send('Failed to check membership status');
    }}
const upload = multer({ storage: storage });

exports.sellerRegister = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return next(err);
        }

        const params = {
            seller_name: req.body.seller_name,
            seller_phone: req.body.seller_phone,
            seller_address: req.body.seller_address,
            seller_upi: req.body.seller_upi,
            image: req.file ? req.file.filename : null,
            community: req.body.community,
            delivery_type: req.body.delivery_type,
            membership_duration : req.body.membership_duration
        };

        sellerServices.sellerRegistration(params, (error, results) => {
            if (error) {
                return next(error);
            }
            return res.status(200).json(results);
        });
    });
};
exports.addItem = [checkMembershipStatus,  (req, res, next) => {
    console.log("Add item hit");
    upload.single('item_photo')(req, res, async (err) => {
        if (err) {
            return next(err);
        }

        const itemData = {
            seller_phone: req.body.seller_phone,
            item_name: req.body.item_name,
            item_desc: req.body.item_desc,
            item_quantity: req.body.item_quantity,
            item_price: req.body.item_price,
            item_photo: req.file ? req.file.filename : null,
            item_del_start_timestamp: req.body.item_del_start_timestamp,
            item_del_end_timestamp: req.body.item_del_end_timestamp,
	    order_end_date : req.body.order_end_date
        };

        // Ensure all required fields are present
        const { seller_phone, item_name, item_desc, item_quantity, item_price, item_del_start_timestamp } = itemData;
        if (!seller_phone || !item_name || !item_desc || !item_quantity || !item_price || !item_del_start_timestamp) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Add item data to the database
        try {
            const sql = 'INSERT INTO ITEMS (seller_phone, item_name, item_desc, item_quantity, item_price, item_photo, item_del_start_timestamp, item_del_end_timestamp, order_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            await db.promise().query(sql, [seller_phone, item_name, item_desc, item_quantity, item_price, itemData.item_photo, item_del_start_timestamp, itemData.item_del_end_timestamp, itemData.order_end_date]);
            return res.status(201).json({ status: 'Success', message: 'Item added successfully' });
        } catch (error) {
            console.log(error);
            return next(error);
        }
    });
}];

exports.updateItem = [checkMembershipStatus, (req, res, next) => {
    upload.single('item_photo')(req, res, async (err) => {
        const itemId = req.params.itemId;
        
        if (err) {
            return next(err);
        }

        const itemData = {
            item_name: req.body.item_name,
            item_desc: req.body.item_desc,
            item_quantity: req.body.item_quantity,
            item_price: req.body.item_price,
            item_photo: req.file ? req.file.filename : null,
            item_del_start_timestamp: req.body.item_del_start_timestamp,
            item_del_end_timestamp: req.body.item_del_end_timestamp,
	   order_end_date : req.body.order_end_date
        };

        // Ensure all required fields are present
        const { item_name, item_desc, item_quantity, item_price, item_del_start_timestamp, item_del_end_timestamp, order_end_date } = itemData;
        if (!item_name || !item_desc || !item_quantity || !item_price || !item_del_start_timestamp || !item_del_end_timestamp) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Update item data in the database
        try {
            const fields = [
                'item_name = ?',
                'item_desc = ?',
                'item_quantity = ?',
                'item_price = ?',
                'item_del_start_timestamp = ?',
                'item_del_end_timestamp = ?',
		'order_end_date = ?'
            ];
            const values = [item_name, item_desc, item_quantity, item_price, item_del_start_timestamp, item_del_end_timestamp, order_end_date];

            if (itemData.item_photo) {
                fields.push('item_photo = ?');
                values.push(itemData.item_photo);
            }

            values.push(itemId);

            const sql = `UPDATE ITEMS SET ${fields.join(', ')} WHERE item_id = ?`;
            await db.promise().query(sql, values);

            return res.status(200).json({ status: 'Success', message: 'Item updated successfully' });
        } catch (error) {
            console.log(error);
            return next(error);
        }
    });
}]


exports.getItems =  [checkMembershipStatus,async (req, res, next) => {
    const sellerPhone = req.query.phone;

    if (!sellerPhone) {
        return res.status(400).json({ error: 'Missing seller phone number' });
    }

    try {
        const [rows] = await db.promise().query('SELECT *, IFNULL(item_photo, "https://i.imgur.com/bOCEVJg.png") as item_photo FROM ITEMS WHERE seller_phone = ?', [sellerPhone]);
    
        return res.json(rows);
    } catch (error) {
        return next(error);
    }
}];


exports.getSellerProfile =   async(req, res, next) => {
    const phone = req.params.phone;
    try {
        const [seller] = await db.promise().query('SELECT seller_name, seller_phone, seller_address, seller_upi, community, delivery_type, membership_end_date FROM SELLER WHERE seller_phone = ?', [phone]);
        if (seller.length > 0) {
            res.status(200).json(seller[0]);
        } else {
            res.status(404).send('Seller not found');
        }
    } catch (error) {
        console.error('Error fetching seller profile:', error);
        res.status(500).send('Failed to fetch seller profile');
    }
};

exports.updateSellerProfile = async (req, res, next) => {
    const phone = req.params.phone;
    const { seller_name, seller_address, seller_upi, community, delivery_type } = req.body;
    try {

        const [seller] = await db.promise().query('UPDATE SELLER SET seller_name = ?, seller_address = ?, seller_upi = ?, community = ?, delivery_type = ? WHERE seller_phone = ?',
        [seller_name, seller_address, seller_upi, community, delivery_type, phone]);
        const [buyer] = await db.promise().query('UPDATE BUYER SET buyer_name = ?, buyer_address = ?, community = ? WHERE buyer_phone = ?',
        [seller_name, seller_address, community, phone]);


        res.status(200).send('Seller profile updated successfully');
    } catch (error) {
        console.error('Error updating seller profile:', error);
        res.status(500).send('Failed to update seller profile');
    }
};


// Fetch all orders for a specific seller
exports.getOrdersForSeller = [checkMembershipStatus, async (req, res, next) => {
	
    const sellerPhone = req.params.phone;
    try {
        const [orders] = await db.promise().query(
            'SELECT o.order_id, o.buyer_phone, o.order_total_price, b.buyer_name, b.buyer_address, o.order_delivered, o.delivery_type FROM ORDERS o JOIN BUYER b ON o.buyer_phone = b.buyer_phone WHERE o.seller_phone = ? AND o.order_completed = 1',
            [sellerPhone]
        );

        res.status(200).json(orders);
    } catch (error) {
        console.log('Error fetching orders for seller:', error);
        res.status(500).send('Failed to fetch orders for seller');
    }
}];

// Fetch order items for a specific order
exports.getOrderItems =  [checkMembershipStatus, async(req, res, next) => {
	console.log("Reached get order Items");
    const orderId = req.params.orderId;

    try {
        const [orderItems] = await db.promise().query(
            'SELECT oi.item_id, i.item_name, oi.item_quantity, i.item_price, i.order_end_date FROM ORDER_ITEMS oi JOIN ITEMS i ON oi.item_id = i.item_id WHERE oi.order_id = ?',
            [orderId]
        );
        res.status(200).json(orderItems);
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).send('Failed to fetch order items');
    }
}];

// Mark an order as delivered
exports.markOrderAsDelivered =  [checkMembershipStatus, async(req, res, next) => {
    const orderId = req.params.orderId;

    try {
        await db.promise().query(
            'UPDATE ORDERS SET order_delivered = 1 WHERE order_id = ?',
            [orderId]
        );
        res.status(200).send('Order marked as delivered');
    } catch (error) {
        console.error('Error marking order as delivered:', error);
        res.status(500).send('Failed to mark order as delivered');
    }
}];

exports.updateOrderDeliveryType =  [checkMembershipStatus, async(req, res, next) => {
    const orderId = req.params.orderId;
    const { delivery_type } = req.body;

    try {
        await db.promise().query(
            'UPDATE ORDERS SET delivery_type = ? WHERE order_id = ?',
            [delivery_type, orderId]
        );
        res.status(200).send('Delivery type updated successfully');
    } catch (error) {
        console.error('Error updating delivery type:', error);
        res.status(500).send('Failed to update delivery type');
    }
}];

exports.getSellerReviews = (req, res) => {
    const sellerPhone = req.params.sellerPhone;
    const query = 'SELECT order_rating, order_review FROM REVIEWS WHERE seller_phone = ? AND order_rating > 0';
    db.query(query, [sellerPhone], (error, results) => {
        if (error) return res.status(500).json({ error });
        res.status(200).json(results);
    });
};
  exports.renewMembership = async (req, res, next) => {
    console.log("Reached renew membership");
    const { phone, months } = req.body;
  
    try {
      // Get the current membership end date
      const [rows] = await db.promise().query('SELECT membership_end_date FROM SELLER WHERE seller_phone = ?', [phone]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Seller not found' });
      }
  
      const currentEndDate = moment(rows[0].membership_end_date);
      const now = moment();
  
      let newEndDate;
      if (currentEndDate.isAfter(now)) {
        newEndDate = currentEndDate.add(months, 'months').format('YYYY-MM-DD HH:mm:ss');
      } else {
        newEndDate = now.add(months, 'months').format('YYYY-MM-DD HH:mm:ss');
      }
  
      const [result] = await db.promise().query(
        'UPDATE SELLER SET membership_end_date = ? WHERE seller_phone = ?',
        [newEndDate, phone]
      );
  
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Membership renewed successfully' });
      } else {
        res.status(404).json({ message: 'Seller not found' });
      }
    } catch (error) {
      console.error('Error renewing membership:', error);
      res.status(500).json({ message: 'Failed to renew membership' });
    }
  };
  
exports.cancelOrder = async (req, res, next) => {
    const orderId = req.params.orderId;
    console.log(orderId);
    try {
        await db.promise().query(
            'UPDATE ORDERS SET order_cancelled = 1 WHERE order_id = ?',
            [orderId]
        );
        res.status(200).send('Order marked as cancelled');
    } catch (error) {
        console.error('Error marking order as cancelled:', error);
        res.status(500).send('Failed to mark order as cancelled');
    }
};

