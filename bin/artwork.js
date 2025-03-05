#!/usr/bin/env node
/** 
 * Add new artwork
 * 
 * Usage:
 * 
 * node .\artwork.js
 * 
*/
const dotenv = require('dotenv').config({path: "../.env"});
const colors = require('colors');
const Artwork = require('../models/artwork');
const connectDB = require('../db');

connectDB();

let marker = "";
let video = "";
let poster = "";
let width = "";
let height = "";
let chroma = "";
let model = "";
let audio = "";
let location = "";
let tagline = "";
let route = "";
let user = "";

Artwork.create({
    marker: user + "/" + marker,
    animations: [{
        video: video != "" ? user + "/" + video : video,
        poster: user + "/" + poster,
        width: width,
        height: height,
        chroma: chroma,
        model: model != "" ? user + "/" + model : model,
        audio: audio != "" ? user + "/" + audio : audio
    }],
    location: location,
    tagline: tagline,
    user: user,
    route: route
}).then(function (newArtwork) {
    console.log("Artwork created!", newArtwork);
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
