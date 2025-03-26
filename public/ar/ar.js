import { createChromaMaterial } from '/ar/chroma-video.js';
import { GLTFLoader } from "/ar/GLTFLoader.js";

// Declarations
const ttl = 30 * 60 * 1000; // 30 min in milliseconds
var ready = false;
var mindarThree = null;
var elements = [];
var hashLocation = "";
var refresh = false;
var isMuted = true;
var currentlyPlayingVideo = null;
var currentlyPlayingAudio = null;
// Recording stuff
const frameRate = 30; // FPS
var recFrameId = null;
var mediaRecorder = null;
var canvas = null;
var poster = null;
var audioCtx = null;
var source = null;
var destination = null;
var streamArray = []
var recordedChunks = [];
var videoBlob = null;
var recVideo = null;
var mediaRecOptions = null;
let recording = false;
// MP$-Muxer stuff
let muxer = null;
let videoEncoder = null;
let audioEncoder = null;
let startTime = null;
let audioTrack = null;
let lastKeyFrame = null;
let framesGenerated = 0;
var videoMimeType = "video/webm";
const photoMimeType = "image/png";
const shutter = new Audio('/assets/sounds/shutter.mp3');
var sparkImageData = null;
var sparkIndex = 0;
const sparkFilters= [
    {   // enrich
        filter: () => {
            return window.ImageFilters.Enrich(sparkImageData);
        }
    },
    {   // brightness
        filter: () => {
            let brightness = -20;
            let contrast = 20;
            return window.ImageFilters.BrightnessContrastPhotoshop (sparkImageData, brightness, contrast);
        }
    },
    {   // brightness 2
        filter: () => {
            let brightness = 20;
            let contrast = -10;
            return window.ImageFilters.BrightnessContrastPhotoshop (sparkImageData, brightness, contrast);
        }
    },
    {   // posterize
        filter: () => {
            let levels = 32;
            return window.ImageFilters.Posterize(sparkImageData, levels);
        }
    },
    {   // emboss
        filter: () => {
            return window.ImageFilters.Emboss(sparkImageData);
        }
    },
    {   // sepia
        filter: () => {
            return window.ImageFilters.Sepia(sparkImageData);
        }
    },
    {   //gray scale
        filter: () => {
            return window.ImageFilters.GrayScale(sparkImageData);
        }
    },
    {   // none
        filter: () => {
            return sparkImageData;
        }
    },
];

/**
 * Loads the video
 */
const loadVideo = function(path, poster) {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.addEventListener('loadedmetadata', () => {
            video.setAttribute('loop', '');
            video.setAttribute('playsInline', '');
            video.setAttribute('muted', '');
            video.setAttribute('poster', poster);
            console.log("Finished loading: " + path);
            resolve(video);
        });
        video.src = path; //  + "#t=0.1";
        video.preload = "metadata";
    });
}

/**
 * Loads the model
 */
const loadGLTF = function(path) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            console.log("Finished loading: " + path);
            resolve(gltf);
        });
    });
}

/**
 * Setup and starts the AR system
 */
