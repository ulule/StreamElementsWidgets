#!/usr/bin/env node

import { readFile } from 'node:fs/promises'

const [fixturePath] = process.argv.slice(2)
const accountId = process.env.STREAMELEMENTS_ACCOUNT_ID
const overlayId = process.env.STREAMELEMENTS_OVERLAY_ID
const jwt = process.env.STREAMELEMENTS_JWT

if (!fixturePath) {
  console.error('Usage: node testing/send-alert-event.mjs testing/alert-events/<fixture>.json')
  process.exit(1)
}

if (!accountId) {
  console.error('Missing STREAMELEMENTS_ACCOUNT_ID.')
  process.exit(1)
}

if (!jwt) {
  console.error('Missing STREAMELEMENTS_JWT.')
  process.exit(1)
}

const payload = JSON.parse(await readFile(fixturePath, 'utf8'))

if (!payload.event || payload.data === undefined) {
  console.error('Expected a payload shaped like { "event": "order", "data": { ... } }.')
  process.exit(1)
}

const broadcastPayload = {
  target: overlayId || 'global',
  event: payload.event,
  data: payload.data,
}

const response = await fetch(`https://api.streamelements.com/kappa/v2/overlays/${accountId}/broadcast`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(broadcastPayload),
})

const responseBody = await response.text()

if (!response.ok) {
  console.error(`StreamElements returned ${response.status} ${response.statusText}.`)
  if (responseBody) {
    console.error(responseBody)
  }
  if (response.status === 403) {
    console.error('Check that STREAMELEMENTS_ACCOUNT_ID is the account/channel ID from the JWT, not the overlay ID.')
  }
  if (response.status === 404) {
    console.error('Check that the Account ID belongs to the JWT owner and that the overlay is active.')
  }
  process.exit(1)
}

console.log(`Sent "${payload.event}" event from ${fixturePath} to ${broadcastPayload.target}.`)
if (responseBody) {
  console.log(responseBody)
}
