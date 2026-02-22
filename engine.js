let currentTool = "select";
let stage = document.getElementById("stage");
let timeline = document.getElementById("timeline");
let fileInput = document.getElementById("fileInput");

let objects = [];
let selected = null;
let currentFrame = 1;
let maxFrames = 60;
let playing = false;

let keyframes = {}; // objectID -> frame -> transform

// Build timeline
for (let i = 1; i <= maxFrames; i++) {
  let frame = document.createElement("div");
  frame.className = "frame";
  frame.innerText = i;
  frame.onclick = () => selectFrame(i);
  frame.id = "frame-" + i;
  timeline.appendChild(frame);
}

function selectFrame(frame) {
  currentFrame = frame;
  document.querySelectorAll(".frame").forEach(f => f.classList.remove("activeFrame"));
  document.getElementById("frame-" + frame).classList.add("activeFrame");
}

function setTool(tool) {
  currentTool = tool;
}

let startX, startY;

stage.addEventListener("mousedown", e => {
  if (currentTool === "draw") {
    let rect = document.createElement("div");
    rect.className = "object";
    rect.style.left = e.offsetX + "px";
    rect.style.top = e.offsetY + "px";
    stage.appendChild(rect);

    makeDraggable(rect);

    objects.push(rect);
    selected = rect;
  }
});

function makeDraggable(el) {
  el.onmousedown = function (e) {
    if (currentTool !== "select") return;
    selected = el;
    startX = e.clientX - el.offsetLeft;
    startY = e.clientY - el.offsetTop;

    document.onmousemove = function (e) {
      el.style.left = (e.clientX - startX) + "px";
      el.style.top = (e.clientY - startY) + "px";
    };

    document.onmouseup = function () {
      document.onmousemove = null;
    };
  };
}

fileInput.onchange = function (e) {
  let file = e.target.files[0];
  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.className = "object";
  img.style.width = "120px";
  img.style.height = "auto";
  stage.appendChild(img);

  makeDraggable(img);

  objects.push(img);
  selected = img;
};

function addKeyframe() {
  if (!selected) return;

  let id = objects.indexOf(selected);
  if (!keyframes[id]) keyframes[id] = {};

  keyframes[id][currentFrame] = {
    x: selected.offsetLeft,
    y: selected.offsetTop
  };

  let diamond = document.createElement("div");
  diamond.className = "keyframe";
  document.getElementById("frame-" + currentFrame).appendChild(diamond);
}

function play() {
  playing = true;
  let frame = 1;

  function animate() {
    if (!playing || frame > maxFrames) {
      playing = false;
      return;
    }

    updateFrame(frame);
    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}

function updateFrame(frame) {
  objects.forEach((obj, index) => {
    if (!keyframes[index]) return;

    let frames = Object.keys(keyframes[index]).map(Number).sort((a,b)=>a-b);
    let prev = frames[0];
    let next = frames[frames.length - 1];

    for (let i = 0; i < frames.length; i++) {
      if (frames[i] <= frame) prev = frames[i];
      if (frames[i] >= frame) {
        next = frames[i];
        break;
      }
    }

    let progress = (frame - prev) / (next - prev || 1);

    let prevData = keyframes[index][prev];
    let nextData = keyframes[index][next];

    let x = lerp(prevData.x, nextData.x, progress);
    let y = lerp(prevData.y, nextData.y, progress);

    obj.style.left = x + "px";
    obj.style.top = y + "px";
  });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