const setup = async function() {
    showSplash();

    const defaults = {
        container: document.body,
        imageTargetSrc: artwork.target,
        uiLoading: "no",
        uiScanning: "yes",
        uiError: "yes",
        filterMinCF: artwork.animations[0].video ? vFilterMinCF : filterMinCF,
        filterBeta: artwork.animations[0].video ? vFilterBeta : filterBeta,
        missTolerance: artwork.animations[0].video ? vMissTolerance : missTolerance,
        warmupTolerance: artwork.animations[0].video ? vWarmupTolerance : warmupTolerance,
    };

    // Set up the AR system
    mindarThree = new window.MINDAR.IMAGE.MindARThree(defaults);
    const { renderer, scene, camera } = mindarThree;
    
    const light = new window.MINDAR.IMAGE.THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    // Load the artworks
    for (let i=0; i < artwork.animations.length; i++) {
        const anchor = mindarThree.addAnchor(i);
        elements[i] = {
            videoElement: null,
            modelElement: null,
            mixerElement: null,
            audioElement: null
        };

        // Read the audio
        if (artwork.animations[i].audio) {
            showSoundBtn();
            elements[i].audioElement = new Audio(artwork.animations[i].audio);
        }

        // If the artwork is a video
        if (artwork.animations[i].video) {
            loadVideo(artwork.animations[i].video, artwork.animations[i].poster).then(function(videoElement) {
                let texture = new window.MINDAR.IMAGE.THREE.VideoTexture(videoElement);
                let scale = 1;
                if (artwork.animations[i].scale) {
                    scale = artwork.animations[i].scale;
                }
                let geometry = new window.MINDAR.IMAGE.THREE.PlaneGeometry(scale, scale * (artwork.animations[i].height / artwork.animations[i].width));
                let material = artwork.animations[i].chroma == null || artwork.animations[i].chroma == 'null'
                    ? new window.MINDAR.IMAGE.THREE.MeshBasicMaterial({ map: texture })
                    : createChromaMaterial(texture, artwork.animations[i].chroma);
                let plane = new window.MINDAR.IMAGE.THREE.Mesh(geometry, material);
                anchor.group.add(plane);
                elements[i].videoElement = videoElement;
                elements[i].videoElement.muted = true;

                // Set the events
                anchor.onTargetFound = () => {
                    if (window.location.hash != "") {
                        return;
                    }
                    if (elements[i].videoElement) {
                        currentlyPlayingVideo = elements[i].videoElement;
                        elements[i].videoElement.play();
                    }
                    if (elements[i].audioElement) {
                        currentlyPlayingAudio = elements[i].audioElement;
                        if (!isMuted) {
                            elements[i].audioElement.play();
                        }
                    }
                    saveMetrics("targetfound");
                }
                anchor.onTargetLost = () => {
                    if (elements[i].videoElement) {
                        elements[i].videoElement.pause();
                    }
                    if (elements[i].audioElement) {
                        currentlyPlayingAudio = null;
                        elements[i].audioElement.pause();
                    }
                    mindarThree.ui.showScanning();
                    saveMetrics("targetlost");
                }
            });
        }

        // If the artwork is a model
        if (artwork.animations[i].model) {
            loadGLTF(artwork.animations[i].model).then(function(modelElement) {
                if (artwork.animations[i].scale) {
                    const [x,y,z] = artwork.animations[i].scale.split(",");
                    modelElement.scene.scale.set(x, y, z);
                }
                else {
                    modelElement.scene.scale.set(0.1, 0.1, 0.1);
                }
                if (artwork.animations[i].position) {
                    const [x,y,z] = artwork.animations[i].position.split(",");
                    modelElement.scene.position.set(x, y, z);
                }
                else {
                    modelElement.scene.position.set(0, -0.4, 0);
                }
                anchor.group.add(modelElement.scene);
                let mixerElement = new window.MINDAR.IMAGE.THREE.AnimationMixer(modelElement.scene);
                mixerElement.clipAction(modelElement.animations[0]).play();
                elements[i].mixerElement = mixerElement;
                elements[i].modelElement = modelElement;

                // Set the events
                anchor.onTargetFound = () => {
                    if (window.location.hash != "") {
                        return;
                    }
                    if (elements[i].audioElement) {
                        currentlyPlayingAudio = elements[i].audioElement;
                        if (!isMuted) {
                            elements[i].audioElement.play();
                        }
                    }
                    saveMetrics("targetfound");
                }
                anchor.onTargetLost = () => {
                    if (elements[i].audioElement) {
                        currentlyPlayingAudio = null;
                        elements[i].audioElement.pause();
                    }
                    mindarThree.ui.showScanning();
                    saveMetrics("targetlost");
                }
            });   
        }
    }

    // Start the AR system
    await mindarThree.start();
    const clock = new window.MINDAR.IMAGE.THREE.Clock();
    renderer.setAnimationLoop(() => {
        const delta = clock.getDelta();
        for (const element of elements) {
            if (element.mixerElement) {
                element.mixerElement.update(delta);
            }
        }
        renderer.render(scene, camera);
    });

    // There is a pending refresh
    if (refresh) {
        refresh = false;
        restart();
    }

    ready = true;
    hideSplash();
}

