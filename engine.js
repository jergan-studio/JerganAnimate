let stage = document.getElementById("stage");
let timelineDiv = document.getElementById("timeline");
let fileInput = document.getElementById("fileInput");

let objects = [];
let keyframes = {};
let currentTool = "select";
let totalFrames = 30;
let playing = false;

// Tool selection
function setTool(tool) { currentTool = tool; }

// Add new object
function addObject(el, name) {
  el.classList.add("object");
  stage.appendChild(el);

  objects.push({
    el: el,
    name: name,
    scale: 1,
    rotation: 0
  });

  keyframes[objects.length - 1] = {};
  makeSelectable(el);
  buildTimeline();
}

// Make object draggable and allow transform tools
function makeSelectable(el) {
  el.onmousedown = function(e) {
    e.preventDefault();
    let obj = objects.find(o => o.el === el);
    if (!obj) return;

    // Move tool
    if (currentTool === "select") {
      let offsetX = e.clientX - el.offsetLeft;
      let offsetY = e.clientY - el.offsetTop;

      document.onmousemove = function(e) {
        el.style.left = (e.clientX - offsetX) + "px";
        el.style.top = (e.clientY - offsetY) + "px";
      };

      document.onmouseup = function() { document.onmousemove = null; };
    }

    // Scale tool
    if (currentTool === "scale") {
      obj.scale += 0.1;
      updateTransform(obj);
    }

    // Rotate tool
    if (currentTool === "rotate") {
      obj.rotation += 15;
      updateTransform(obj);
    }
  };
}

function updateTransform(obj) {
  obj.el.style.transform =
    `scale(${obj.scale}) rotate(${obj.rotation}deg)`;
}

// Build horizontal timeline
function buildTimeline() {
  timelineDiv.innerHTML = "";

  objects.forEach((obj, index) => {
    let row = document.createElement("div");
    row.className = "row";

    let label = document.createElement("div");
    label.className = "rowLabel";
    label.innerText = obj.name;
    row.appendChild(label);

    for (let f = 1; f <= totalFrames; f++) {
      let cell = document.createElement("div");
      cell.className = "frame";
      if (keyframes[index][f]) {
        cell.innerText = "!";
        cell.classList.add("key");
      }

      cell.onclick = () => addKeyframe(index, f);
      row.appendChild(cell);
    }

    timelineDiv.appendChild(row);
  });
}

// Add keyframe
function addKeyframe(index, frame) {
  let obj = objects[index];
  keyframes[index][frame] = {
    x: obj.el.offsetLeft,
    y: obj.el.offsetTop,
    scale: obj.scale,
    rotation: obj.rotation
  };
  buildTimeline();
}

// Draw tool
stage.addEventListener("mousedown", e => {
  if (currentTool === "draw") {
    let rect = document.createElement("div");
    rect.style.left = (e.offsetX - 50) + "px"; // center
    rect.style.top = (e.offsetY - 50) + "px";
    rect.style.width = "100px";
    rect.style.height = "100px";
    rect.style.background = "red";
    addObject(rect, "shape" + objects.length);
  }
});

// File input
fileInput.onchange = function(e) {
  let file = e.target.files[0];
  if (!file) return;
  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "120px";
  img.style.left = "50px";
  img.style.top = "50px";
  img.style.position = "absolute";
  addObject(img, file.name);
};

// Play animation
function play() {
  playing = true;
  let frame = 1;

  function animate() {
    if (!playing || frame > totalFrames) {
      playing = false;
      return;
    }

    objects.forEach((obj, index) => {
      let frames = Object.keys(keyframes[index]).map(Number).sort((a,b)=>a-b);
      if (frames.length < 2) return;

      let prev = frames[0], next = frames[frames.length-1];
      for (let i=0;i<frames.length;i++) {
        if (frames[i] <= frame) prev=frames[i];
        if (frames[i] >= frame) { next=frames[i]; break; }
      }

      let progress = (frame - prev) / (next - prev || 1);
      let prevData = keyframes[index][prev];
      let nextData = keyframes[index][next];

      obj.el.style.left = lerp(prevData.x,nextData.x,progress) + "px";
      obj.el.style.top = lerp(prevData.y,nextData.y,progress) + "px";
      obj.scale = lerp(prevData.scale,nextData.scale,progress);
      obj.rotation = lerp(prevData.rotation,nextData.rotation,progress);
      updateTransform(obj);
    });

    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}

function lerp(a,b,t){ return a + (b - a)*t; }
