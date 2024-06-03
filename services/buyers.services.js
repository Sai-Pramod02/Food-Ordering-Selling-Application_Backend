const db = require('../db/db');
const mysql = require('mysql2/promise'); // Import the promise-based version

async function getSellers(params, callback) {
  const { community } = params;

  const query = `
    SELECT 
      s.seller_name AS name,
      s.seller_phone AS seller_phone,
      s.seller_rating AS rating,
      s.seller_photo AS photoUrl,
      i.item_name AS itemName,
      i.item_price AS price,
      i.item_desc AS description,
      i.item_quantity AS quantity,
      i.item_photo AS imageUrl, 
      i.item_del_start_timestamp,
      i.item_del_end_timestamp,
      i.item_id
    FROM 
      SELLER s
    JOIN 
      ITEMS i ON s.seller_phone = i.seller_phone 
    WHERE 
      s.community = ? 
      AND i.item_del_end_timestamp > CURRENT_TIMESTAMP 
      AND i.item_quantity > 0
      AND seller_membership_status = 1
  `;

  try {
    const [rows] = await db.promise().query(query, [community]);
    console.log(rows);
    const sellersWithItems = [];
    rows.forEach(row => {
      const { name, seller_phone, rating, photoUrl, itemName, price, description, quantity, imageUrl, item_del_start_timestamp, item_del_end_timestamp, item_id } = row;
      const itemData = { name: itemName, price, description, quantity, imageUrl, item_del_start_timestamp, item_del_end_timestamp, item_id, seller_phone };
      
      const existingSeller = sellersWithItems.find(seller => seller.seller_phone === seller_phone);
      if (existingSeller) {
        existingSeller.allItems.push(itemData);
      } else {
        const newSeller = {
          name,
          seller_phone,
          rating,
          photoUrl,
          allItems: [itemData]
        };
        sellersWithItems.push(newSeller);
      }
    });
    callback(null, sellersWithItems);
  } catch (error) {
    console.error('Error in getSellers:', error);
    callback(error, null);
  }
}

async function buyerRegistration(params, callback) {
  const { buyer_name, buyer_phone, buyer_address, community } = params;

  if (!buyer_name || !buyer_phone || !buyer_address || !community) {
    callback('All fields are required.', null);
    return;
  }

  const sql = 'INSERT INTO BUYER (buyer_name, buyer_phone, buyer_address, community) VALUES (?, ?, ?, ?)';
  try {
    await db.promise().query(sql, [buyer_name, buyer_phone, buyer_address, community]);
    callback(null, { status: 'Success', message: 'Buyer registered successfully' });
  } catch (err) {
    console.error('Error inserting data:', err);
    callback('Failed to register buyer.', null);
  }
}
 const getItemDetails = async (itemId) => {
  const [result] = await db.promise().query('SELECT * FROM ITEMS WHERE item_id = ?', [itemId]);
  return result[0]; // Return the first item (or undefined if not found)
};
module.exports = { getSellers ,buyerRegistration, getItemDetails };
