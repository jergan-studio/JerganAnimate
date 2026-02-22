let stage = document.getElementById("stage");
let canvas = document.getElementById("drawCanvas");
let ctx = canvas.getContext("2d");
let colorPicker = document.getElementById("colorPicker");
let toolLabel = document.getElementById("toolLabel");
let fileInput = document.getElementById("fileInput");
let timeline = document.getElementById("timeline");

canvas.width = stage.clientWidth;
canvas.height = stage.clientHeight;

let tool = "select";
let drawing = false;
let objects = [];
let keyframes = {};
let totalFrames = 30;
let playing = false;

function setTool(t) {
  tool = t;
  toolLabel.innerText = t;
}

window.addEventListener("resize", () => {
  canvas.width = stage.clientWidth;
  canvas.height = stage.clientHeight;
});


// ===== DRAW TOOL =====
canvas.addEventListener("mousedown", (e) => {
  if (tool !== "draw") return;

  drawing = true;
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});


// ===== ADD RECTANGLE TOOL =====
stage.addEventListener("mousedown", (e) => {

  if (tool !== "rectangle") return;
  if (e.target !== stage) return;

  let box = document.createElement("div");
  box.className = "object";
  box.style.left = e.offsetX + "px";
  box.style.top = e.offsetY + "px";
  box.style.background = colorPicker.value;

  stage.appendChild(box);

  makeDraggable(box);

  objects.push({
    el: box,
    name: "box" + objects.length,
    scale: 1,
    rotation: 0
  });

  keyframes[objects.length - 1] = {};
  buildTimeline();
});


// ===== SELECT / MOVE =====
function makeDraggable(el) {
  el.onmousedown = function(e) {
    if (tool !== "select") return;

    let offsetX = e.clientX - el.offsetLeft;
    let offsetY = e.clientY - el.offsetTop;

    document.onmousemove = function(e) {
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
    };

    document.onmouseup = function() {
      document.onmousemove = null;
    };
  };
}


// ===== FILE INSERT =====
fileInput.onchange = function(e) {
  let file = e.target.files[0];
  if (!file) return;

  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.position = "absolute";
  img.style.left = "100px";
  img.style.top = "100px";
  img.style.width = "150px";

  stage.appendChild(img);
  makeDraggable(img);

  objects.push({
    el: img,
    name: file.name,
    scale: 1,
    rotation: 0
  });

  keyframes[objects.length - 1] = {};
  buildTimeline();
};


// ===== TIMELINE =====
function buildTimeline() {
  timeline.innerHTML = "";

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

      cell.onclick = function() {
        keyframes[index][f] = {
          x: obj.el.offsetLeft,
          y: obj.el.offsetTop
        };
        buildTimeline();
      };

      row.appendChild(cell);
    }

    timeline.appendChild(row);
  });
}


// ===== PLAY =====
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
      let p = keyframes[index][prev];
      let n = keyframes[index][next];

      obj.el.style.left =
        (p.x + (n.x - p.x) * progress) + "px";
      obj.el.style.top =
        (p.y + (n.y - p.y) * progress) + "px";
    });

    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}
