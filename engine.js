let stage = document.getElementById("stage");
let timelineContainer = document.getElementById("timelineContainer");
let fileInput = document.getElementById("fileInput");
let currentFrameIndicator = document.getElementById("currentFrameIndicator");

let objects = [];
let keyframes = {};
let currentTool = "select";
let totalFrames = 60;
let playing = false;

function setTool(tool) {
  currentTool = tool;
}

function setTotalFrames() {
  let input = document.getElementById("frameCount");
  let value = parseInt(input.value);
  if (value > 0) {
    totalFrames = value;
    buildTimeline();
  }
}

function addObject(el, name) {
  el.classList.add("object");
  stage.appendChild(el);

  objects.push({ el, name, scale: 1, rotation: 0 });
  keyframes[objects.length - 1] = {};
  buildTimeline();
}

stage.addEventListener("mousedown", e => {
  if (currentTool === "draw") {
    let div = document.createElement("div");
    div.style.left = e.offsetX + "px";
    div.style.top = e.offsetY + "px";
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.background = "red";
    makeSelectable(div);
    addObject(div, "shape" + objects.length);
  }
});

fileInput.onchange = function(e) {
  let file = e.target.files[0];
  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "120px";
  img.style.height = "auto";
  img.style.left = "100px";
  img.style.top = "100px";
  makeSelectable(img);
  addObject(img, file.name);
};

function makeSelectable(el) {
  el.onmousedown = function(e) {
    if (currentTool === "select") {
      let offsetX = e.clientX - el.offsetLeft;
      let offsetY = e.clientY - el.offsetTop;

      document.onmousemove = function(e) {
        el.style.left = (e.clientX - offsetX) + "px";
        el.style.top = (e.clientY - offsetY) + "px";
      };
      document.onmouseup = () => { document.onmousemove = null; };
    }

    if (currentTool === "scale") {
      objects.forEach(obj => { if(obj.el === el){ obj.scale += 0.1; updateTransform(obj); }});
    }

    if (currentTool === "rotate") {
      objects.forEach(obj => { if(obj.el === el){ obj.rotation += 15; updateTransform(obj); }});
    }
  };
}

function updateTransform(obj) {
  obj.el.style.transform = `scale(${obj.scale}) rotate(${obj.rotation}deg)`;
}

function buildTimeline() {
  timelineContainer.innerHTML = "";

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
      cell.innerText = "";

      if (keyframes[index] && keyframes[index][f]) {
        cell.innerText = "!";
        cell.classList.add("key");
      }

      cell.onclick = () => addKeyframe(index, f);
      row.appendChild(cell);
    }

    timelineContainer.appendChild(row);
  });

  currentFrameIndicator.style.left = "0px";
}

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

function play() {
  playing = true;
  let frame = 1;

  let capturer = new CCapture({ format: 'webm', framerate: 60 });

  capturer.start();

  function animate() {
    if (!playing || frame > totalFrames) {
      capturer.stop();
      capturer.save();
      playing = false;
      return;
    }

    updateFrame(frame);

    // Move frame indicator
    currentFrameIndicator.style.left = (frame * 40 + 120) + "px";

    capturer.capture(stage);

    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}

function updateFrame(frame) {
  objects.forEach((obj, index) => {
    let frames = Object.keys(keyframes[index] || {}).map(Number).sort((a,b)=>a-b);
    if (frames.length < 1) return;

    let prev = frames[0];
    let next = frames[frames.length - 1];

    for (let i=0;i<frames.length;i++){
      if(frames[i]<=frame) prev=frames[i];
      if(frames[i]>=frame){ next=frames[i]; break;}
    }

    let progress = (frame-prev)/(next-prev || 1);
    let prevData = keyframes[index][prev];
    let nextData = keyframes[index][next] || prevData;

    obj.el.style.left = lerp(prevData.x, nextData.x, progress) + "px";
    obj.el.style.top = lerp(prevData.y, nextData.y, progress) + "px";
    obj.scale = lerp(prevData.scale, nextData.scale, progress);
    obj.rotation = lerp(prevData.rotation, nextData.rotation, progress);
    updateTransform(obj);
  });
}

function lerp(a,b,t){ return a + (b-a)*t; }

function downloadMP4() {
  alert("MP4 download will start after playback using CCapture.js!");
  play();
}