/**
 * Start the AR system
 */
const start = async function() {
    if (!mindarThree) {
        return;
    }
    await mindarThree.start();
    hideSplash();
}

/**
 * Stop the AR system
 */
const stop = async function () {
    if (!mindarThree) {
        return;
    }
    showSplash();
    await mindarThree.stop();
}

/**
 * Restart the AR system
 */
const restart = function() {
    stop();
    start();
}

/**
 * This is where everything starts
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Change the mime type for iPhone and safari
    if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        mediaRecOptions = {mimeType: 'video/webm; codecs=vp9'};
    } else  if (MediaRecorder.isTypeSupported('video/webm')) {
        mediaRecOptions = {mimeType: 'video/webm'};
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mediaRecOptions = {mimeType: 'video/mp4'}; // , videoBitsPerSecond : 100000};
        videoMimeType = "video/mp4";
    } else {
        console.error("no suitable mimetype found for this device");
        document.getElementById("recVideoBtn").style.display = "none";
    }

    canvas = document.createElement('canvas');
    resizeCanvas();

    // Get the show started
    window.location.hash = "";

    // Get the artwork from the storage if needed
    artwork = artwork || getWithExpiry('artwork');
    if (artwork) {
        saveMetrics("open");
        setup();
    }
    else {
        const locError = document.getElementById('locError');
        const muralsError = document.getElementById('muralsError');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // Success
                async function (position) {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    const response = await fetch(`/ar/location/${latitude}/${longitude}/${uuid}`);
                    if (!response.ok || response.status != 200) {
                        muralsError.style.display = "flex";
                        return;
                    }
                    const content = await response.json();
                    if (!content) {
                        muralsError.style.display = "flex";
                        return;
                    }
                    artwork = content;
                    setWithExpiry('artwork', artwork);
                    saveMetrics("open");
                    setup();
                }, 
                // Error
                function (error) {
                    locError.style.display = "flex";
                },
                // Options
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } 
        else {
            console.log("Geolocation is not supported by this browser?");
            locError.style.display = "flex";
        }
    }

    /**
     * If there is audio, mute and unmute it
     */
    document.getElementById("soundBtn").addEventListener('click', function() {
        isMuted = true;
        if (currentlyPlayingAudio) {
            currentlyPlayingAudio.pause();
        }
        showMuteBtn();
    });

    document.getElementById("muteBtn").addEventListener('click', function() {
        isMuted = false;
        if (currentlyPlayingAudio) {
            currentlyPlayingAudio.play();
        }
        hideMuteBtn();
    });

    /**
     * Saves the video and shows video wrapper
     */

    function encodeVideoFrame () {
        let elapsedTime = document.timeline.currentTime - startTime;
        let frame = new VideoFrame(canvas, {
            timestamp: framesGenerated * 1e6 / frameRate, // Ensure equally-spaced frames every 1/30th of a second
            duration: 1e6 / frameRate
        });
        framesGenerated++;

        // Ensure a video key frame at least every 5 seconds for good scrubbing
        let needsKeyFrame = elapsedTime - lastKeyFrame >= 5000;
        if (needsKeyFrame) lastKeyFrame = elapsedTime;

        videoEncoder.encode(frame, { keyFrame: needsKeyFrame });
        frame.close();
    }

    async function endRecording () {
        audioTrack?.stop();

        await videoEncoder?.flush();
        await audioEncoder?.flush();
        muxer.finalize();

        alert(framesGenerated);

        let buffer = muxer.target.buffer;
        videoBlob = new Blob([buffer]);
        createAndShowVideo();

        videoEncoder = null;
        audioEncoder = null;
        muxer = null;
        startTime = null;
    }

    document.getElementById("recVideoBtn").addEventListener('click', function() {
        audioCtx = audioCtx || new AudioContext();
        // if (videoMimeType === "video/webm") {
            if (elements[0].audioElement) {
                if (audioTrack === null) {
                    source = audioCtx.createMediaElementSource(elements[0].audioElement);
                    source.connect(audioCtx.destination);
                }
                destination = audioCtx.createMediaStreamDestination();
                source.connect(destination);
                audioTrack = destination.stream.getAudioTracks()[0];
            }

            let audioSampleRate = audioTrack?.getSettings().sampleRate;
            let audioNumberOfChannels = audioTrack?.getSettings().channelCount;

            // Create an MP4 muxer with a video track and maybe an audio track
            muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width: canvas.width,
                    height: canvas.height,
                    frameRate: frameRate
                },
                audio: audioTrack ? {
                    codec: 'aac',
                    sampleRate: audioSampleRate,
                    numberOfChannels: audioNumberOfChannels
                } : undefined,
                // Puts metadata to the start of the file. Since we're using ArrayBufferTarget anyway, this makes no difference
                // to memory footprint.
                fastStart: false, // 'in-memory',
                // Because we're directly pumping a MediaStreamTrack's data into it, which doesn't start at timestamp = 0
                firstTimestampBehavior: 'offset'
            });

            videoEncoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: e => console.error(e)
            });
            videoEncoder.configure({
                codec: "avc1.424028",
                width: canvas.width,
                height: canvas.height,
                bitrate: 1e6
            });

            if (audioTrack) {
                audioEncoder = new AudioEncoder({
                    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
                    error: e => console.error(e)
                });
                audioEncoder.configure({
                    codec: 'mp4a.40.2',
                    numberOfChannels: audioNumberOfChannels,
                    sampleRate: audioSampleRate,
                    bitrate: 128000
                });

                // Create a MediaStreamTrackProcessor to get AudioData chunks from the audio track
                let trackProcessor = new MediaStreamTrackProcessor({ track: audioTrack });
                let consumer = new WritableStream({
                    write(audioData) {
                        if (!recording) return;
                        audioEncoder.encode(audioData);
                        audioData.close();
                    }
                });
                trackProcessor.readable.pipeTo(consumer);
            }

            startTime = document.timeline.currentTime;
            lastKeyFrame = -Infinity;
            framesGenerated = 0;
        // }
        // else if (!mediaRecorder) {
        //     const canvasStream = canvas.captureStream(frameRate);
        //     streamArray.push(...canvasStream.getVideoTracks());
        //     for (const element of elements) {
        //         source = audioCtx.createMediaElementSource(element.audioElement);
        //         source.connect(audioCtx.destination);
        //         destination = audioCtx.createMediaStreamDestination();
        //         source.connect(destination);
        //         streamArray.push(...destination.stream.getAudioTracks());
        //     }
        //     const combinedStream = new MediaStream(streamArray);
        //     mediaRecorder = new MediaRecorder(combinedStream,
        //         mediaRecOptions
        //     );
        //
        //     mediaRecorder.onerror = (event) => {
        //         recording = false;
        //         showRecBtn();
        //         console.log(event);
        //         alert("There was an error recording the video :(");
        //     };
        //
        //     mediaRecorder.addEventListener("dataavailable", function(event) {
        //         if (event.data.size > 0) {
        //             recordedChunks.push(event.data);
        //         }
        //     });
        //
        //     mediaRecorder.addEventListener("stop", function() {
        //         if (recordedChunks.length == 0) {
        //             console.log("No data was recorded!");
        //             alert("There was an error recording the video :(");
        //             return;
        //         }
        //         videoBlob = new Blob(recordedChunks, {type: videoMimeType});
        //         createAndShowVideo();
        //     });
        // }

        recording = true;
        hideRecBtn();
        recordedChunks = [];
        videoBlob = null;

        // make poster image
        copyRenderedCanvas(canvas);
        poster = canvas.toDataURL();

        if (videoMimeType === "video/webm") {
            encodeVideoFrame();
        }
        else {
            mediaRecorder.start();
        }

        recFrameId = setInterval(function() {
            copyRenderedCanvas(canvas);
            if (videoMimeType === "video/webm") {
                encodeVideoFrame();
            }
        }, 1000 / frameRate);
    });

    /**
     * Stops video recording
     */
    document.getElementById("stopRecVideoBtn").addEventListener('click', function() {
        clearInterval(recFrameId);
        recFrameId = null;
        recording = false;
        showRecBtn();
        if (videoMimeType === "video/webm") {
            endRecording();
        }
        else {
            mediaRecorder.stop();
        }
        if (currentlyPlayingAudio) {
            currentlyPlayingAudio.pause();
        }
    });

    /**
     * The back button just goes back in the history, the onhashchange event ius the one that modifies the UI
     */
    document.getElementById("backVideoBtn").addEventListener('click', function() {
        history.back();
    });

    /**
     *  Play the video
     */
    document.getElementById("playVideoBtn").addEventListener('click', function() {
        hidePlayBtn();
        recVideo.muted = false;
        recVideo.play();
    });

    /**
     * Stop the video
     */
    document.getElementById("stopVideoBtn").addEventListener('click', function() {
        showPlayBtn();
        recVideo.pause();
        recVideo.currentTime = 0;
    });

    /**
     * Shares the video
     */
    document.getElementById("shareVideoBtn").addEventListener('click', async function() {
        // Now we can share the video
        const filename = /* artwork.tagline.replace(/\s/g, "-") + "-" + */ hashLocation + ".mp4";
        const sanitized = filename.replace(/[/\\?%*:|"<>]/g, '-');
        const file = new File([videoBlob], sanitized, {type: videoMimeType});
        if (navigator.canShare && navigator.canShare({files: [file]})) {
            try {
                navigator.share({
                    files: [file],
                })
                .catch((error) => {
                    console.log("Error sharing video:", error);
                });
                saveMetrics("sharevideo");
            }
            catch (error) {
                console.error('Error navigator.canShare:', error);
                alert("Your device can not share the video.");
            }
        }
        else {
            alert("Your device can not share the video.");
        }
    });

    /**
     * Saves the image and shows the photo wrapper
     */
    document.getElementById("photoBtn").addEventListener('click', function() {
        shutter.play();

        // Create a canvas and draw the photo
        const photoCanvas = document.createElement('canvas');
        photoCanvas.setAttribute("id", "photoCanvas");
        photoCanvas.width = window.innerWidth;
        photoCanvas.height = window.innerHeight;
        copyRenderedCanvas(photoCanvas);

        // Assign the photo  to an element in the UI
        const photoWrapper = document.getElementById("photoWrapper");
        photoWrapper.appendChild(photoCanvas);
        showPhoto();

        // Make copy for spark filters
        const sparkPhoto = document.createElement('canvas');
        sparkPhoto.setAttribute("id", "sparkPhoto");
        const sparkContext = sparkPhoto.getContext('2d');
        sparkPhoto.width = photoCanvas.width;
        sparkPhoto.height = photoCanvas.height;
        sparkContext.drawImage(photoCanvas, 0, 0, photoCanvas.width, photoCanvas.height);
        sparkImageData = sparkContext.getImageData(0, 0, photoCanvas.width, photoCanvas.height);
        sparkIndex = 0;

        // Set the hashtag of the page
        hashLocation = Date.now();
        window.location.hash = hashLocation;

        saveMetrics("photo");
    });

    /**
     * The back button just goes back in the history, the onhashchange event ius the one that modifies the UI
     */
    document.getElementById("backPhotoBtn").addEventListener('click', function() {
        history.back();
    });

    /**
     * Apply filters
     */
    document.getElementById("sparkPhotoBtn").addEventListener('click', function() {
        const photoCanvas = document.getElementById("photoCanvas");
        const ctx = photoCanvas.getContext('2d');
        ctx.putImageData(sparkFilters[sparkIndex].filter(), 0, 0);
        sparkIndex = ++sparkIndex >= sparkFilters.length ? 0 : sparkIndex;
    });

    /**
     * Shares the photo
     */
    document.getElementById("sharePhotoBtn").addEventListener('click', function() {
        const photoCanvas = document.getElementById("photoCanvas");
        photoCanvas.toBlob((blob) => {
            const filename = /* artwork.tagline.replace(/\s/g, "-") + "-" + */ hashLocation + ".png";
            const sanitized = filename.replace(/[/\\?%*:|"<>]/g, '-');
            const file = new File([blob], sanitized, {type: photoMimeType});
            if (navigator.canShare && navigator.canShare({files: [file]})) {
                try {
                    navigator.share({
                        files: [file],
                    }).catch((error) => {
                        console.error('Error sharing photo:', error);
                    });
                    saveMetrics("sharephoto");
                }
                catch (error) {
                    console.error('Error navigator.canShare:', error);
                    alert("Your device can not share the photo.");
                }
            }
            else {
                alert("Your device can not share the photo.");
            }
        })
    });
});

/**
 * Add event so the AR is restarted when the phone changes orientation
 */
screen.orientation.addEventListener("change", function() {
    if (window.location.hash != "" || recording || !ready) {
        // Don't refresh when user is watching and sharing the video
        refresh = true;
        return;
    }

    resizeCanvas();

    restart();
});

/**
 * If the page is showed reload it,
 * I need to do this because of the back-forward cache, the videos are not loading when the back button is pressed in the browser (comment from filosofiantigua.es)
 */
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        if (window.location.hash != "") {
            window.location.href = window.location.href.split('#')[0]
        }
        window.location.reload();
    }
});

