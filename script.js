const video = document.getElementById("camera");
const cameraMessage = document.getElementById("camera-message");
const countdownDisplay = document.getElementById("countdown");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const frameContainer = document.getElementById("photo-frame");
const downloadButtons = document.getElementById("download-buttons");
const downloadAllButton = document.getElementById("download-all");
const filterSelection = document.getElementById("filter-selection");
const frameSelection = document.getElementById("frame-selection");

let takingPhotos = false;
let photosToTake = 1;
let countdownInterval;

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = "block";
        cameraMessage.style.display = "none";

        // Show buttons when the camera is working
        startButton.style.display = "block";
        stopButton.style.display = "none";
        filterSelection.style.display = "flex";
        frameSelection.style.display = "flex";
        downloadButtons.style.display = "none"; // Hide initially
    } catch (error) {
        cameraMessage.innerText = "Please turn on the camera.";
        cameraMessage.style.display = "block";
       
        // Hide all buttons except the message
        startButton.style.display = "none";
        stopButton.style.display = "none";
        downloadButtons.style.display = "none";
        downloadAllButton.style.display = "none";
        filterSelection.style.display = "none";
        frameSelection.style.display = "none";
    }
}



// Stop Camera
function stopCamera() {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    video.style.display = "none";
}

// Countdown Before Capturing
function startCountdown(callback) {
    let count = 3;
    countdownDisplay.innerText = count;
    countdownDisplay.style.display = "block";

    countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDisplay.innerText = count;
        } else {
            clearInterval(countdownInterval);
            countdownDisplay.style.display = "none";
            callback(); // Capture photo
        }
    }, 1000);
}

// Start Photobooth
startButton.addEventListener("click", () => {
    if (startButton.innerText === "Take Picture Again") {
        restartPhotobooth();
        return;
    }

    takingPhotos = true;
    photosToTake = parseInt(document.querySelector("#frame-selection .selected")?.dataset.frame || 1);

    startButton.classList.add("hidden");
    stopButton.classList.remove("hidden");

    filterSelection.style.display = "none";
    frameSelection.style.display = "none";

    frameContainer.innerHTML = "";
    downloadButtons.classList.add("hidden");

    video.style.display = "block";

    frameContainer.dataset.count = photosToTake;
    frameContainer.style.display = photosToTake === 6 ? "grid" : "flex";
    frameContainer.style.gridTemplateColumns = photosToTake === 6 ? "repeat(3, 1fr)" : "unset";
    frameContainer.style.justifyContent = photosToTake === 1 || photosToTake === 3 ? "center" : "unset";

    function takeNextPhoto(index) {
        if (!takingPhotos) return;
    
        if (index < photosToTake) {
            startCountdown(() => {
                capturePhoto();
                setTimeout(() => takeNextPhoto(index + 1), 500);
            });
        } else {
            stopButton.classList.add("hidden");
            startButton.classList.remove("hidden");
            startButton.innerText = "Take Picture Again";
    
            // Ensure download buttons are properly displayed
            downloadButtons.style.display = "block";  
            console.log("Download buttons should now be visible."); 
    
            stopCamera();
        }
    }
    

    takeNextPhoto(0);
});

// Restart Photobooth
function restartPhotobooth() {
    startButton.innerText = "Start Photobooth";
    startCamera();
    frameContainer.innerHTML = "";
    downloadButtons.classList.add("hidden");
    filterSelection.style.display = "flex";
    frameSelection.style.display = "flex";
}

// Stop Photobooth Instantly (Fixed)
stopButton.addEventListener("click", () => {
    takingPhotos = false;
    clearInterval(countdownInterval);
    countdownDisplay.style.display = "none"; 

    stopButton.classList.add("hidden");
    startButton.classList.remove("hidden");
    startButton.innerText = "Start Photobooth"; 

    frameContainer.innerHTML = ""; 
    downloadButtons.classList.add("hidden");

    filterSelection.style.display = "flex"; 
    frameSelection.style.display = "flex"; 

    startCamera(); 
});


function capturePhoto() {
    let canvas = document.createElement("canvas");

    // Set a fixed resolution for all captures (same for 1, 3, or 6 photos)
    const fixedWidth = 640;
    const fixedHeight = 480;

    canvas.width = fixedWidth;
    canvas.height = fixedHeight;
    let ctx = canvas.getContext("2d");

    ctx.filter = getComputedStyle(video).filter;

    // Flip the image horizontally for correct mirror effect
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, fixedWidth, fixedHeight);

    let img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.classList.add("photo");
    frameContainer.appendChild(img);

    img.addEventListener("click", () => downloadImage(img.src));
}


function updateFrameLayout() {
    frameContainer.dataset.count = photosToTake;
    frameContainer.style.display = "grid";

    if (photosToTake === 1) {
        frameContainer.style.gridTemplateColumns = "1fr";
        frameContainer.style.gridTemplateRows = "1fr";
    } else if (photosToTake === 3) {
        frameContainer.style.gridTemplateColumns = "repeat(2, 1fr)"; 
        frameContainer.style.gridTemplateRows = "auto auto"; 
        frameContainer.style.justifyContent = "center";
        frameContainer.style.alignItems = "center";
    } else if (photosToTake === 6) {
        frameContainer.style.gridTemplateColumns = "repeat(3, 1fr)";
    }
}



