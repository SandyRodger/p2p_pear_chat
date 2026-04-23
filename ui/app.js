/** @typedef {import('pear-interface')} */ /* global Pear */
import pearPipe from 'pear-pipe'

const topicKeyEl = document.getElementById('topic-key')
const messagesEl = document.getElementById('messages')
const inputEl = document.getElementById('input')
const sendEl = document.getElementById('send')

const joinScreenEl = document.getElementById('join-screen');
const createBtnEl = document.getElementById('create-btn');
const joinBtnEl = document.getElementById('join-btn')
const joinInputEl = document.getElementById('join-input')

let myId = Math.random().toString(36).slice(2, 8)

const pipe = pearPipe();

function enterChat(topicKey) {
  topicKeyEl.textContent = topicKey
  joinScreenEl.style.display = 'none'
}

pipe.on('data', (data) => {
  const msg = JSON.parse(Buffer.from(data).toString())

  if (msg.type === 'topic') {
    createBtnEl.onclick = () => {
      enterChat(msg.key)
      pipe.write(JSON.stringify({ type: 'create', key: msg.key }))
    }
    return
  }

  if (msg.type === 'message') {
    addMessage(msg.sender, msg.text, msg.sender === myId)
  }

})

joinBtnEl.onclick = () => {
  const key = joinInputEl.value.trim()
  if (!key) return
  enterChat(key)
  pipe.write(JSON.stringify({ type: 'join', key }))
}

joinInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtnEl.onclick()
})

pipe.on('close', () => Pear.exit())

function addMessage(sender, text, isMine) {
  const div = document.createElement('div');
  div.className = 'message' + (isMine ? ' mine' : '');

  const senderEl = document.createElement('div')
  senderEl.className = 'sender';
  senderEl.textContent = isMine ? 'you' : sender;

  const textEl = document.createElement('div');
  textEl.textContent = text;

  div.appendChild(senderEl)
  div.appendChild(textEl)
  messagesEl.appendChild(div)
  messagesEl.scrollTop = messagesEl.scrollHeight

}

function sendMessage() {
  const text = inputEl.value.trim()
  if (!text) return

  pipe.write(JSON.stringify({
    type: 'message',
    sender: myId,
    text
  }))

  inputEl.value = ''
}

sendEl.addEventListener('click', sendMessage)

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
})
