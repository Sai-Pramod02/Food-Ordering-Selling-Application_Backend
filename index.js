// index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const db = require('./db/db');
const unless = require('express-unless');
require('dotenv').config();

const { authenticateToken } = require('./middlewares/auth.js'); // Import authenticateToken middleware
const errors = require("./middlewares/errors.js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
authenticateToken.unless = unless;
// Apply authentication middleware
app.use(authenticateToken);
app.use(express.static('uploads'));

app.use("/users", require("./routes/users.routes"));
app.use("/buyers", require("./routes/buyers.routes"));
app.use("/sellers", require("./routes/sellers.routes"));



// middleware for error responses
app.use(errors.errorHandler);

// listen for requests
app.listen(process.env.PORT || 4000, function () {
  console.log("Ready to Go!");
});
