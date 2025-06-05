const express = require('express');
const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 🔐 Authentification simple (optionnelle)
app.use((req, res, next) => {
  const auth = { login: "admin", password: "1234" };

  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login === auth.login && password === auth.password) return next();

  res.set('WWW-Authenticate', 'Basic realm="Stremio Addon"');
  res.status(401).send('Accès refusé');
});

const xtreamHost = process.env.XTREAM_HOST;
const xtreamUser = process.env.XTREAM_USER;
const xtreamPass = process.env.XTREAM_PASS;

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

builder.defineCatalogHandler(async () => {
  try {
    const { data } = await axios.get(`${xtreamHost}/player_api.php?username=${xtreamUser}&password=${xtreamPass}`);
    const channels = data?.available_channels || data?.channels || [];

    const metas = channels.map(ch => ({
      id: ch.stream_id.toString(),
      type: 'tv',
      name: ch.name,
      poster: ch.stream_icon,
    }));

    return { metas };
  } catch (err) {
    console.error(err.message);
    return { metas: [] };
  }
});

builder.defineStreamHandler(async ({ id }) => {
  const url = `${xtreamHost}/live/${xtreamUser}/${xtreamPass}/${id}.ts`;
  return { streams: [{ title: "Live Stream", url }] };
});

const addonInterface = builder.getInterface();

app.get('/manifest.json', (_, res) => {
  res.json(addonInterface.manifest);
});

app.get('/catalog/:type/:id/:extra?.json', (req, res) => {
  addonInterface.catalog(req.params, req.query)
    .then(resp => res.json(resp))
    .catch(err => {
      console.error(err);
      res.status(500).send('Erreur catalogue');
    });
});

app.get('/stream/:type/:id.json', (req, res) => {
  addonInterface.stream(req.params)
    .then(resp => res.json(resp))
    .catch(err => {
      console.error(err);
      res.status(500).send('Erreur stream');
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Addon Stremio en ligne sur le port ${port}`));
