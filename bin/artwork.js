#!/usr/bin/env node
/** 
 * Add new artwork
 * 
 * Usage:
 * 
 * node .\artwork.js <marker> <video> <poster> <width> <height> <chroma> <location> <tagline> <user> <route>
 * node .\artwork.js "video/model" "birds.mind" "birds_green_screen_sm_3.mp4" "birds.mp3" "birds.jpeg" "720" "480" "#00ff00" "n/a" "shared with WallMurals.ai" "birds" "67b2384b51b20d0f179106ac"  
 * 
*/
const dotenv = require('dotenv').config({path: "../.env"});
const colors = require('colors');
const Artwork = require('../models/artwork');
const connectDB = require('../db');

connectDB();

if (!process.argv[2]) {
    console.log("NO ARGUMENTS");
    process.exit(1);
}

let type = process.argv[2];
let marker = process.argv[3];
let video = "";
let model = process.argv[4];
if (type == "video") {
    video = process.argv[4];
    model = "";
}
let audio = process.argv[5] == "n/a" ? "" : process.argv[5];
let poster = process.argv[6];
let width = process.argv[7] == "n/a" ? "" : process.argv[7];
let height = process.argv[8] == "n/a" ? "" : process.argv[8];
let chroma = process.argv[9] == "n/a" ? "" : process.argv[9];
let location = process.argv[10] == "n/a" ? "" : process.argv[10];
let tagline = process.argv[11] == "n/a" ? "" : process.argv[11];
let route = process.argv[12] == "n/a" ? "" : process.argv[12];
let user = process.argv[13];

Artwork.create({
    type: type,
    marker: user + "/" + marker,
    video: video != "" ? user + "/" + video : video,
    model: model != "" ? user + "/" + model : model,
    audio: audio != "" ? user + "/" + audio : audio,
    poster: user + "/" + poster,
    width: width,
    height: height,
    chroma: chroma,
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
