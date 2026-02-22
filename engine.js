let stage = document.getElementById("stage");
let timeline = document.getElementById("timeline");
let fileInput = document.getElementById("fileInput");

let objects = [];
let keyframes = {};
let tool = "draw";
let totalFrames = 30;
let playing = false;

function setTool(t) {
  tool = t;
}

function createObject(el, name) {
  el.classList.add("object");
  el.style.left = "100px";
  el.style.top = "100px";
  stage.appendChild(el);

  objects.push({
    el: el,
    name: name,
    scale: 1,
    rotation: 0
  });

  keyframes[objects.length - 1] = {};
  buildTimeline();
}

stage.addEventListener("mousedown", function(e) {

  if (tool === "draw") {
    let div = document.createElement("div");
    div.style.left = e.offsetX + "px";
    div.style.top = e.offsetY + "px";
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.background = "red";

    createObject(div, "shape" + objects.length);
  }

  if (tool === "select") {
    let target = e.target;
    if (!target.classList.contains("object")) return;

    let offsetX = e.clientX - target.offsetLeft;
    let offsetY = e.clientY - target.offsetTop;

    document.onmousemove = function(e) {
      target.style.left = (e.clientX - offsetX) + "px";
      target.style.top = (e.clientY - offsetY) + "px";
    };

    document.onmouseup = function() {
      document.onmousemove = null;
    };
  }

  if (tool === "scale") {
    let target = e.target;
    objects.forEach(obj => {
      if (obj.el === target) {
        obj.scale += 0.1;
        updateTransform(obj);
      }
    });
  }

  if (tool === "rotate") {
    let target = e.target;
    objects.forEach(obj => {
      if (obj.el === target) {
        obj.rotation += 15;
        updateTransform(obj);
      }
    });
  }

});

fileInput.onchange = function(e) {
  let file = e.target.files[0];
  if (!file) return;

  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "120px";

  createObject(img, file.name);
};

function updateTransform(obj) {
  obj.el.style.transform =
    "scale(" + obj.scale + ") rotate(" + obj.rotation + "deg)";
}

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
          y: obj.el.offsetTop,
          scale: obj.scale,
          rotation: obj.rotation
        };
        buildTimeline();
      };

      row.appendChild(cell);
    }

    timeline.appendChild(row);
  });
}

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

      obj.scale =
        p.scale + (n.scale - p.scale) * progress;

      obj.rotation =
        p.rotation + (n.rotation - p.rotation) * progress;

      updateTransform(obj);
    });

    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}
