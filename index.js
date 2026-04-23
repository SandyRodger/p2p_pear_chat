/** @typedef {import('pear-interface')} */
import Runtime from 'pear-electron'
import Bridge from 'pear-bridge'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import crypto from 'hypercore-crypto'

const bridge = new Bridge({ mount: '/ui', waypoint: 'index.html' })
await bridge.ready()

let runtime = new Runtime()
let pipe
try {
  pipe = await runtime.start({ bridge })
} catch (err) {
  console.error('runtime.start failed:', err.message)
  Pear.exit(1)
}
pipe.on('close', () => Pear.exit())

const swarm = new Hyperswarm()
const peers = new Set()

swarm.on('connection', (conn) => {
  peers.add(conn)
  console.log('Peer connected, total:', peers.size)

  conn.on('data', (data) => {
    pipe.write(data)
  })

  conn.on('close', () => {
    peers.delete(conn)
    console.log('Peer disconnected, total:', peers.size)
  })
})

const topic = crypto.randomBytes(32);
const topicHex = b4a.toString(topic, 'hex');
pipe.write(JSON.stringify({ type: 'topic', key: topicHex }))

pipe.on('data', async (data) => {
  const msg = JSON.parse(Buffer.from(data).toString())

  if (msg.type === 'create') {
    const discovery = swarm.join(topic, {client: true, server: true })
    await discovery.flushed();
    console.log('Created room, topic:', topicHex)
  }

  if (msg.type === 'join') {
    const joinTopic = b4a.from(msg.key, 'hex');
    const discovery = swarm.join(joinTopic, {client: true, server: true })
    await discovery.flushed()
    console.log('Joined room, topic:', msg.key)
  }

  if (msg.type === 'message') {
    pipe.write(data)
    for (const conn of peers) {
      conn.write(data)
    }
  }
})