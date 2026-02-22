let stage = document.getElementById("stage");
let timeline = document.getElementById("timeline");
let fileInput = document.getElementById("fileInput");

let objects = []; // {el, name, scale, rotation}
let keyframes = {}; // objectIndex -> frame -> {x, y, scale, rotation}

let currentTool = "select";
let totalFrames = 30;
let playing = false;

// --- TOOL SYSTEM ---
function setTool(tool) {
  currentTool = tool;
}

// --- ADD OBJECTS ---
function addObject(el, name) {
  el.classList.add("object");
  stage.appendChild(el);

  objects.push({el, name, scale:1, rotation:0});
  keyframes[objects.length-1] = {};
  buildTimeline();
  makeInteractive(el);
}

// --- INTERACTIVE OBJECTS ---
function makeInteractive(el) {
  el.onmousedown = function(e){
    if(currentTool === "select"){
      let offsetX = e.clientX - el.offsetLeft;
      let offsetY = e.clientY - el.offsetTop;

      document.onmousemove = function(e){
        el.style.left = (e.clientX - offsetX) + "px";
        el.style.top = (e.clientY - offsetY) + "px";
      }

      document.onmouseup = function(){
        document.onmousemove = null;
      }
    }

    if(currentTool === "scale" || currentTool === "rotate"){
      let obj = objects.find(o => o.el === el);
      if(currentTool === "scale") obj.scale += 0.1;
      if(currentTool === "rotate") obj.rotation += 15;
      updateTransform(obj);
    }
  }
}

// --- TRANSFORM UPDATE ---
function updateTransform(obj){
  obj.el.style.transform = `scale(${obj.scale}) rotate(${obj.rotation}deg)`;
}

// --- DRAW TOOL ---
stage.addEventListener("mousedown", e => {
  if(currentTool === "draw"){
    let div = document.createElement("div");
    div.style.left = e.offsetX + "px";
    div.style.top = e.offsetY + "px";
    div.style.width = "80px";
    div.style.height = "80px";
    div.style.background = "red";
    addObject(div, "shape"+objects.length);
  }
});

// --- FILE INSERT ---
fileInput.onchange = function(e){
  let file = e.target.files[0];
  if(!file) return;

  let img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.width = "120px";
  img.style.height = "auto";
  img.style.left = "50px";
  img.style.top = "50px";
  addObject(img, file.name);
}

// --- TIMELINE ---
function buildTimeline(){
  timeline.innerHTML = "";

  objects.forEach((obj,index)=>{
    let row = document.createElement("div");
    row.className = "row";

    let label = document.createElement("div");
    label.className = "rowLabel";
    label.innerText = obj.name;
    row.appendChild(label);

    for(let f=1;f<=totalFrames;f++){
      let cell = document.createElement("div");
      cell.className = "frame";

      if(keyframes[index][f]) {
        cell.innerText = "!";
        cell.classList.add("key");
      }

      cell.onclick = ()=> addKeyframe(index,f);
      row.appendChild(cell);
    }

    timeline.appendChild(row);
  });
}

// --- ADD KEYFRAME ---
function addKeyframe(index, frame){
  let obj = objects[index];
  keyframes[index][frame] = {
    x: obj.el.offsetLeft,
    y: obj.el.offsetTop,
    scale: obj.scale,
    rotation: obj.rotation
  };
  buildTimeline();
}

// --- PLAY ANIMATION ---
function play(){
  playing = true;
  let frame = 1;

  function animate(){
    if(!playing || frame>totalFrames){
      playing=false;
      return;
    }

    objects.forEach((obj,index)=>{
      let frames = Object.keys(keyframes[index]).map(Number).sort((a,b)=>a-b);
      if(frames.length<2) return;

      let prev = frames[0], next = frames[frames.length-1];
      for(let i=0;i<frames.length;i++){
        if(frames[i]<=frame) prev=frames[i];
        if(frames[i]>=frame) {next=frames[i]; break;}
      }

      let progress = (frame-prev)/(next-prev||1);
      let prevData = keyframes[index][prev];
      let nextData = keyframes[index][next];

      obj.el.style.left = lerp(prevData.x,nextData.x,progress)+"px";
      obj.el.style.top = lerp(prevData.y,nextData.y,progress)+"px";
      obj.scale = lerp(prevData.scale,nextData.scale,progress);
      obj.rotation = lerp(prevData.rotation,nextData.rotation,progress);
      updateTransform(obj);
    });

    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}

// --- LINEAR INTERPOLATION ---
function lerp(a,b,t){
  return a + (b-a)*t;
}
