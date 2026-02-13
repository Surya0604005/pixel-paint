const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const eraserBtn = document.getElementById("eraserBtn");

let erasing = false;
let painting = false;
let undoStack = [];
let redoStack = [];
let lastX = 0;
let lastY = 0;

/* =========================
   RESIZE CANVAS (SAFE)
========================= */
function resizeCanvas() {
  const snapshot = canvas.toDataURL();

  canvas.width = window.innerWidth;
  canvas.height =
    window.innerHeight -
    document.querySelector(".controls").offsetHeight -
    document.querySelector("header").offsetHeight -
    20;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = snapshot;
  img.onload = () => ctx.drawImage(img, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* =========================
   DRAWING LOGIC
========================= */
function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startPosition(e) {
  painting = true;
  saveState();

  const pos = getPosition(e);
  lastX = pos.x;
  lastY = pos.y;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
}

function endPosition() {
  painting = false;
  ctx.beginPath();
}

function draw(e) {
  if (!painting) return;

  const pos = getPosition(e);

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = erasing ? "rgba(0,0,0,1)" : colorPicker.value;


  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

/* =========================
   UNDO / REDO (OPTIMIZED)
========================= */
function saveState() {
  const data = canvas.toDataURL("image/png", 0.6);

  if (undoStack[undoStack.length - 1] === data) return;

  undoStack.push(data);
  if (undoStack.length > 30) undoStack.shift();
  redoStack = [];
}

undoBtn.onclick = () => {
  if (!undoStack.length) return;

  redoStack.push(canvas.toDataURL());
  restoreCanvas(undoStack.pop());
};

redoBtn.onclick = () => {
  if (!redoStack.length) return;

  undoStack.push(canvas.toDataURL());
  restoreCanvas(redoStack.pop());
};

function restoreCanvas(data) {
  const img = new Image();
  img.src = data;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

/* =========================
   CLEAR (CONFIRM UX)
========================= */
clearBtn.onclick = () => {
  if (!confirm("Clear the canvas?")) return;

  saveState();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

/* =========================
   DOWNLOAD + FEEDBACK
========================= */
downloadBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "pixel_paint.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

/* =========================
   EVENTS
========================= */
canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mouseleave", endPosition);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  startPosition(e);
});
canvas.addEventListener("touchend", endPosition);
canvas.addEventListener("touchcancel", endPosition);
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  draw(e);
});

/* =========================
   SERVICE WORKER
========================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

/* =========================
   earser logic
========================= */
eraserBtn.onclick = () => {
  erasing = !erasing;

  ctx.globalCompositeOperation = erasing
    ? "destination-out"
    : "source-over";

  eraserBtn.classList.toggle("active", erasing);
};
