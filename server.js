const express = require('express');
const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 🔐 Authentification HTTP basique
app.use((req, res, next) => {
  const auth = { login: 'admin', password: '1234' }; // Modifie ici si besoin

  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login === auth.login && password === auth.password) return next();

  res.set('WWW-Authenticate', 'Basic realm="Stremio Addon"');
  res.status(401).send('Accès refusé');
});

// 🔧 Configuration Xtream via .env
const xtreamHost = process.env.XTREAM_HOST;
const xtreamUser = process.env.XTREAM_USER;
const xtreamPass = process.env.XTREAM_PASS;

// 📦 Manifest de l'addon
const manifest = {
  id: 'community.xtreamaddon',
  version: '1.0.0',
  name: 'Xtream IPTV',
  description: 'Regarder IPTV via Xtream Codes',
  types: ['tv'],
  catalogs: [{ type: 'tv', id: 'xtream' }],
  resources: ['catalog', 'stream'],
};

const builder = new addonBuilder(manifest);

// 📺 Gestion du catalogue (chaînes IPTV)
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
    console.error('Erreur lors de la récupération des chaînes:', err.message);
    return { metas: [] };
  }
});

// 📡 Gestion du flux (lecture vidéo)
builder.defineStreamHandler(({ id }) => {
  const streamUrl = `${xtreamHost}/live/${xtreamUser}/${xtreamPass}/${id}.ts`;
  return Promise.resolve({ streams: [{ title: 'Live Stream', url: streamUrl }] });
});

// 🔄 Rendu du manifest et middleware
const addonInterface = builder.getInterface();

app.get('/manifest.json', (_, res) => {
  res.send(addonInterface.manifest);
});

app.use('/', addonInterface.getMiddleware());

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅  Addon Stremio en ligne sur le port ${port}`);
});
