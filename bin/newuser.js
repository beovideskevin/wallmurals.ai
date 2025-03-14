#!/usr/bin/env node
/** 
 * Create a new user
 * 
 * Usage:
 * 
 * node .\newuser.js <username> <name> <phone>
 * node .\newuser.js beovideskevin kevin 7869123518 
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

let email = process.argv[2].toLowerCase();
let password = generator.generate({
	length: 10,
	numbers: true,
    symbols: true
});
console.log("SAVE THE PASSWORD: " + password);
let name = process.argv[3] || "none";
let phone = process.argv[4] || "none";

const saltRounds = 10; 
bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.log("HASH ERROR: " + err);
        process.exit(1);
    }
    User.create({
        email: email,
        password: hash,
        name: name,
        phone: phone
    }).then(function (newUser) {
        console.log("User created!", newUser);
        process.exit(1);
    }).catch(function (error) {
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.log("VALIDATION ERROR: " + messages);
        } 
        else {
            console.log("ERROR: " + error);
        }
        process.exit(1);
    });
});
