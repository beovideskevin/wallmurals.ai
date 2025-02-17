#!/usr/bin/env node
/** 
 * Check user password
 * 
 * Usage:
 * 
 * node .\changepass.js <id> <password>
 * node .\changepass.js 67b21c7b95a58ad1c2cfc5fe newpass
 * 
*/
const dotenv = require('dotenv').config({path: "../.env"});
const colors = require('colors');
const User = require('../models/user');
const generator = require('generate-password');
const bcrypt = require('bcrypt');
const connectDB = require('../db');

connectDB();

if (!process.argv[2]) {
    console.log("NO ARGUMENTS");
    process.exit(1);
}

const id = process.argv[2];
const password = process.argv[3] 
    ? process.argv[3] 
    : generator.generate({
        length: 10,
        numbers: true,
        symbols: true
    });

console.log("SAVE THE PASSWORD: " + password);
const saltRounds = 10; 
bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.log("HASH ERROR: " + err);
        process.exit(1);
    }

    User.findById(id)
        .then(function (user) {
            user.password = hash;
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
});
