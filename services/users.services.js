const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const key = "secret";


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