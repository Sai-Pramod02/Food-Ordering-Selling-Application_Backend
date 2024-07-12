const buyerServices = require('../services/buyers.services');
const db = require('../db/db');

exports.sellersWithItems = (req, res, next) => {
    buyerServices.getSellers(req.body, (error, results) => {
        if(error){
            return next(error)
        }
        return res.json(results);
    })
}
exports.getSellersByCommunity = (req, res, next) => {
    const { community } = req.query;

  buyerServices.getSellers({ community }, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(result);
    }
  });
}
exports.buyerRegistration = (req, res, next) => {
    buyerServices.buyerRegistration(req.body, (err, result) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json(result);
        }
      });
}

exports.getBuyerProfile = async (req, res, next) => {
    const phone = req.params.phone;
    try {
        const [buyer] = await db.promise().query('SELECT * FROM BUYER WHERE buyer_phone = ?', [phone]);
        if (buyer.length > 0) {
            res.status(200).json(buyer[0]);
        } else {
            res.status(404).send('Buyer not found');
        }
    } catch (error) {
        console.error('Error fetching buyer profile:', error);
        res.status(500).send('Failed to fetch buyer profile');
    }
};

exports.updateBuyerProfile = async (req, res, next) => {
    const phone = req.params.phone;
    const { buyer_name, buyer_address, community } = req.body;

    try {

        await db.promise().query(
            'UPDATE BUYER SET buyer_name = ?, buyer_address = ?, community = ? WHERE buyer_phone = ?',
            [buyer_name, buyer_address, community, phone]
        );

        await db.promise().query(
            'UPDATE SELLER SET seller_name = ?, seller_address = ?, community = ? WHERE seller_phone = ?',
            [buyer_name, buyer_address, community, phone]
        );

        res.status(200).send('Buyer profile updated successfully');
    } catch (error) {
        console.error('Error updating buyer profile:', error);
        res.status(500).send('Failed to update buyer profile');
    } 
};

exports.placeOrder = async (req, res, next) => {
    console.log("Received placeOrder");
    const { buyer_phone, buyer_role, seller_phone, items } = req.body; // items is an array of {item_id, quantity}
    
    let order_total_price = 0;

    try {
        console.log(buyer_role);
        // Validate buyer_phone
        let buyerQuery = '';
        if (buyer_role === 'buyer') {
            buyerQuery = 'SELECT buyer_phone FROM BUYER WHERE buyer_phone = ?';
            const [buyerResult] = await db.promise().query(buyerQuery, [buyer_phone]);
        if (buyerResult.length === 0) {
            console.log("Buyer does not exist")
            return res.status(400).send('Buyer does not exist');
        }
        } else if (buyer_role === 'seller') {
        const [sellerResult] = await db.promise().query('SELECT seller_phone FROM SELLER WHERE seller_phone = ?', [seller_phone]);
        if (sellerResult.length === 0) {
            console.log("seller does not exist")
            return res.status(400).send('Seller does not exist');
        }
        } else {
            console.log("Invalid buyer role")
            return res.status(400).send('Invalid buyer role');
        }

        

        // Validate seller_phone
        console.log(seller_phone);
        

        // Calculate total price
        for (const item of items) {
            const [result] = await db.promise().query('SELECT item_price FROM ITEMS WHERE item_id = ?', [item.item_id]);
            if (result.length > 0) {
                console.log(item);
                order_total_price += result[0].item_price * item.quantity;
            } else {
                console.log(`Item with id ${item.item_id} does not exist`)
                return res.status(400).send(`Item with id ${item.item_id} does not exist`);
            }
        }
        
        // Insert into ORDERS table
        const [orderResult] = await db.promise().query(
            'INSERT INTO ORDERS (buyer_phone, buyer_role, seller_phone, order_total_price, order_completed, order_delivered) VALUES (?, ?, ?, ?, 0, 0)',
            [buyer_phone, buyer_role, seller_phone, order_total_price]
        );

        const order_id = orderResult.insertId;

        // Insert into ORDER_ITEMS table
        for (const item of items) {
            await db.promise().query(
                'INSERT INTO ORDER_ITEMS (order_id, item_id, item_quantity) VALUES (?, ?, ?)',
                [order_id, item.item_id, item.quantity]
            );

            // Update item quantity in ITEMS table
            await db.promise().query(
                'UPDATE ITEMS SET item_quantity = item_quantity - ? WHERE item_id = ?',
                [item.quantity, item.item_id]
            );
        }
        res.status(200).json({order_id : order_id});
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Failed to place order');
    }
};

exports.fetchItemDetails = async (req, res, next) => {
    const { itemId } = req.params;
    try {
        const itemDetails = await buyerServices.getItemDetails(itemId);
        if (itemDetails) {
            res.status(200).json(itemDetails);
        } else {
            res.status(404).send('Item not found');
        }
    } catch (error) {
        console.error('Error fetching item details:', error);
        res.status(500).send('Failed to fetch item details');
    }
};

exports.getBuyerOrders = async (req, res, next) => {
    const buyerPhone = req.params.phone;
    if (!buyerPhone) {
        return res.status(400).json({ error: 'Missing buyer phone number' });
    }

    try {
        const [orders] = await db.promise().query(
            `SELECT o.*, s.seller_name, r.order_rating as order_rating, r.order_review as order_review
             FROM ORDERS o
             JOIN SELLER s ON o.seller_phone = s.seller_phone
             LEFT JOIN REVIEWS r ON o.order_id = r.order_id
             WHERE o.buyer_phone = ?`,
            [buyerPhone]
        );
        console.log(orders);
        return res.json(orders);
    } catch (error) {
        console.log(error);
        return next(error);
    }
};

exports.submitRatingAndReview = (req, res) => {
    const orderId = req.params.orderId;
    const { seller_phone, rating, review } = req.body;

    const insertReviewQuery = 'INSERT INTO REVIEWS (order_id, seller_phone, order_rating, order_review) VALUES (?, ?, ?, ?)';
    const getSellerQuery = 'SELECT seller_rating, seller_no_of_rating FROM SELLER WHERE seller_phone = ?';
    const updateSellerQuery = 'UPDATE SELLER SET seller_rating = ?, seller_no_of_rating = ? WHERE seller_phone = ?';

    db.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: err });

        db.query(insertReviewQuery, [orderId, seller_phone, rating, review], (err) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ error: err }));
            }

            db.query(getSellerQuery, [seller_phone], (err, results) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: err }));
                }

                let currentRating = results[0].seller_rating;
                let currentNoOfRating = results[0].seller_no_of_rating;

                if (currentRating === null || currentNoOfRating === 0) {
                    currentRating = 0;
                    currentNoOfRating = 0;
                }

                const newNoOfRating = currentNoOfRating + 1;
                let newRating = ((currentRating * currentNoOfRating) + rating) / newNoOfRating;

                // Ensure the newRating does not exceed the bounds of 5
                if (newRating > 5) {
                    newRating = 5;
                } else if (newRating < 0) {
                    newRating = 0;
                }

                db.query(updateSellerQuery, [newRating.toFixed(2), newNoOfRating, seller_phone], (err) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ error: err }));
                    }
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ error: err }));
                        }
                        res.status(200).json({ message: 'Review submitted successfully!' });
                    });
                });
            });
        });
    });
};

exports.updateOrderStatus = async (req, res, next) => {
    const { order_id, order_completed } = req.body;

    try {
        const [result] = await db.promise().query(
            'UPDATE ORDERS SET order_completed = ? WHERE order_id = ?',
            [order_completed, order_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Order not found');
        }

        res.status(200).send('Order status updated successfully');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Failed to update order status');
    }
};