/**
 * If you go back on the history we need to hide the photo wrapper and the buttons and show the AR system
 */
window.addEventListener("hashchange", function() {
    // It only works when the hash changed to "" (it returns to the home page) 
    // when it changes to "whatever" don't do anything  
    if (window.location.hash != "") {
      return;
    }

    // There is a pending refresh
    if (refresh) {
        refresh = false;
        restart();
    }

    if (currentlyPlayingAudio && !isMuted) {
        currentlyPlayingAudio.play();
    }

    // Hide the video wrapper
    showARHideAll();
});

/**
 * Helpers for recording video
 */
function resizeCanvas() {
    if (window.innerWidth > window.innerHeight) {
        // Optimal size for instagram, it could deform the image a little bit
        canvas.width = 1920;
        canvas.height = 1080;
    }
    else {
        canvas.width = 1080;
        canvas.height = 1920;
    }
}

function copyRenderedCanvas(copyCanvas)
{
    const {video, renderer, scene, camera} = mindarThree;
    const renderCanvas = renderer.domElement;

    const offscreen = document.createElement('canvas');
    offscreen.width = renderCanvas.width;
    offscreen.height = renderCanvas.height;
    const offscreenContext = offscreen.getContext('2d', {
        willReadFrequently: true,
        desynchronized: true
    });

    const sx = (video.clientWidth - renderCanvas.clientWidth) / 2 * video.videoWidth / video.clientWidth;
    const sy = (video.clientHeight - renderCanvas.clientHeight) / 2 * video.videoHeight / video.clientHeight;
    const sw = video.videoWidth - sx * 2; 
    const sh = video.videoHeight - sy * 2;
    offscreenContext.drawImage(video, sx, sy, sw, sh, 0, 0, renderCanvas.width, renderCanvas.height);
    
    renderer.preserveDrawingBuffer = true;
    renderer.render(scene, camera); // empty if not run
    offscreenContext.drawImage(renderCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
    renderer.preserveDrawingBuffer = false;

    const context = copyCanvas.getContext('2d');
    // landscape
    let actualHeight = 16 * renderCanvas.width / 9;
    let actualWidth = renderCanvas.width;
    let xOffset = 0;
    let yOffset = (renderCanvas.height - actualHeight) / 2;
    // portrait
    if (renderCanvas.width > renderCanvas.height) {
        actualWidth = 16 * renderCanvas.height / 9;
        actualHeight = renderCanvas.height;
        xOffset = (renderCanvas.width - actualWidth) / 2;
        yOffset = 0;
    }
    context.drawImage(offscreen, xOffset, yOffset, actualWidth, actualHeight, 0, 0, copyCanvas.width, copyCanvas.height);
}

function createAndShowVideo()
{
    const url = URL.createObjectURL(videoBlob);
    recVideo = document.createElement("video");
    recVideo.addEventListener('loadedmetadata', () => {
        // Set the details of the video
        recVideo.setAttribute('id', 'videoCanvas');
        recVideo.setAttribute('loop', 'true');
        recVideo.setAttribute('playsinline', 'true');
        recVideo.setAttribute('poster', poster);

        // Assign the video to an element in the UI
        const videoWrapper = document.getElementById("videoWrapper");
        videoWrapper.appendChild(recVideo);
        showVideo();

        // Set the hashtag of the page
        hashLocation = Date.now();
        window.location.hash = hashLocation;

        // Save the metrics
        saveMetrics("recvideo");
    });
    recVideo.src = url;
    recVideo.preload = "metadata";
}

/**
 * Help for saving metrics 
 */
function saveMetrics(type) {
    if (uuid != "") {
        fetch("/metrics", {
            method: "POST",
            body: JSON.stringify({ 
                metricType: type,
                id: artwork._id,
                data: window.navigator.userAgent || "Nothing",
                uuid: uuid
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });
    }
}

/**
 * UI helpers
 */
function showSplash()
{
    document.getElementById("splash").style.display = "flex";
}

function hideSplash() 
{
    document.getElementById("splash").style.display = "none";
}

function showSoundBtn() {
    document.getElementById("noSoundBtn").style.display = "none";
    document.getElementById("muteBtn").style.display = "block";
}

function showMuteBtn()
{
    document.getElementById("soundBtn").style.display = "none";
    document.getElementById("muteBtn").style.display = "block";
}

function hideMuteBtn()
{
    document.getElementById("muteBtn").style.display = "none";
    document.getElementById("soundBtn").style.display = "block";
}

function showPhoto()
{
    document.getElementById("photoWrapper").style.display = "flex";
    document.getElementById("arBtnsWrapper").style.display = "none";
    document.getElementById("photoBtnsWrapper").style.display = "flex";
}

function hidePhoto()
{
    const photoWrapper = document.getElementById("photoWrapper");
    photoWrapper.style.display = "none";
    photoWrapper.innerHTML = "";
    document.getElementById("photoBtnsWrapper").style.display = "none";
}

function showVideo() 
{
    document.getElementById("videoWrapper").style.display = "flex";
    document.getElementById("arBtnsWrapper").style.display = "none";
    document.getElementById("videoBtnsWrapper").style.display = "flex";
}

function hideVideo()
{
    const videoWrapper = document.getElementById("videoWrapper");
    videoWrapper.style.display = "none";
    videoWrapper.innerHTML = "";
    document.getElementById("videoBtnsWrapper").style.display = "none";
}

function showARHideAll()
{
    // Hide video wrapper and btns wrapper
    showPlayBtn();
    hideVideo();

    // Hide photo wrapper and btns wrapper
    hidePhoto();

    // Show main controls
    document.getElementById("arBtnsWrapper").style.display = "flex";
}

function showRecBtn() 
{
    document.getElementById("stopRecVideoBtn").style.display = "none";
    document.getElementById("recVideoBtn").style.display = "block";
}

function hideRecBtn() 
{
    document.getElementById("recVideoBtn").style.display = "none";
    document.getElementById("stopRecVideoBtn").style.display = "block";
}

function showPlayBtn() 
{
    document.getElementById("stopVideoBtn").style.display = "none";
    document.getElementById("playVideoBtn").style.display = "block";
}

function hidePlayBtn() 
{
    document.getElementById("playVideoBtn").style.display = "none";
    document.getElementById("stopVideoBtn").style.display = "block";
}

/**
 * Storage helpers
 */
function setWithExpiry(key, value) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    try {
        const item = JSON.parse(itemStr);
        const now = new Date();
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.value;
    }
    catch(e) {
        console.log("Invalid item in storage:", itemStr);
        return null;
    }
}
