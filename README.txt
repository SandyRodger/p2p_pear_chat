# 08_chat -> P2P Chat

A peer-to-peer chat build with Pear/Hyperswarm. No server required.

## prerequisites
  - Node.js
  - Pear: `npx pear`

## Install

npm install

## Run

pear run -- dev .

## To chat

1. One person clicks 'Create new Room' and shares the topic key
2. The other person clicks 'join room' and pastes the key in.
3. Hey presto. Chat

## Open a 2nd local instance for testing:

pear run --dev --tmp-store .