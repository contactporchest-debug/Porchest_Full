const express = require('express');
const { normalizeApiBase } = require('../utils/urlBases');

const router = express.Router();

router.get('/pixel.js', (req, res) => {
    const apiBase = normalizeApiBase(process.env.PORCHEST_PUBLIC_API_URL || process.env.APP_URL || 'https://api.porchest.com');

    res.type('application/javascript');
    res.send(`
(function () {
  var API_BASE = ${JSON.stringify(apiBase)};
  var STORAGE_KEY = 'porchest_attribution';

  function getCookie(name) {
    try {
      var escaped = name.replace(/[-/\\\\^*+?.()|[\\]{}]/g, '\\\\$&');
      var match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function setCookie(name, value, days) {
    try {
      var maxAge = days ? '; max-age=' + (days * 24 * 60 * 60) : '';
      document.cookie = name + '=' + encodeURIComponent(value) + maxAge + '; path=/; SameSite=Lax';
    } catch (e) {}
  }

  function getFromUrl() {
    try {
      return new URL(window.location.href).searchParams.get('pc_attrib');
    } catch (e) {
      return null;
    }
  }

  function getAttribution() {
    try {
      return getFromUrl() || window.localStorage.getItem(STORAGE_KEY) || getCookie(STORAGE_KEY);
    } catch (e) {
      return getFromUrl() || getCookie(STORAGE_KEY);
    }
  }

  function persistAttribution(token) {
    if (!token) return;
    try { window.localStorage.setItem(STORAGE_KEY, token); } catch (e) {}
    setCookie(STORAGE_KEY, token, 30);
  }

  persistAttribution(getFromUrl());

  window.Porchest = window.Porchest || {};
  window.Porchest.getAttribution = getAttribution;
  window.Porchest.trackPurchase = async function (payload) {
    payload = payload || {};
    var token = payload.attributionToken || getAttribution();
    if (token) persistAttribution(token);

    var body = Object.assign({}, payload, token ? { attributionToken: token } : {});

    try {
      var response = await fetch(API_BASE.replace(/\\/$/, '') + '/pixel/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok && window.console && window.console.warn && window.location.hostname !== 'localhost') {
        window.console.warn('[Porchest] Purchase tracking request failed:', response.status);
      }
      return response.json().catch(function () { return null; });
    } catch (error) {
      if (window.console && window.console.warn && window.location.hostname !== 'localhost') {
        window.console.warn('[Porchest] Purchase tracking error:', error);
      }
      return null;
    }
  };
})();
    `);
});

module.exports = router;
