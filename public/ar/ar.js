import { createChromaMaterial } from '/ar/chroma-video.js';
import { GLTFLoader } from "/ar/GLTFLoader.js";

// Declarations
window.cameraFacing = false;
var mindarThree = null;
var hashLocation = "";
var refresh = false;
var recFrameId = null;
var mediaRecorder;
var recordedChunks = [];
var videoBlob = null;
var videoMimeType = "video/webm; codecs=vp8";
var videoExt = ".webm";
const frameRate = 30; // FPS

/**
 * Loads the video
 */
const loadVideo = function(path, poster) {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.addEventListener('loadedmetadata', () => {
            video.setAttribute('loop', true);
            video.setAttribute('playsinline', true);
            video.setAttribute('muted', true);
            video.setAttribute('poster', poster);
            console.log("Finished loading: " + path);
            resolve(video);
        });
        video.src = path + "#t=0.1";
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
 * Loads the audio
 */
const loadAudio = function (path) {
    return new Promise((resolve, reject) => {
        const loader = new window.MINDAR.IMAGE.THREE.AudioLoader();
        loader.load(path, (buffer) => {
            console.log("Finished loading: " + path);
            resolve(buffer);
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
        imageTargetSrc: artwork.marker,
        uiLoading: "no",
        uiScanning: "yes",
        uiError: "yes",
        filterMinCF: 0.0001, //  default: 1   working for me before: 0.0001,
        filterBeta: 0.001, //   default: 10000  kind of working for me before: 0.001
        missTolerance: 0, // default 0, working for me before: 3
        warmupTolerance: 10, // default 0, working for me before: 3
    });
    const { renderer, scene, camera } = mindarThree;
    const anchor = mindarThree.addAnchor(0);

    // Load the artwork
    if (artwork.type == "video") {
        // If the artwork is a video
        artwork.videoElement = await loadVideo(artwork.video, artwork.poster);
        let texture = new window.MINDAR.IMAGE.THREE.VideoTexture(artwork.videoElement);
        let geometry = new window.MINDAR.IMAGE.THREE.PlaneGeometry(1, artwork.height / artwork.width);
        let material = artwork.chroma == null || artwork.chroma == 'null'
            ? new window.MINDAR.IMAGE.THREE.MeshBasicMaterial({ map: texture })
            : createChromaMaterial(texture, artwork.chroma);
        let plane = new window.MINDAR.IMAGE.THREE.Mesh(geometry, material);
        anchor.group.add(plane);        
    }
    else {
        // If the artwork is a model
        const light = new window.MINDAR.IMAGE.THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
        scene.add(light);
        artwork.modelElement = await loadGLTF(artwork.model);
        artwork.modelElement.scene.scale.set(0.1, 0.1, 0.1);
        artwork.modelElement.scene.position.set(0, -0.4, 0);
        anchor.group.add(artwork.modelElement.scene);
        artwork.mixerElement = new window.MINDAR.IMAGE.THREE.AnimationMixer(artwork.modelElement.scene);
        const action = artwork.mixerElement.clipAction(artwork.modelElement.animations[0]);
        action.play();
    }

    // Read the audio
    if (artwork.audio != "") {
        loadAudio(artwork.audio).then(function(tmpAudio) {
            const audioClip = tmpAudio;
            const listener = new window.MINDAR.IMAGE.THREE.AudioListener();
            camera.add(listener);
            artwork.audioElement = new window.MINDAR.IMAGE.THREE.PositionalAudio(listener);
            anchor.group.add(artwork.audioElement);
            artwork.audioElement.setBuffer(audioClip);
            artwork.audioElement.setRefDistance(100);
            artwork.audioElement.setLoop(true);
        });    
    }

    // Set the events
    anchor.onTargetFound = () => {
        if (artwork.videoElement) {
            artwork.videoElement.currentTime = 0;
            artwork.videoElement.play();
        }
        if (artwork.audioElement) {
            artwork.audioElement.play();
        }
        saveMetrics("targetfound");
    }
    anchor.onTargetLost = () => {
        if (artwork.videoElement) {
            artwork.videoElement.pause();
        }
        if (artwork.audioElement) {
            artwork.audioElement.stop();
        }
        mindarThree.ui.showScanning();
        saveMetrics("targetlost");
    }

    const clock = new window.MINDAR.IMAGE.THREE.Clock();

    // Start the AR system
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
        if (artwork.mixerElement) {
            const delta = clock.getDelta();
            artwork.mixerElement.update(delta);
        }
        renderer.render(scene, camera);
    });

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
    // Fixing a bug in the AR system, when the camera switches
    for (let i = 0; i < mindarThree.anchors.length; i++) {
        mindarThree.anchors[i].group.visible=false; // Do I really need this?
        mindarThree.anchors[i].group.updateWorldMatrix(null);
    }
}

/** 
 * Very destructive restart, needed because of a bug with the AR system, when you switched cameras 
 * the video didn't go away 
 */
const restart = async function() {
    stop();
    start();
}

/**
 * This is where everything starts
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Change the mime type for iPhone and safari
    if (!MediaRecorder.isTypeSupported("video/webm; codecs=vp8")) {
        videoMimeType = "video/mp4;codecs:h264";
        videoExt = ".mp4";
    }
    // Get the camera setting
    window.cameraFacing = localStorage.getItem('cameraFacing');
    // Get the show started
    window.location.hash = "";
    setup();
});

/**
 * Add event so the AR is restarted when the phone changes orientation
 */
screen.orientation.addEventListener("change", function(event) {
    if (window.location.hash != "") {
        // Dont refresh when user is watching and sharing the video
        refresh = !refresh;
        return;
    }
    restart();
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
    
    // There is a pending 
    if (refresh) {
        restart();
    }
    
    // Unmute the sound 
    if (artwork.audioElement) {
        artwork.audioElement.setVolume(1);
    }

    // Hide the video wrapper
    hideVideo();
});
 
/** 
 * Switches the camera from environment to user. 
 * I had to badly patch the file ar-image-three.prof.js to make this work.
 */ 
document.getElementById("switchBtn").addEventListener('click', function() {
    // If the value is null, the result should be user since the default is environment
    window.cameraFacing = window.cameraFacing == "user" ? "environment" : "user";
    localStorage.setItem('cameraFacing', window.cameraFacing);
    restart();
});

/** 
 * If there is audio, mute and unmute it 
 */
if (document.getElementById("soundBtn")) {
    document.getElementById("soundBtn").addEventListener('click', function() {
        if (artwork.audioElement) {
            artwork.audioElement.setVolume(0);
            showMuteBtn();
        }
    });

    document.getElementById("muteBtn").addEventListener('click', function() {
        if (artwork.audioElement) {
            artwork.audioElement.setVolume(1);
            hideMuteBtn();
        }
    });
} 

/**
 * Saves the video and shows video wrapper
 */
document.getElementById("recVideoBtn").addEventListener('click', function() {
    hideRecBtn();
    recordedChunks = [];
    videoBlob = null;
    const canvas = document.getElementById('record');
    copyRenderedCanvas(canvas);
    const poster = canvas.toDataURL();
    const canvasStream = canvas.captureStream(frameRate);
    if (artwork.audioElement) {
        const context = artwork.audioElement.context;
		const destination = context.createMediaStreamDestination();
		artwork.audioElement.listener.getInput().connect(destination);
		artwork.audioElement.gain.connect(destination);
		canvasStream.addTrack(destination.stream.getAudioTracks()[0]);
        mediaRecorder = new MediaRecorder(canvasStream, {mimeType: videoMimeType});
    }
    else {
        mediaRecorder = new MediaRecorder(canvasStream, {mimeType: videoMimeType});
    }
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
        if (recordedChunks.length == 0) {
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

            // Mute the sound 
            if (artwork.audioElement) {
                artwork.audioElement.setVolume(0);
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
    showRecBtn();
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
    let mime = {mimeType: videoMimeType}; 
    let ext = videoExt;
    const filename = artwork.tagline + "-" + hashLocation + ext;
    const sanitized = filename.replace(/[/\\?%*:|"<>]/g, '-');
    const file = new File([videoBlob], sanitized, mime);
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
                console.log(error);
            });
            saveMetrics("sharevideo");
        } 
        catch (error) {
            console.error('Error sharing video:', error);
        }
    }
});

/**
 * Help for saving metrics 
 */
function saveMetrics(type) {
    if (uuid != "") {
        fetch("/metrics", {
            method: "POST",
            body: JSON.stringify({ 
                metricType: type,
                id: artwork.id,
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
function showSplash() 
{
    document.getElementById("splash").style.display = "flex";
}

function hideSplash() 
{
    document.getElementById("splash").style.display = "none";
}

function showMuteBtn()
{
    document.getElementById("soundBtn").style.display = "none";
    document.getElementById("muteBtn").style.display = "block";
}

function hideMuteBtn()
{
    document.getElementById("soundBtn").style.display = "block";
    document.getElementById("muteBtn").style.display = "none";
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
    document.getElementById("recVideoBtn").style.display = "block";
    document.getElementById("stopRecVideoBtn").style.display = "none";
}

function hideRecBtn() 
{
    document.getElementById("recVideoBtn").style.display = "none";
    document.getElementById("stopRecVideoBtn").style.display = "block";
}

function showPlayBtn() 
{
    document.getElementById("playVideoBtn").style.display = "block";
    document.getElementById("stopVideoBtn").style.display = "none";
}

function hidePlayBtn() 
{
    document.getElementById("playVideoBtn").style.display = "none";
    document.getElementById("stopVideoBtn").style.display = "block";
}