// Download Single Image
function downloadImage(src) {
    let link = document.createElement("a");
    link.href = src;
    link.download = `photo_${Date.now()}.png`;
    link.click();
}

// Download Frame with Improved Layout & Margins
function downloadFrame() {
    const photos = document.querySelectorAll(".photo");
    if (photos.length === 0) return;

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    // Higher resolution for better quality
    let width = 2400, height = 1800; // Default size for 6 photos
    if (photos.length === 1) {
        width = 1600;
        height = 2000;
    } else if (photos.length === 3) {
        width = 2400;  // Made it **wider** for a more horizontal layout
        height = 1200; // Reduced height for better proportion
    } else if (photos.length === 6) {
        width = 2400;
        height = 1800;
    }
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "white"; // Background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adjusted positioning logic for better spacing
    let margin = width * 0.05; // 5% margin for spacing
    let positions = {
        1: [{ x: width * 0.15, y: height * 0.1, w: width * 0.7, h: height * 0.8 }],
        
        3: [
            { x: margin, y: height * 0.2, w: (width - 4 * margin) / 3, h: height * 0.6 },
            { x: width / 2 - ((width - 4 * margin) / 6), y: height * 0.2, w: (width - 4 * margin) / 3, h: height * 0.6 },
            { x: width - (width - 4 * margin) / 3 - margin, y: height * 0.2, w: (width - 4 * margin) / 3, h: height * 0.6 },
        ],

        6: [
            { x: margin, y: margin, w: (width - 4 * margin) / 3, h: (height - 3 * margin) / 2 },
            { x: width / 2 - ((width - 4 * margin) / 6), y: margin, w: (width - 4 * margin) / 3, h: (height - 3 * margin) / 2 },
            { x: width - (width - 4 * margin) / 3 - margin, y: margin, w: (width - 4 * margin) / 3, h: (height - 3 * margin) / 2 },
            { x: margin, y: height / 2 + margin / 2, w: (width - 4 * margin) / 3, h: (height - 3 * margin) / 2 },
            { x: width / 2 - ((width - 4 * margin) / 6), y: height / 2 + margin / 2, w: (width - 4 * margin) / 3, h: (height - 3 * margin) / 2 },
            { x: width - (width - 4 * margin) / 3 - margin, y: height / 2 + margin / 2, w: (width - 4 * margin) / 3, h: (height - 3 * margin) / 2 },
        ],
    };

    photos.forEach((photo, index) => {
        let img = new Image();
        img.src = photo.src;
        img.onload = () => {
            let pos = positions[photos.length][index];
            ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h);
            if (index === photos.length - 1) {
                // Save once all images are drawn
                let link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = `frame_${Date.now()}.png`;
                link.click();
            }
        };
    });
}

// Bind the download frame button
document.getElementById("download-frame").addEventListener("click", downloadFrame);


// Download All Images in High Resolution (2400x1800)
downloadAllButton.addEventListener("click", () => {
    document.querySelectorAll(".photo").forEach((img, index) => {
        downloadHighResImage(index);
    });
});

// Function to Capture & Download in High Resolution
function downloadHighResImage(index) {
    let canvas = document.createElement("canvas");

    // Set higher resolution for saving
    canvas.width = 2400;
    canvas.height = 1800;

    let ctx = canvas.getContext("2d");
    ctx.filter = getComputedStyle(video).filter;

    // Maintain aspect ratio while scaling
    let scaleX = canvas.width / video.videoWidth;
    let scaleY = canvas.height / video.videoHeight;
    let scale = Math.min(scaleX, scaleY);
    let newWidth = video.videoWidth * scale;
    let newHeight = video.videoHeight * scale;
    let offsetX = (canvas.width - newWidth) / 2;
    let offsetY = (canvas.height - newHeight) / 2;

    ctx.drawImage(video, offsetX, offsetY, newWidth, newHeight);

    // Create & trigger download
    let link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `photo_${Date.now()}_${index + 1}.png`;
    link.click();
}


// Attach Download Frame Function to Button
document.getElementById("download-frame").addEventListener("click", downloadFrame);

// Download All Images
downloadAllButton.addEventListener("click", () => {
    document.querySelectorAll(".photo").forEach(img => downloadImage(img.src));
});

// Apply Filters
filterSelection.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON") {
        document.querySelectorAll("#filter-selection button").forEach(btn => btn.classList.remove("selected"));
        event.target.classList.add("selected");

        let filter = event.target.dataset.filter;
        applyFilter(filter);
    }
});

// Function to Apply Filter
function applyFilter(filter) {
    switch (filter) {
        case "sepia":
            video.style.filter = "sepia(1)";
            break;
        case "grayscale":
            video.style.filter = "grayscale(1)";
            break;
        case "contrast":
            video.style.filter = "contrast(2)";
            break;
        default:
            video.style.filter = "none";
    }
}

// Frame Selection Click Event
document.querySelectorAll("#frame-selection button").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll("#frame-selection button").forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");
        photosToTake = parseInt(button.dataset.frame);
    });
});

// Start Camera on Load
startCamera();

