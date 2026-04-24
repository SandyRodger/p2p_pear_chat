/** @typedef {import('pear-interface')} */ /* global Pear */
import pearPipe from 'pear-pipe'

const topicKeyEl = document.getElementById('topic-key')
const messagesEl = document.getElementById('messages')
const inputEl = document.getElementById('input')
const sendEl = document.getElementById('send')
const joinScreenEl = document.getElementById('join-screen');
const roomInputEl = document.getElementById('room-input');
const joinBtnEl = document.getElementById('join-btn')
let penPoints = [];

let myId = Math.random().toString(36).slice(2, 8)
const pipe = pearPipe();

function enterChat(roomName) {
  topicKeyEl.textContent = 'Room: ' + roomName
  joinScreenEl.style.display = 'none'
}

joinBtnEl.onclick = () => {
  const roomName = roomInputEl.value.trim()
  if (!roomName) return
  enterChat(roomName)
  pipe.write(JSON.stringify({ type: 'join', roomName }))
}

roomInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtnEl.onclick();
})

pipe.on('data', (data) => {
  const msg = JSON.parse(Buffer.from(data).toString())
  if (msg.type === 'message') {
    addMessage(msg.sender, msg.text, msg.sender === myId)
  }
  if (msg.type === 'draw') {
    handleRemoteDraw(msg.payload);
  }
})

pipe.on('close', () => Pear.exit())

function addMessage(sender, text, isMine) {
  const div = document.createElement('div')
  div.className = 'message' + (isMine ? ' mine' : '');

  const senderEl = document.createElement('div')
  senderEl.className = 'sender';
  senderEl.textContent = isMine ? 'you' : sender;

  const textEl = document.createElement('div')
  textEl.textContent = text;

  div.appendChild(senderEl)
  div.appendChild(textEl)
  messagesEl.appendChild(div)
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return
  pipe.write(JSON.stringify({ type: 'message', sender: myId, text }))
  inputEl.value = ''
}

sendEl.addEventListener('click', sendMessage)
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
})

// CANVAS SETUP 

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0 ,0)
  ctx.scale(dpr, dpr)
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas)

// TOOL STATE

let currentTool = 'pen';
let currentColor = '#000000';
let currentWidth = 3;
let isDrawing = false;
let startX = 0;
let startY = 0;
let snapshot = null;

// TOOLBAR WIRING

const tools = ['pen', 'line', 'rect', 'circle']
tools.forEach(tool => {
  document.getElementById('tool-' + tool).onclick = () => {
    currentTool = tool;
    tools.forEach(t => document.getElementById('tool-' + t).classList.remove('active'))
    document.getElementById('tool-' + tool).classList.add('active')
  }
})

document.getElementById('color-picker').oninput = (e) => { currentColor = e.target.value }

document.getElementById('tool-clear').onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  broadcastDraw({ type: 'clear' })
}

// DRAWING

function getPos(e) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left),
    y: (e.clientY - rect.top)
  }
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const pos = getPos(e);
  startX = pos.x;
  startY = pos.y;
  penPoints = [pos];
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  ctx.moveTo(startX, startY)

  if (currentTool === 'pen') {
    ctx.beginPath()
    ctx.moveTo(startX, startY)
  }
})

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return
  const pos = getPos(e)

  if (currentTool === 'pen') {
    ctx.strokeStyle = currentColor
    ctx.lineWidth = currentWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    penPoints.push(pos)
  } else {
    ctx. putImageData(snapshot, 0, 0)
    drawShape({tool: currentTool, x1: startX, y1: startY, x2: pos.x, y2: pos.y, color: currentColor, width: currentWidth })
  }

  drawShape(currentTool, startX, startY, pos.x, pos.y, currentColor, currentWidth)
})

canvas.addEventListener('mouseup', (e) => {
  if (!isDrawing) return
  isDrawing = false
  const pos = getPos(e);

  if (currentTool === 'pen') {    
    broadcastDraw({
      type: 'draw',
      tool: 'pen',
      points: penPoints,
      color: currentColor,
      width: currentWidth
    })
  } else {
    broadcastDraw({
      type: 'draw',
      tool: currentTool,
      x1: startX, y1: startY,
      x2: pos.x, y2: pos.y,
      color: currentColor,
      width: currentWidth
    })
  }
})

canvas.addEventListener('mouseleave', () => { isDrawing = false 
})

function drawShape(payload) {
  ctx.strokeStyle = payload.color;
  ctx.lineWidth = payload.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (payload.tool === 'pen') {
    ctx.beginPath()
    ctx.moveTo(payload.points[0].x, payload.points[0].y)
    for (const p of payload.points) {
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  } else if (payload.tool === 'line') {
    ctx.beginPath()
    ctx.moveTo(payload.x1, payload.y1)
    ctx.lineTo(payload.x2, payload.y2)
    ctx.stroke()
  } else if (payload.tool === 'rect') {
    ctx.beginPath()
    ctx.strokeRect(payload.x1, payload.y1, payload.x2 - payload.x1, payload.y2 - payload.y1)
  } else if (payload.tool === 'circle') {
    const rx = (payload.x2 - payload.x1) / 2
    const ry = (payload.y2 - payload.y1) / 2
    ctx.beginPath()
    ctx.ellipse(payload.x1 + rx, payload.y1 + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI)
    ctx.stroke()
  }
}

// BROADCAST DRAW EVENTS
function broadcastDraw(drawMsg) {
  pipe.write(JSON.stringify({ type: 'draw', payload: drawMsg }))
}

// RECEIVE DRAW EVENTS 

function handleRemoteDraw(payload) {
  if (payload.type === 'clear') {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }
  drawShape(payload)
}