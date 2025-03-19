import { createChromaMaterial } from '/ar/chroma-video.js';
import { GLTFLoader } from "/ar/GLTFLoader.js";

// Declarations
window.cameraFacing = false;
const ttl = 30 * 60 * 1000; // 30 min in milliseconds
var mindarThree = null;
var elements = [];
var hashLocation = "";
var targetFound = false;
var refresh = false;
var isMuted = false;
var recFrameId = null;
var mediaRecorder = null;
var canvas = null;
var audioCtx = null;
var streamArray = []
var recordedChunks = [];
var videoBlob = null;
var videoMimeType = "video/webm; codecs=vp9,opus"; // video/mp4; codecs="avc1.424028, mp4a.40.2"
var videoMimeShare = "video/webm";
var videoExt = ".webm";
const frameRate = 30; // FPS
const volOn = 0.5;
const volOff = 0.0;

/**
 * Loads the video
 */
const loadVideo = function(path, poster) {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.addEventListener('loadedmetadata', () => {
            video.setAttribute('loop', '');
            video.setAttribute('autoPlay', '');
            video.setAttribute('playsInline', '');
            video.setAttribute('muted', '');
            // video.setAttribute('poster', poster);
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

    // Set up the AR system
    mindarThree = new window.MINDAR.IMAGE.MindARThree({
        container: document.body,
        imageTargetSrc: artwork.target,
        uiLoading: "no",
        uiScanning: "yes",
        uiError: "yes",
        filterMinCF: 0.0001, //  default: 1   working for me before: 0.0001,
        filterBeta: 0.001, //   default: 10000  kind of working for me before: 0.001
        missTolerance: 0, // default 0, working for me before: 3
        warmupTolerance: 10, // default 0, working for me before: 3
    });
    const { renderer, scene, camera } = mindarThree;
    
    const light = new window.MINDAR.IMAGE.THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    // Load the artworks
    for (let i=0; i < artwork.animations.length; i++) {
        const anchor = mindarThree.addAnchor(i);
        elements[i] = {
            videoElement: null,
            mixerElement: null,
            audioElement: null
        };

        // Read the audio
        if (artwork.animations[i].audio) {
            showSoundBtn();
            elements[i].audioElement = new Audio(artwork.animations[i].audio);
            elements[i].audioElement.volume = volOff;
        }

        if (artwork.animations[i].video) {
            // If the artwork is a video
            loadVideo(artwork.animations[i].video, artwork.animations[i].poster).then(function(videoElement) {
                let texture = new window.MINDAR.IMAGE.THREE.VideoTexture(videoElement);
                let geometry = new window.MINDAR.IMAGE.THREE.PlaneGeometry(1, artwork.animations[i].height / artwork.animations[i].width);
                let material = artwork.animations[i].chroma == null || artwork.animations[i].chroma == 'null'
                    ? new window.MINDAR.IMAGE.THREE.MeshBasicMaterial({ map: texture })
                    : createChromaMaterial(texture, artwork.animations[i].chroma);
                let plane = new window.MINDAR.IMAGE.THREE.Mesh(geometry, material);
                anchor.group.add(plane);
                elements[i].videoElement = videoElement;
                
                // Set the events
                anchor.onTargetFound = () => {
                    if (window.location.hash != "") {
                        return;
                    }
                    targetFound = true;
                    if (elements[i].videoElement) {
                        elements[i].videoElement.currentTime = 0;
                        elements[i].videoElement.play();
                    }
                    if (elements[i].audioElement) {
                        elements[i].audioElement.currentTime = 0;
                        elements[i].audioElement.play();
                    }
                    saveMetrics("targetfound");
                }
                anchor.onTargetLost = () => {
                    targetFound = false;
                    if (elements[i].videoElement) {
                        elements[i].videoElement.pause();
                    }
                    if (elements[i].audioElement) {
                        elements[i].audioElement.pause();
                    }
                    mindarThree.ui.showScanning();
                    saveMetrics("targetlost");
                }
            });
        }
        else if (artwork.animations[i].model) {
            // If the artwork is a model
            loadGLTF(artwork.animations[i].model).then(function(modelElement) {
                modelElement.scene.scale.set(0.1, 0.1, 0.1);
                modelElement.scene.position.set(0, -0.4, 0);
                anchor.group.add(modelElement.scene);
                let mixerElement = new window.MINDAR.IMAGE.THREE.AnimationMixer(modelElement.scene);
                mixerElement.clipAction(modelElement.animations[0]).play();
                elements[i].mixerElement = mixerElement;

                // Set the events
                anchor.onTargetFound = () => {
                    if (window.location.hash != "") {
                        return;
                    }
                    targetFound = true;
                    if (elements[i].audioElement) {
                        elements[i].audioElement.currentTime = 0;
                        elements[i].audioElement.play();
                    }
                    saveMetrics("targetfound");
                }
                anchor.onTargetLost = () => {
                    targetFound = false;
                    if (elements[i].audioElement) {
                        elements[i].audioElement.pause();
                    }
                    mindarThree.ui.showScanning();
                    saveMetrics("targetlost");
                }
            });   
        }
        else {
            alert("CRITICAL: NO RESOURCE TO DISPLAY");
            return;
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

    hideSplash();
}

/**
 * Start the AR system
 */
// const start = async function() {
//     if (!mindarThree) {
//         return;
//     }
//     await mindarThree.start();
//     hideSplash();
// }

/**
 * Stop the AR system
 */
// const stop = async function () {
//     if (!mindarThree) {
//         return;
//     }
//     showSplash();
//     await mindarThree.stop();
//
//     stopAllAudio();
//
//     // Fixing a bug in the AR system, when the camera switches
//     for (let index=0; index < mindarThree.anchors.length; index++) {
//         mindarThree.anchors[index].group.visible=false;
//     }
// }

/** 
 * Very destructive restart, needed because of a bug with the AR system, when you switched cameras 
 * the video didn't go away 
 */
// const restart = function() {
//     stop();
//     setTimeout(start(), 500);
// }

/**
 * This is where everything starts
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Change the mime type for iPhone and safari
    if (!MediaRecorder.isTypeSupported(videoMimeType)) {
        videoMimeType = "video/webm; codecs=avc1,opus";
        videoMimeShare = "video/webm";
        if (!MediaRecorder.isTypeSupported(videoMimeType)) {
            videoMimeType = "video/mp4;codecs:h264";
            videoMimeShare = "video/mp4";
            videoExt = ".mp4";
        }
    }

    // Get the camera setting
    // window.cameraFacing = localStorage.getItem('cameraFacing');
    window.cameraFacing = getWithExpiry('cameraFacing');

    // Get the show started
    window.location.hash = "";

    // Init the recording streams
    canvas = document.getElementById('record');
    const canvasStream = canvas.captureStream(frameRate);
    streamArray = [...canvasStream.getVideoTracks()];

    // Get the artwork from the storage if needed
    artwork = artwork || getWithExpiry('artwork');
    if (artwork) {
        console.log("from storage", artwork);
        setup();
    }
    else {
        const locError = document.getElementById('locError');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // Success
                async function (position) {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    const response = await fetch(`/ar/location/${latitude}/${longitude}/${uuid}`);
                    if (!response.ok || response.status != 200) {
                        alert("There are no augmented reality murals in your area.");
                        window.location = "https://www.wallmurals.ai/home";
                        return;
                    }
                    const content = await response.json();
                    if (!content) {
                        alert("There are no augmented reality murals in your area.");
                        window.location = "https://www.wallmurals.ai/home";
                        return;
                    }
                    artwork = content;
                    console.log("from network", artwork);
                    setWithExpiry('artwork', artwork);
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
     * Switches the camera from environment to user.
     * I had to badly patch the file ar-image-three.prof.js to make this work.
     */
    document.getElementById("switchBtn").addEventListener('click', function() {
        // If the value is null, the result should be user since the default is environment
        window.cameraFacing = window.cameraFacing == "user" ? "environment" : "user";
        // localStorage.setItem('cameraFacing', window.cameraFacing);
        setWithExpiry('cameraFacing', window.cameraFacing);

        // This doesn't work, the bug is that the target does not dissappear
        // restart();

        // Try to refresh using the cache
        window.location.reload();
    });

    /**
     * If there is audio, mute and unmute it
     */
    document.getElementById("soundBtn").addEventListener('click', function() {
        changeSound(volOff);
        isMuted = true;
        showMuteBtn();
    });

    document.getElementById("muteBtn").addEventListener('click', function() {
        changeSound(volOn);
        isMuted = false;
        hideMuteBtn();
    });

    /**
     * Saves the video and shows video wrapper
     */
    document.getElementById("recVideoBtn").addEventListener('click', function() {
        hideRecBtn();
        recordedChunks = [];
        videoBlob = null;
        copyRenderedCanvas(canvas);
        const poster = canvas.toDataURL();

        if (!audioCtx) {
            audioCtx = new AudioContext();
            for (const element of elements) {
                const source = audioCtx.createMediaElementSource(element.audioElement);
                source.connect(audioCtx.destination);
                const destination = audioCtx.createMediaStreamDestination();
                source.connect(destination);
                streamArray.push(...destination.stream.getAudioTracks());
            }
        }

        const combinedStream = new MediaStream(streamArray);
        mediaRecorder = new MediaRecorder(combinedStream, {
            // audioBitsPerSecond: 128000,
            // videoBitsPerSecond: 5000000, // 2500000,
            mimeType: videoMimeType
        });
        mediaRecorder.onerror = (event) => {
            console.log(event);
            showRecBtn();
        };
        mediaRecorder.addEventListener("dataavailable", function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });
        mediaRecorder.addEventListener("stop", function() {
            showRecBtn();
            if (recordedChunks.length == 0) {
                console.log("No data was recorded!");
                return;
            }
            videoBlob = new Blob(recordedChunks, {type: videoMimeType});
            const url = URL.createObjectURL(videoBlob);
            const recVideo = document.createElement("video");
            recVideo.addEventListener('loadedmetadata', () => {
                // Set the details of the video
                recVideo.setAttribute('id', 'videoCanvas');
                recVideo.setAttribute('loop', 'true');
                recVideo.setAttribute('playsinline', 'true');
                recVideo.setAttribute('poster', poster);

                // Assign the video to an element in the UI
                const photoWrapper = document.getElementById("videoWrapper");
                photoWrapper.appendChild(recVideo);
                showVideo();
                if (!isMuted) {
                    changeSound(volOff); // Stop the background sound
                }

                // Set the has of the page
                hashLocation = Date.now();
                window.location.hash = hashLocation;
            });
            recVideo.src = url;
            recVideo.preload = "metadata";
            saveMetrics("recvideo");
        });
        mediaRecorder.start();
        recFrameId = setInterval(function() {
            copyRenderedCanvas(canvas);
        }, 1000 / frameRate);
    });

    /**
     * Stops video recording
     */
    document.getElementById("stopRecVideoBtn").addEventListener('click', function() {
        clearInterval(recFrameId);
        recFrameId = null;
        mediaRecorder.stop();
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
        const recVideo = document.getElementById("videoCanvas");
        recVideo.loop = true;
        recVideo.playsinline = true;
        recVideo.muted = false;
        recVideo.play();
    });

    /**
     * Stop the video
     */
    document.getElementById("stopVideoBtn").addEventListener('click', function() {
        showPlayBtn();
        const recVideo = document.getElementById("videoCanvas");
        recVideo.pause();
        recVideo.muted = true;
    });

    /**
     * Shares the video
     */
    document.getElementById("shareVideoBtn").addEventListener('click', function() {
        const filename = hashLocation + videoExt;
        const sanitized = filename.replace(/[/\\?%*:|"<>]/g, '-');
        const file = new File([videoBlob], sanitized, {type: videoMimeShare});
        const files = [file];
        if (navigator.canShare && navigator.canShare({files})) {
            try {
                navigator.share({
                    files: files,
                    title: artwork.tagline,
                    text: artwork.tagline,
                    url: "https://wallmurals.ai",
                })
                .catch((error) => {
                    console.log("Error sharing video:", error);
                    alert(error);
                });
                saveMetrics("sharevideo");
            }
            catch (error) {
                console.error('Error navigator.canShare:', error);
                alert(error);
            }
        }
    });
});

/**
 * Add event so the AR is restarted when the phone changes orientation
 */
screen.orientation.addEventListener("change", function(event) {
    if (window.location.hash != "") {
        // Don't refresh when user is watching and sharing the video
        refresh = !refresh;
        return;
    }

    // This doesn't work, the bug is that the target does not dissappear
    // restart();

    // Try to refresh using the cache
    window.location.reload();
});

/**
 * If the page is showed reload it,
 * I need to do this because of the back-forward cache, the videos are not loading when the back button is pressed in the browser (comment from filosofiantigua.es)
 */
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
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
        // This doesn't work, the bug is that the target does not dissappear
        // restart();

        // Try to refresh using the cache
        window.location.reload();
    }

    // Restart the sound if it is not muted
    if (!isMuted) {
        changeSound(volOn);
    }

    // Hide the video wrapper
    hideVideo();
});

