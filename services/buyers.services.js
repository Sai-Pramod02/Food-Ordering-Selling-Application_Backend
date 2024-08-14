const db = require('../db/db');
const mysql = require('mysql2/promise'); // Import the promise-based version

async function getSellers(params, callback) {
console.log("Reached getSellers");
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
      i.item_id,
      i.order_end_date,
      s.membership_end_date,
      s.fssai_code
    FROM 
      SELLER s
    JOIN 
      ITEMS i ON s.seller_phone = i.seller_phone 
    WHERE 
  s.community = ? 
  AND i.order_end_date > CONVERT_TZ(CURRENT_TIMESTAMP, 'SYSTEM', 'Asia/Kolkata')
  AND i.item_quantity > 0
  AND s.membership_end_date > CONVERT_TZ(CURRENT_TIMESTAMP, 'SYSTEM', 'Asia/Kolkata')
  `;

  try {
    const [rows] = await db.promise().query(query, [community]);
    const sellersWithItems = [];
    rows.forEach(row => {
      const { name, seller_phone, rating, photoUrl, itemName, price, description, quantity, imageUrl, item_del_start_timestamp, item_del_end_timestamp, item_id, order_end_date, fssai_code } = row;
      const itemData = { name: itemName, price, description, quantity, imageUrl, item_del_start_timestamp, item_del_end_timestamp, item_id, seller_phone, order_end_date };
console.log(itemData);      
      const existingSeller = sellersWithItems.find(seller => seller.seller_phone === seller_phone);
      if (existingSeller) {
        existingSeller.allItems.push(itemData);
      } else {
        const newSeller = {
          name,
          seller_phone,
          rating,
          photoUrl,
	 fssai_code,
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
  const { buyer_name, buyer_phone, buyer_address, community, player_id } = params;

  if (!buyer_name || !buyer_phone || !buyer_address || !community || !player_id) {
    callback('All fields are required.', null);
    return;
  }

  const sql = 'INSERT INTO BUYER (buyer_name, buyer_phone, buyer_address, community, player_id) VALUES (?, ?, ?, ?, ?)';
  try {
    await db.promise().query(sql, [buyer_name, buyer_phone, buyer_address, community, player_id]);
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
