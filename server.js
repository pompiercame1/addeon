const express = require('express');
const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

const builder = new addonBuilder({
  id: 'community.xtreamaddon',
  version: '1.0.0',
  name: 'Xtream IPTV',
  description: 'Regarder IPTV via Xtream Codes',
  types: ['tv'],
  catalogs: [{ type: 'tv', id: 'xtream' }],
  resources: ['catalog', 'stream'],
});

builder.defineCatalogHandler(async () => {
  // ... ton code ici
});

builder.defineStreamHandler(async ({ id }) => {
  // ... ton code ici
});

app.get('/manifest.json', (_, res) => {
  res.send(builder.getManifest()); // ✅ CORRECT
});

app.use('/', builder.getMiddleware());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Addon en cours d'exécution sur le port ${port}`));
