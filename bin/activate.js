#!/usr/bin/env node
/** 
 * Activate a user
 * 
 * Usage:
 * 
 * node .\activate.js <username>
 * node .\activate.js id
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

const id = process.argv[2]
User.findById(id)
    .then(function (user) {
        user.active = true;
        user.save()
            .then(function(user) {
                console.log("IT WORKS: " + user);
                process.exit(1);
            })
            .catch(function(error) {
                console.log("ERROR: " + error);
                process.exit(1);
            });
    })
    .catch(function (error) {
        console.log("ERROR: " + error);
        process.exit(1);
    });

