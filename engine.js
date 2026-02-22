let animations = {};
let objects = {};
let currentFrame = 1;
let maxFrame = 60;
let playing = false;

function compileJVES() {
  animations = {};
  objects = {};
  document.getElementById("stage").innerHTML = "";

  const code = document.getElementById("editor").innerText;

  const objectRegex = /object\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let objectMatch;

  while ((objectMatch = objectRegex.exec(code)) !== null) {
    const objectName = objectMatch[1];
    const objectBody = objectMatch[2];

    animations[objectName] = {};

    const frameRegex = /frame\s+(\d+)\s*\{([\s\S]*?)\}/g;
    let frameMatch;

    while ((frameMatch = frameRegex.exec(objectBody)) !== null) {
      const frameNumber = parseInt(frameMatch[1]);
      const frameBody = frameMatch[2];

      const props = {};
      const propRegex = /(\w+)\s*:\s*([-\d.]+)/g;
      let propMatch;

      while ((propMatch = propRegex.exec(frameBody)) !== null) {
        props[propMatch[1]] = parseFloat(propMatch[2]);
      }

      animations[objectName][frameNumber] = props;
      if (frameNumber > maxFrame) maxFrame = frameNumber;
    }

    createObject(objectName);
  }

  alert("JVES Compiled!");
}

function createObject(name) {
  const div = document.createElement("div");
  div.className = "object";
  div.id = name;
  document.getElementById("stage").appendChild(div);
  objects[name] = div;
}

function play() {
  currentFrame = 1;
  playing = true;
  animate();
}

function animate() {
  if (!playing) return;

  updateFrame(currentFrame);

  currentFrame++;
  if (currentFrame > maxFrame) {
    playing = false;
    return;
  }

  requestAnimationFrame(animate);
}

function updateFrame(frame) {
  for (let name in animations) {
    const frames = animations[name];
    const keys = Object.keys(frames).map(Number).sort((a,b)=>a-b);

    let prev = keys[0];
    let next = keys[keys.length - 1];

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] <= frame) prev = keys[i];
      if (keys[i] >= frame) {
        next = keys[i];
        break;
      }
    }

    const progress = (frame - prev) / (next - prev || 1);

    const prevProps = frames[prev];
    const nextProps = frames[next];

    const x = lerp(prevProps.x || 0, nextProps.x || 0, progress);
    const y = lerp(prevProps.y || 0, nextProps.y || 0, progress);
    const scale = lerp(prevProps.scale || 1, nextProps.scale || 1, progress);
    const rotation = lerp(prevProps.rotation || 0, nextProps.rotation || 0, progress);

    const el = objects[name];
    el.style.transform = `
      translate(${x}px, ${y}px)
      scale(${scale})
      rotate(${rotation}deg)
    `;
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
