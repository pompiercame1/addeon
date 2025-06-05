const express = require('express');
const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configuration Xtream
const xtreamHost = process.env.XTREAM_HOST;
const xtreamUser = process.env.XTREAM_USER;
const xtreamPass = process.env.XTREAM_PASS;

// Manifest de l'addon
const manifest = {
  id: 'community.xtreamaddon',
  version: '1.0.0',
  name: 'Xtream IPTV',
  description: 'Regarder IPTV via les codes Xtream',
  types: ['tv'],
  catalogs: [{ type: 'tv', id: 'xtream' }],
  resources: ['catalog', 'stream'],
};

const builder = new addonBuilder(manifest);

// Gestion du catalogue
builder.defineCatalogHandler(async () => {
  try {
    const url = `${xtreamHost}/player_api.php?username=${xtreamUser}&password=${xtreamPass}`;
    const { data } = await axios.get(url);

    const channels = data?.available_channels || [];

    const metas = channels.map(ch => ({
      id: ch.stream_id.toString(),
      type: 'tv',
      name: ch.name,
      poster: ch.stream_icon || null,
    }));

    return { metas };
  } catch (err) {
    console.error('Erreur dans le catalogue :', err.message);
    return { metas: [] };
  }
});

// Gestion du stream
builder.defineStreamHandler(({ id }) => {
  const streamUrl = `${xtreamHost}/live/${xtreamUser}/${xtreamPass}/${id}.ts`;
  return Promise.resolve({ streams: [{ title: 'Live', url: streamUrl }] });
});

// Interface de l'addon
const addonInterface = builder.getInterface();

// ✅ Middleware correct ici
app.use('/', addonInterface.getMiddleware());

// Port d'écoute
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Addon Stremio en ligne sur le port ${PORT}`);
});
