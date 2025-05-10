#!/usr/bin/env node
/**
 * Check user password
 *
 * Usage:
 *
 * node .\checkpass.js <id> <password>
 * node .\checkpass.js 67b21c7b95a58ad1c2cfc5fe
 *
 */
const dotenv = require('dotenv').config({path: "../.env"});
const colors = require('colors');
const Subscription = require('../models/subscription');
const bcrypt = require('bcrypt');
const connectDB = require('../db');

connectDB();

if (!process.argv[2]) {
    console.log("NO ARGUMENTS");
    process.exit(1);
}

const user = process.argv[2];
Subscription.find({user: user})
    .then(function(subscriptions) {
        if (subscriptions.length) {
            console.log("PRO SUBSCRIPTION");
        }
        else {
            console.log("FREE");
        }
        console.log("SUBSCRIPTION", subscriptions);
        process.exit(1);
    })
    .catch(function(error) {
        console.log("IT FAILED ", error);
        process.exit(1);
    });