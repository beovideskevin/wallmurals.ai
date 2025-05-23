const fs = require('fs');
const unzipper = require('unzipper');
const {v4: uuidv4} = require('uuid');
const Subscription = require('../models/subscription');
const Metric = require('../models/metric');

getMonthNameArray = function () {
    let fullArray = [];
    const now = new Date();
    for (let month = 0; month < 12; month++) {
        now.setMonth(month); // Month is 0-indexed
        fullArray.push(now.toLocaleString('default', { month: 'long' }));
    }
    return fullArray;
}

const getSubscriptionLastDate = function(day) {
    const now = new Date();
    let targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (day == 1) {
        return targetDate;
    }
    if (now.getDate() >= day) {
        targetDate = new Date(now.getFullYear(), now.getMonth(), day);    
    }
    else {
        if (now.getMonth() == 1) {
            targetDate = new Date(now.getFullYear()-1, 11, day);        
        }
        else {
            targetDate = new Date(now.getFullYear(), now.getMonth() - 1, day);    
        }
    }
    return targetDate;
}

checkViews = async function(artwork) {
    const MAX_FREE_VIEWS = 1000;
    const MAX_PRO_VIEWS = 100000;

    let max = MAX_FREE_VIEWS;
    let targetDate = getSubscriptionLastDate(1);
    let subscriptions = await Subscription.find({user: artwork.user, active: true});
    if (subscriptions.length) {
        max = MAX_PRO_VIEWS;
        let start = new Date(subscriptions[0].start);
        // @TODO implement better deal here
        let day = start.getDate() > 28 ? 28 : start.getDate();
        targetDate = getSubscriptionLastDate(day);
    }
    let count = await Metric.countDocuments({
        type: "open",
        user: artwork.user,
        createdAt: { $gt: targetDate }
    });
    if (count > max) {
        console.log("MAX VIEWS REACHED: " + req.params.id);
        return false;
    }
    return true;
}

saveMetric = (values) => {
    const {metricType, user, id, data, uuid} = values;
    Metric.create({
        type: metricType,
        data: data,
        uuid: uuid,
        artwork: id,
        user: user
    }).then(function (newMetric) {
        console.log("Metric created!", newMetric);
    }).catch(function (error) {
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.log("VALIDATION ERROR: " + messages);
        } 
        else {
            console.log("ERROR: " + error);
        }
    });
}

const openMetric = function(req, user, id, uuid) {
    const forwardedFor = req.headers['x-forwarded-for'] || req.connection.remoteAddress || "no IP";
    saveMetric({
        metricType: "open",
        data: forwardedFor,
        uuid: uuid,
        id: id,
        user: user
    });
}

const isCloseToPlace = function (userLat, userLon, targetLat, targetLon) {
    const MIN_DISTANCE = 200; // min distance in meters
    const METERS_PER_KILOMETER = 1000; // 1000 meter per kilometer
    const EARTH_RADIUS_KM = 6371;

    const toRadians = (angle) => (angle * Math.PI) / 180;

    const distance = (lat1, lon1, lat2, lon2) => {
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c * METERS_PER_KILOMETER; // Convert distance to meters
    };

    const calculatedDistance = distance(userLat, userLon, targetLat, targetLon);
    console.log("location ", calculatedDistance);
    return calculatedDistance <= MIN_DISTANCE;
}

