#!/usr/bin/env node
/** 
 * Check user password
 * 
 * Usage:
 * 
 * node .\checkpass.js <id> <password>
 * node .\checkpass.js 67b21c7b95a58ad1c2cfc5fe :Osf0~/K+%
 * 
*/
const dotenv = require('dotenv').config({path: "../.env"});
const colors = require('colors');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const connectDB = require('../db');

connectDB();

if (!process.argv[2]) {
    console.log("NO ARGUMENTS");
    process.exit(1);
}

const id = process.argv[2];
const password = process.argv[3];
User.findById(id)
    .then(function (user) {
        bcrypt.compare(password, user.password, function(err, result) {
            if (result) {
                console.log("Passwords match!");
            }
            else {
                console.log("Passwords DO NOT match.");
            }
            process.exit(1);
        });
    })
    .catch(function (error) {
        console.log("ERROR: " + error);
        process.exit(1);
    });
