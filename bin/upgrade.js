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
const yearly = process.argv[3] || false;
Subscription.findOne({user:user, active: true})
    .then(function(subscription) {
        if (subscription) {
            console.log("THE USER ALREADY HAS AN ACTIVE PRO SUBSCRIPTION");
            process.exit(1);
        }
        Subscription.create({
            type: "PRO",
            start: new Date(),
            yearly: !!yearly,
            user: user,
            active: true
        }).then(function (newSubscription) {
            console.log("SUBSCRIPTION", newSubscription);
            process.exit(1);
        }).catch(function(error) {
            console.log("IT FAILED ", error);
            process.exit(1);
        });
    })
    .catch(function(error) {
        console.log("IT FAILED ", error);
        process.exit(1);
    });
