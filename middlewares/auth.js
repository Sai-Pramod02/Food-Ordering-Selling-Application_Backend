const jwt = require('jsonwebtoken');
const unless = require('express-unless'); 

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    // If token is not present, skip authentication
    if (!token) {
      return next();
    }
  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
}

// Apply unless property to authenticateToken function
authenticateToken.unless = unless;

function generateAccessToken(username){
    return jwt.sign({data: username}, process.env.TOKEN_SECRET, {
        expiresIn : "1h",
    });
}

module.exports = {
    authenticateToken,
    generateAccessToken,
};
