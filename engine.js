let stage = document.getElementById("stage");
let timelineDiv = document.getElementById("timeline");

let objects = [];
let keyframes = {}; // objectIndex -> { frame: {x,y} }

let totalFrames = 30;
let currentFrame = 1;
let playing = false;

function addSphere() {
  let sphere = document.createElement("div");
  sphere.className = "object";
  sphere.style.left = "50px";
  sphere.style.top = "50px";
  stage.appendChild(sphere);

  makeDraggable(sphere);

  objects.push(sphere);
  buildTimeline();
}

function makeDraggable(el) {
  el.onmousedown = function (e) {
    let offsetX = e.clientX - el.offsetLeft;
    let offsetY = e.clientY - el.offsetTop;

    document.onmousemove = function (e) {
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
    };

    document.onmouseup = function () {
      document.onmousemove = null;
    };
  };
}

function buildTimeline() {
  timelineDiv.innerHTML = "";

  let table = document.createElement("table");

  // Header row
  let header = document.createElement("tr");
  header.appendChild(document.createElement("th"));

  for (let f = 1; f <= totalFrames; f++) {
    let th = document.createElement("th");
    th.innerText = f;
    header.appendChild(th);
  }

  table.appendChild(header);

  // Object rows
  objects.forEach((obj, index) => {
    let row = document.createElement("tr");

    let label = document.createElement("td");
    label.innerText = "sphere " + index;
    label.className = "rowLabel";
    row.appendChild(label);

    for (let f = 1; f <= totalFrames; f++) {
      let cell = document.createElement("td");

      cell.onclick = () => addKeyframe(index, f, cell);

      if (keyframes[index] && keyframes[index][f]) {
        cell.innerText = "!";
        cell.classList.add("keyframe");
      }

      row.appendChild(cell);
    }

    table.appendChild(row);
  });

  timelineDiv.appendChild(table);
}

function addKeyframe(index, frame, cell) {
  if (!keyframes[index]) keyframes[index] = {};

  keyframes[index][frame] = {
    x: objects[index].offsetLeft,
    y: objects[index].offsetTop
  };

  buildTimeline();
}

function play() {
  playing = true;
  currentFrame = 1;
  animate();
}

function animate() {
  if (!playing || currentFrame > totalFrames) {
    playing = false;
    return;
  }

  updateFrame(currentFrame);

  currentFrame++;
  requestAnimationFrame(animate);
}

function updateFrame(frame) {
  objects.forEach((obj, index) => {
    if (!keyframes[index]) return;

    let frames = Object.keys(keyframes[index]).map(Number).sort((a,b)=>a-b);
    if (frames.length < 2) return;

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