const collectFiles = async function(req) {
    const uuid = uuidv4();
    const user = req.session.user;
    let target = "";
    let video = "";
    let poster = "";
    let model = "";
    let audio = "";

    // Copy the files to the uploads/user folders
    if (req.files) {
        // Create the folders
        let baseDir = process.cwd();

        try {
            let directoryPath = `${baseDir}/public/uploads/${user}/targets/${uuid}`;
            fs.mkdirSync(directoryPath, { recursive: true });
            directoryPath = `${baseDir}/public/uploads/${user}/posters/${uuid}`;
            fs.mkdirSync(directoryPath, { recursive: true });
            directoryPath = `${baseDir}/public/uploads/${user}/videos/${uuid}`;
            fs.mkdirSync(directoryPath, { recursive: true });
            directoryPath = `${baseDir}/public/uploads/${user}/models/${uuid}`;
            fs.mkdirSync(directoryPath, { recursive: true });
            directoryPath = `${baseDir}/public/uploads/${user}/audios/${uuid}`;
            fs.mkdirSync(directoryPath, { recursive: true });
        } catch (error) {
            console.error(`Error creating directory: ${error.message}`);
            return {target, video, poster, model, audio};
        }

        // Target file
        const targetFile = req.files.target ? req.files.target : null;
        if (targetFile) {
            target = `/uploads/${user}/targets/${uuid}/` + sanitizeFilename(targetFile.name);

            if (targetFile.name.endsWith(".mind")) {
                targetFile.mv(`${baseDir}/public${target}`, err => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
            else {
                target += ".mind"
                import('./targetCompiler.mjs')
                    .then(module => {
                        module.run([targetFile.tempFilePath], `${baseDir}/public${target}`);
                    });
                // @TODO handle errors
            }
        }

        // Video file
        const videoFile = req.files.video ? req.files.video : null;
        if (videoFile) {
            video = `/uploads/${user}/videos/${uuid}/` + sanitizeFilename(videoFile.name);
            videoFile.mv(`${baseDir}/public${video}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        }

        // Poster file
        const posterFile = req.files.poster ? req.files.poster : null;
        if (posterFile) {
            poster = `/uploads/${user}/posters/${uuid}/` + sanitizeFilename(posterFile.name);
            posterFile.mv(`${baseDir}/public${poster}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        }

        // Model file
        const modelFile = req.files.model ? req.files.model : null;
        if (modelFile) {
            if (modelFile.name.endsWith(".zip")) {
                const directory = await unzipper.Open.file(modelFile.tempFilePath);
                let dest = `${baseDir}/public/uploads/${user}/models/${uuid}/`;
                await directory.extract({ path: dest });

                if (directory.files.length === 1 && directory.files[0].type == "Directory") {
                    dest += directory.files[0].path + "/";
                    const mainFile = fs.readdirSync(dest).find(
                        file => file.path.endsWith('.gltf')
                            || file.path.endsWith('.glTFz')
                            || file.path.endsWith('.glb')
                            || file.path.endsWith('.glb2')
                            || file.path.endsWith('.gl')
                    );
                    model = mainFile ? `/uploads/${user}/models/${uuid}/${mainFile}`
                        : "I can't find the main model file in the zip archive.";
                }
                else {
                    const mainFile = directory.files.find(
                        file => file.path.endsWith('.gltf')
                            || file.path.endsWith('.glTFz')
                            || file.path.endsWith('.glb')
                            || file.path.endsWith('.glb2')
                            || file.path.endsWith('.gl')
                    );
                    model = mainFile ? `/uploads/${user}/models/${uuid}/${mainFile.path}`
                        : "I can't find the main model file in the zip archive.";
                }
            }
            else {
                model = `/uploads/${user}/models/${uuid}/` + sanitizeFilename(modelFile.name);
                modelFile.mv(`${baseDir}/public${model}`, err => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
        }

        // Audio file
        const audioFile = req.files.audio ? req.files.audio : null;
        if (audioFile) {
            audio = `/uploads/${user}/audios/${uuid}/` + sanitizeFilename(audioFile.name);
            audioFile.mv(`${baseDir}/public${audio}`, err => {
                if (err) {
                    console.error(err);
                }
            });
        }
    }

    return {target, video, poster, model, audio};
}

function sanitizeFilename(filename) {
    // Remove control characters and reserved characters
    const sanitized = filename.replace(/[\x00-\x1f\x80-\x9f/\\?%*:|"<>]/g, "");
    // Replace spaces with underscores or hyphens
    const noSpaces = sanitized.replace(/\s/g, "_");
    // Remove or replace other potentially problematic characters as needed
    const furtherSanitized = noSpaces.replace(/[\[\]{}'`;]/g, "");
    // Truncate to a reasonable length (e.g., 255 characters)
    return furtherSanitized.slice(0, 255);
}

module.exports = {
    getSubscriptionLastDate,
    getMonthNameArray,
    checkViews,
    saveMetric,
    openMetric,
    isCloseToPlace,
    collectFiles
};
