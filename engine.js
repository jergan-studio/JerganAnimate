let stage = document.getElementById("stage");
let timelineDiv = document.getElementById("timeline");
let fileInput = document.getElementById("fileInput");
let shapeSelect = document.getElementById("shapeSelect");
let totalFramesInput = document.getElementById("totalFramesInput");

let objects = [];
let keyframes = {}; // objectIndex -> {frame: {x, y, scale, rotation, type}}
let currentTool = "select";
let totalFrames = parseInt(totalFramesInput.value);
let playing = false;

function setTool(tool) { currentTool = tool; }

function addObject(el, name, type) {
  el.classList.add("object");
  stage.appendChild(el);

  objects.push({
    el, name, type, scale:1, rotation:0
  });

  keyframes[objects.length-1] = {};
  buildTimeline();
}

// -------------------- DRAW + INSERT --------------------
stage.addEventListener("mousedown", e => {
  if(currentTool === "draw"){
    let div = document.createElement("div");
    div.style.left = e.offsetX + "px";
    div.style.top = e.offsetY + "px";
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.background = "red";
    if(shapeSelect.value === "circle") div.style.borderRadius = "50%";
    makeSelectable(div);
    addObject(div, shapeSelect.value + objects.length, shapeSelect.value);
  }
});

fileInput.onchange = e => {
  let file = e.target.files[0];
  if(!file) return;
  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "120px";
  img.style.top = "50px";
  img.style.left = "50px";
  makeSelectable(img);
  addObject(img, file.name, "image");
};

// -------------------- SELECT / MOVE / SCALE / ROTATE --------------------
function makeSelectable(el){
  el.onmousedown = e => {
    if(currentTool === "select"){
      let offsetX = e.clientX - el.offsetLeft;
      let offsetY = e.clientY - el.offsetTop;
      document.onmousemove = e => {
        el.style.left = (e.clientX - offsetX) + "px";
        el.style.top = (e.clientY - offsetY) + "px";
      };
      document.onmouseup = () => { document.onmousemove = null; };
    }
    if(currentTool === "scale"){
      let obj = objects.find(o=>o.el===el);
      obj.scale += 0.1; updateTransform(obj);
    }
    if(currentTool === "rotate"){
      let obj = objects.find(o=>o.el===el);
      obj.rotation += 15; updateTransform(obj);
    }
  };
}

function updateTransform(obj){
  obj.el.style.transform = `scale(${obj.scale}) rotate(${obj.rotation}deg)`;
}

// -------------------- TIMELINE --------------------
function buildTimeline(){
  timelineDiv.innerHTML = "";
  objects.forEach((obj,index)=>{
    let row = document.createElement("div");
    row.className="row";

    let label = document.createElement("div");
    label.className="rowLabel";
    label.innerText=obj.name;
    row.appendChild(label);

    for(let f=1;f<=totalFrames;f++){
      let cell = document.createElement("div");
      cell.className="frame";
      if(keyframes[index][f]) { cell.innerText = "!"; cell.classList.add("key"); }
      cell.onclick = () => addKeyframe(index,f);
      row.appendChild(cell);
    }
    timelineDiv.appendChild(row);
  });
}

function addKeyframe(index, frame){
  let obj = objects[index];
  keyframes[index][frame] = {
    x: obj.el.offsetLeft,
    y: obj.el.offsetTop,
    scale: obj.scale,
    rotation: obj.rotation,
    type: obj.type
  };
  buildTimeline();
}

// -------------------- PLAY --------------------
function play(){
  playing=true;
  let frame=1;
  function animate(){
    if(!playing || frame>totalFrames){ playing=false; return; }
    objects.forEach((obj,index)=>{
      let frames = Object.keys(keyframes[index]).map(Number).sort((a,b)=>a-b);
      if(frames.length<2) return;
      let prev=frames[0], next=frames[frames.length-1];
      for(let i=0;i<frames.length;i++){ if(frames[i]<=frame) prev=frames[i]; if(frames[i]>=frame){ next=frames[i]; break; } }
      let progress = (frame-prev)/(next-prev||1);
      let prevData = keyframes[index][prev]; let nextData=keyframes[index][next];
      obj.el.style.left = lerp(prevData.x,nextData.x,progress)+"px";
      obj.el.style.top  = lerp(prevData.y,nextData.y,progress)+"px";
      obj.scale = lerp(prevData.scale,nextData.scale,progress);
      obj.rotation = lerp(prevData.rotation,nextData.rotation,progress);
      updateTransform(obj);
    });
    frame++; requestAnimationFrame(animate);
  }
  animate();
}

function lerp(a,b,t){ return a+(b-a)*t; }

// -------------------- TOTAL FRAMES --------------------
function updateTotalFrames(){
  totalFrames = parseInt(totalFramesInput.value);
  buildTimeline();
}

// -------------------- MP4 DOWNLOAD --------------------
async function downloadMP4(){
  alert("This feature requires external library (CCapture.js) to record canvas. We'll integrate next.");
}
