const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const { Body } = require("twilio/lib/twiml/MessagingResponse");
const { format } = require("path");
require('dotenv').config()
const accountSid = 'ACa47aabfd14049b34b5159006ed560bb5';
const authToken = '32df8b9d8910ee25ac78f5cc4a5f6256';
const client = require('twilio')(accountSid, authToken);

const key = "secret";

const sendSMS = async (body) => {
  let msgOptions = {
    from : '+16609002875',
    to : '+918639133664',
    body
  }
  try{
    const message = await client.messages.create(msgOptions);
    console.log(message);
  }
  catch (err){
    console.log(err);
  }
}
async function createOtp(params, callback){
    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets : false,
      upperCaseAlphabets : false,
      specialChars : false
    });
  const ttl = 5*60*1000 //5 mins
  const expire = Date.now() + ttl; 
  const data = `${params.phone}.${otp}.${expire}`;
  const hash = crypto.createHmac("sha256", key).update(data).digest("hex");
  const fullHash = `${hash}.${expire}`;
  
  console.log(`Your OTP us ${otp}`);
      //send SMS  
      sendSMS(`Your OTP is ${otp}`);
      return callback(null, fullHash);
  }
  
  async function verifyOTP(params, callback) {
    // Separate Hash value and expires from the hash returned from the user
    let [hashValue, expires] = params.hash.split(".");
    // Check if expiry time has passed
    let now = Date.now();
    if (now > parseInt(expires)) return callback("OTP Expired");
    // Calculate new hash with the same key and the same algorithm
    let data = `${params.phone}.${params.otp}.${expires}`;
    let newCalculatedHash = crypto
      .createHmac("sha256", key)
      .update(data)
      .digest("hex");
    // Match the hashes
    if (newCalculatedHash === hashValue) {
      return callback(null, "Success");
    }
    return callback("Invalid OTP");
  }

  module.exports = {
    createOtp,
    verifyOTP
  };