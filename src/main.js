import { Camera } from '@mediapipe/camera_utils';
import { Hands } from '@mediapipe/hands';

const videoElement = document.querySelector('video');
const cursorElement = document.querySelector('.cursor');

const width = window.innerWidth;
const height = window.innerHeight;

const handParts = {
  wrist: 0,
  thumb: { base: 1, middle: 2, topKnuckle: 3, tip: 4 },
  indexFinger: { base: 5, middle: 6, topKnuckle: 7, tip: 8 },
  middleFinger: { base: 9, middle: 10, topKnuckle: 11, tip: 12 },
  ringFinger: { base: 13, middle: 14, topKnuckle: 15, tip: 16 },
  pinky: { base: 17, middle: 18, topKnuckle: 19, tip: 20 },
};

const hands = new Hands({
  locateFile: (file) => `../node_modules/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0
});
hands.onResults(onResults);


const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  facingMode: undefined,
  width,
  height,
});
camera.start();

const getFingerCoords = (landmarks) => landmarks[handParts.indexFinger.tip];

const convertCoordsToDomPosition = ({ x, y }) => ({
  x: `${x * 100}vw`,
  y: `${y * 100}vh`,
});

function updateCursorPosition(landmarks) {
  const fingerCoords = getFingerCoords(landmarks);
  if (!fingerCoords) return;

  const { x, y } = convertCoordsToDomPosition(fingerCoords);

  const convertedX = 100 - parseFloat(x.split('vw')[0]) + 'vw';

  cursorElement.style.transform = `translate(${convertedX}, ${y})`;
}

function onResults(handData) {
  if (!handData.multiHandLandmarks.length) return;

  updateCursorPosition(handData.multiHandLandmarks[0]);

  if (isPinched(handData.multiHandLandmarks[0])) {
console.log(getHandCoordsInPx(handData.multiHandLandmarks[0]));
    drawCircle(getHandCoordsInPx(handData.multiHandLandmarks[0]).x, getHandCoordsInPx(handData.multiHandLandmarks[0]).y);
  }
}

function drawCircle(x, y) {
  const canvas = document.getElementById('canvas')
  const context = canvas.getContext('2d');
  const radius = 3;

  context.fillStyle = '#003300';

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fill();
}

function isPinched(landmarks) {
  const fingerTip = landmarks[handParts.indexFinger.tip];
  const thumbTip = landmarks[handParts.thumb.tip];
  if (!fingerTip || !thumbTip) return;

  const distance = {
    x: Math.abs(fingerTip.x - thumbTip.x),
    y: Math.abs(fingerTip.y - thumbTip.y),
    z: Math.abs(fingerTip.z - thumbTip.z),
  };

  return distance.x < 0.08 && distance.y < 0.08 && distance.z < 0.11;
}

function getHandCoordsInPx(landmarks) {
  const fingerCoords = getFingerCoords(landmarks);
  if (!fingerCoords) return;

  const x = 100 - fingerCoords.x * 100;
  const y = fingerCoords.y * 100;

  return {
    x: x*width/100,
    y: y*height/100,
  };
}
