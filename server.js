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
