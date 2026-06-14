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
Subscription.findOne({user:user, active: true})
    .then(async function(subscription) {
        if (!subscription) {
            console.log("THE USER HAS NO ACTIVE PRO SUBSCRIPTION");
            process.exit(1);
        }
        subscription.active = false;
        subscription.save()
            .then(function(subscription) {
                console.log("SUBSCRIPTION", subscription);
                process.exit(1);
            })
            .catch(function(error) {
                console.log("IT FAILED ", error);
                process.exit(1);
            });
    })
    .catch(function(error) {
        console.log("IT FAILED ", error);
        process.exit(1);
    });