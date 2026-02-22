const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const timelineDiv = document.getElementById("timeline");
const fileInput = document.getElementById("fileInput");
const totalFramesInput = document.getElementById("totalFramesInput");

let objects = []; // {type, x, y, width, height, scale, rotation, img}
let keyframes = []; // objectIndex -> { frame: { x, y, scale, rotation } }
let currentTool = "select";
let totalFrames = parseInt(totalFramesInput.value);
let playing = false;

let selected = null;
let dragOffset = { x: 0, y: 0 };

// TOOL SETUP
function setTool(tool) {
  currentTool = tool;
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (currentTool === "draw") {
    let obj = { type: "rect", x: mouseX, y: mouseY, width: 100, height: 100, scale: 1, rotation: 0 };
    objects.push(obj);
    keyframes.push({});
    buildTimeline();
    drawStage();
  } else if (currentTool === "select") {
    selected = objects.find(o => mouseX >= o.x && mouseX <= o.x + o.width * o.scale && mouseY >= o.y && mouseY <= o.y + o.height * o.scale);
    if (selected) {
      dragOffset.x = mouseX - selected.x;
      dragOffset.y = mouseY - selected.y;
    }
  } else if (currentTool === "scale" && selected) {
    selected.scale += 0.1;
    drawStage();
  } else if (currentTool === "rotate" && selected) {
    selected.rotation += 15;
    drawStage();
  }
});

canvas.addEventListener("mousemove", e => {
  if (selected && currentTool === "select") {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    selected.x = mouseX - dragOffset.x;
    selected.y = mouseY - dragOffset.y;
    drawStage();
  }
});

canvas.addEventListener("mouseup", () => selected = null);

// INSERT IMAGE
fileInput.onchange = function(e) {
  const file = e.target.files[0];
  const img = new Image();
  img.onload = () => {
    let obj = { type: "image", img, x: 100, y: 100, width: img.width, height: img.height, scale: 1, rotation: 0 };
    objects.push(obj);
    keyframes.push({});
    buildTimeline();
    drawStage();
  };
  img.src = URL.createObjectURL(file);
};

// TIMELINE
function buildTimeline() {
  totalFrames = parseInt(totalFramesInput.value);
  timelineDiv.innerHTML = "";
  objects.forEach((obj, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("div");
    label.className = "rowLabel";
    label.innerText = obj.type + " " + idx;
    row.appendChild(label);

    for (let f = 1; f <= totalFrames; f++) {
      const cell = document.createElement("div");
      cell.className = "frame";
      if (keyframes[idx][f]) cell.innerText = "!";
      cell.onclick = () => {
        keyframes[idx][f] = { x: obj.x, y: obj.y, scale: obj.scale, rotation: obj.rotation };
        buildTimeline();
      };
      row.appendChild(cell);
    }

    timelineDiv.appendChild(row);
  });
}

// DRAW
function drawStage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  objects.forEach(o => {
    ctx.save();
    ctx.translate(o.x + (o.width*o.scale)/2, o.y + (o.height*o.scale)/2);
    ctx.rotate(o.rotation * Math.PI/180);
    ctx.scale(o.scale, o.scale);
    ctx.translate(-(o.width)/2, -(o.height)/2);
    if (o.type === "rect") {
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, o.width, o.height);
    } else if (o.type === "image") {
      ctx.drawImage(o.img, 0, 0, o.width, o.height);
    }
    ctx.restore();
  });
}

// PLAY ANIMATION
function play() {
  playing = true;
  let frame = 1;

  function animate() {
    if (!playing || frame > totalFrames) return;

    objects.forEach((o, idx) => {
      const frames = Object.keys(keyframes[idx]).map(Number).sort((a,b)=>a-b);
      if (frames.length < 2) return;

      let prev = frames[0], next = frames[frames.length-1];
      for (let i = 0; i < frames.length; i++) {
        if (frames[i] <= frame) prev = frames[i];
        if (frames[i] >= frame) { next = frames[i]; break; }
      }

      let t = (frame - prev)/(next-prev || 1);
      let prevData = keyframes[idx][prev];
      let nextData = keyframes[idx][next];

      o.x = lerp(prevData.x, nextData.x, t);
      o.y = lerp(prevData.y, nextData.y, t);
      o.scale = lerp(prevData.scale, nextData.scale, t);
      o.rotation = lerp(prevData.rotation, nextData.rotation, t);
    });

    drawStage();
    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}

function lerp(a,b,t){ return a + (b-a)*t; }

// DOWNLOAD MP4
function downloadMP4() {
  const capturer = new CCapture({ format: 'webm', framerate: 60 });
  let frame = 1;
  playing = true;

  capturer.start();

  function animate() {
    if (frame > totalFrames) {
      capturer.stop();
      capturer.save();
      playing = false;
      drawStage();
      return;
    }

    objects.forEach((o, idx) => {
      const frames = Object.keys(keyframes[idx]).map(Number).sort((a,b)=>a-b);
      if (frames.length < 2) return;

      let prev = frames[0], next = frames[frames.length-1];
      for (let i = 0; i < frames.length; i++) {
        if (frames[i] <= frame) prev = frames[i];
        if (frames[i] >= frame) { next = frames[i]; break; }
      }

      let t = (frame - prev)/(next-prev || 1);
      let prevData = keyframes[idx][prev];
      let nextData = keyframes[idx][next];

      o.x = lerp(prevData.x, nextData.x, t);
      o.y = lerp(prevData.y, nextData.y, t);
      o.scale = lerp(prevData.scale, nextData.scale, t);
      o.rotation = lerp(prevData.rotation, nextData.rotation, t);
    });

    drawStage();
    capturer.capture(canvas);
    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}
