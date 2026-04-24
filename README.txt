# P2P Chat

A peer-to-peer chat and collaborative drawing app built with Pear/Hyperswarm. No server required -> peers connect directly using a distributed hash table (DHT).

## Prerequisites
  - Node.js
  - Pear CLI: `npm install -g pear`

## Install

`npm install`

## Run

`pear run --dev .`

## To chat/draw

1. Enter a room name. If you want to join an existing room you need to know the room name. But if you want to begin a new room then think up a new name.

2. Someone else enters the same room name on their machine.

3. Hey presto. Chat, draw, be free.

## Open a 2nd local instance for testing:

`pear run --dev --tmp-store .`

## Drawing tools:

Pen -> freehand drawing
Line -> straight lines
Rectangle -> rectangle
Circle -> circle
Colour picker & stroke width - customise your line.
Clear - wipe canvas clean for everyone

## How the connection works

Pear uses [Hyperswarm](https://github.com/holepunchto/hyperswarm) to find peers on a DHT. When you enter a room name it is cryptographically hashed in a deterministic way, so the same input will always output the same topic key. This topic key is then used to find peers on the DHT who correspond to the same key. So there's no central server brokering the connection. The DHT is stored on thousands of nodes on the network making it resilient because there's no single point of failure or central storage that could be compromised