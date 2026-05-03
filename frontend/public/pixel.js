(function () {
  window.porchest = window.porchest || {};

  window.porchest.track = function (eventName, data) {
    if (eventName !== 'Purchase') return;

    var attr = readAttributionCookie();

    if (!attr) {
      attr = readAttributionFromURL();
      if (attr) {
        persistAttributionCookie(attr);
      }
    }

    if (!attr || !attr.cid || !attr.iid) {
      console.log('[Porchest] No attribution data found');
      return;
    }

    if (!data || !data.orderId || !data.orderValue) {
      console.error('[Porchest] Missing orderId or orderValue');
      return;
    }

    fetch('https://www.porchest.com/api/pixel/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cid: attr.cid,
        iid: attr.iid,
        orderId: data.orderId,
        orderValue: parseFloat(data.orderValue),
        currency: data.currency || 'USD',
      }),
      credentials: 'include',
    }).then(function (res) {
      if (!res.ok) throw new Error('Pixel request failed');
      return res.json();
    }).then(function (result) {
      console.log('[Porchest] Purchase tracked:', result);
    }).catch(function (err) {
      console.error('[Porchest] Pixel error:', err);
    });
  };

  function persistAttributionCookie(attr) {
    try {
      document.cookie =
        'porchest_attribution=' +
        encodeURIComponent(JSON.stringify({
          cid: attr.cid,
          iid: attr.iid,
          timestamp: Date.now(),
        })) +
        '; path=/; max-age=' + 30 * 24 * 60 * 60 + '; samesite=lax';
    } catch (e) {
      // Ignore cookie write failures and fall back to URL params on the next page load.
    }
  }

  function readAttributionCookie() {
    var cookies = document.cookie.split('; ');
    var attrCookie = cookies.find(function (row) {
      return row.indexOf('porchest_attribution=') === 0;
    });

    if (!attrCookie) return null;

    try {
      var value = attrCookie.split('=')[1];
      return JSON.parse(decodeURIComponent(value));
    } catch (e) {
      return null;
    }
  }

  function readAttributionFromURL() {
    var params = new URLSearchParams(window.location.search);
    var cid = params.get('pcid');
    var iid = params.get('piid');

    if (cid && iid) {
      return { cid: cid, iid: iid };
    }
    return null;
  }
})();