/**
 * Helper for saving frame
 */ 
function copyRenderedCanvas(canvas) 
{
    const {video, renderer, scene, camera} = mindarThree;
    const renderCanvas = renderer.domElement;

    const context = canvas.getContext('2d');
    canvas.width = renderCanvas.width;
    canvas.height = renderCanvas.height;

    const sx = (video.clientWidth - renderCanvas.clientWidth) / 2 * video.videoWidth / video.clientWidth;
    const sy = (video.clientHeight - renderCanvas.clientHeight) / 2 * video.videoHeight / video.clientHeight;
    const sw = video.videoWidth - sx * 2; 
    const sh = video.videoHeight - sy * 2; 
    context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    
    renderer.preserveDrawingBuffer = true;
    renderer.render(scene, camera); // empty if not run
    context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
    renderer.preserveDrawingBuffer = false;
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
            },
        });
    }
}

/**
 * UI helpers
 */

// function stopAllAudio()
// {
//     for (const element of elements) {
//         if (element.audioElement) {
//             element.audioElement.pause();
//         }
//     }
// }

function changeSound(vol)
{
    for (const element of elements) {
        if (element.audioElement) {
            element.audioElement.volume = vol;
        }
    }
}

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

function showVideo() 
{
    document.getElementById("videoWrapper").style.display = "flex";
    document.getElementById("arBtnsWrapper").style.display = "none";
    document.getElementById("videoBtnsWrapper").style.display = "flex";
}

function hideVideo() 
{
    showPlayBtn();
    const videoWrapper = document.getElementById("videoWrapper");
    videoWrapper.style.display = "none";
    videoWrapper.innerHTML = "";
    document.getElementById("videoBtnsWrapper").style.display = "none";
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
