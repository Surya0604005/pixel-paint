const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

let painting = false;
let undoStack = [];
let redoStack = [];

// Resize canvas safely
function resizeCanvas() {
  const imageData = canvas.toDataURL();

  canvas.width = window.innerWidth;
  canvas.height =
    window.innerHeight -
    document.querySelector(".controls").offsetHeight -
    document.querySelector("h1").offsetHeight -
    20;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = imageData;
  img.onload = () => ctx.drawImage(img, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Start drawing
function startPosition(e) {
  painting = true;
  saveState();

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;

  ctx.beginPath();
  ctx.moveTo(x, y);
}

// Stop drawing
function endPosition() {
  painting = false;
  ctx.beginPath();
}

// Draw
function draw(e) {
  if (!painting) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = colorPicker.value;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

// Save state
function saveState() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

// Undo
document.getElementById("undoBtn").onclick = () => {
  if (!undoStack.length) return;
  redoStack.push(canvas.toDataURL());

  const img = new Image();
  img.src = undoStack.pop();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
};

// Redo
document.getElementById("redoBtn").onclick = () => {
  if (!redoStack.length) return;
  undoStack.push(canvas.toDataURL());

  const img = new Image();
  img.src = redoStack.pop();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
};

// Clear
document.getElementById("clearBtn").onclick = () => {
  saveState();
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Download
document.getElementById("downloadBtn").onclick = () => {
  const link = document.createElement("a");
  link.download = "pixel_paint.png";
  link.href = canvas.toDataURL();
  link.click();
};

// Mouse events
canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mousemove", draw);

// Touch events
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  startPosition(e);
});
canvas.addEventListener("touchend", endPosition);
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  draw(e);
});

//Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
