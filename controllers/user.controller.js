const bcrypt = require("bcryptjs");
const userServices = require("../services/users.services");
const db = require('../db/db');

exports.otpLogin = (req, res, next) => {
    userServices.createOtp(req.body, (error, results) => {
            if(error){
                return next(error)
            }
            return res.status(200).send({
                message: "Success",
                data: results
            })
    });
};

exports.verifyOtp = (req, res, next) => {
    userServices.verifyOTP(req.body, (error, results) => {
      if (error) {
        return next(error);
      }
      return res.status(200).send({
        message: "Success",
        data: results,
      });
    });
  };

                         
exports.checkUserType = async (req, res, next) => {
    const phone = req.body.phone; 
    const playerId = req.body.playerId; // Get the playerId from the request body
    console.log("Phone number:", phone);
    console.log("Player ID:", playerId);

    try {
        const [sellerResults] = await db.promise().query('SELECT * FROM SELLER WHERE seller_phone = ?', [phone]);
        if (sellerResults.length > 0) {
            // Update the player_id in the SELLER table
            await db.promise().query('UPDATE SELLER SET player_id = ? WHERE seller_phone = ?', [playerId, phone]);
            await db.promise().query('UPDATE BUYER SET player_id = ? WHERE buyer_phone = ?', [playerId, phone]);
            return res.status(200).send({
                userType: "seller",
                community: sellerResults[0].community 
            });
        } else {
            const [buyerResults] = await db.promise().query('SELECT * FROM BUYER WHERE buyer_phone = ?', [phone]);
            if (buyerResults.length > 0) {
                // Update the player_id in the BUYER table
                await db.promise().query('UPDATE BUYER SET player_id = ? WHERE buyer_phone = ?', [playerId, phone]);
                return res.status(200).send({
                    userType: "buyer",
                    community: buyerResults[0].community 
                });
            } else {
                return res.status(200).send({
                    userType: "none",
                    community: null
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: "An error occurred while checking user type." });
    }
};
exports.getCommunities =  async (req, res, next) => {
  const sql = 'SELECT community_name FROM COMMUNITIES';
  try {
    const [rows] = await db.promise().query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).send('Failed to fetch communities.');
  }
}
exports.checkUserTypeWithoutPlayerid = (req, res, next) => {
    const phone = req.body.phone; // Get the phone number from the request body
    console.log(" phone number : ", phone);

    // Query the SELLER table
    db.query('SELECT * FROM SELLER WHERE seller_phone = ?', [phone], (error, sellerResults) => {
        if (error) {
            console.log(error);
            return res.status(500).send({ message: "An error occurred while checking user type." });
        }

        if (sellerResults.length > 0) {
            // If the phone number is found in the SELLER table, the user is a seller
            return res.status(200).send({
                userType: "seller",
                community: sellerResults[0].community // Assuming 'community' is a column in the SELLER table
            });
        } else {
            // If the phone number is not found in the SELLER table, check the BUYER table
            db.query('SELECT * FROM BUYER WHERE buyer_phone = ?', [phone], (error, buyerResults) => {
                if (error) {
                    console.log(error);
                    return res.status(500).send({ message: "An error occurred while checking user type." });
                }

                if (buyerResults.length > 0) {
                    // If the phone number is found in the BUYER table, the user is a buyer
                    return res.status(200).send({
                        userType: "buyer",
                        community: buyerResults[0].community // Assuming 'community' is a column in the BUYER table
                    });
                } else {
                    // If the phone number is not found in either table, the user doesn't exist
                    return res.status(200).send({
                        userType: "none",
                        community: null
                    });
                }
            });
        }
    });
};
