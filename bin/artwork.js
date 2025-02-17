#!/usr/bin/env node
/** 
 * Add new artwork
 * 
 * Usage:
 * 
 * node .\artwork.js <marker> <video> <poster> <width> <height> <chroma> <location> <tagline>
 * node .\artwork.js beovideskevin kevin 7869123518 
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

let marker = process.argv[2];
let video = process.argv[3];
let poster = process.argv[4];
let width = process.argv[5];
let height = process.argv[6];
let chroma = process.argv[7] || "none";
let location = process.argv[8] || "none";
let tagline = process.argv[9] || "none";

Artwork.create({
    marker: marker,
    video: video,
    poster: poster,
    width: width,
    height: height,
    chroma: chroma,
    location: location,
    tagline: tagline
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
