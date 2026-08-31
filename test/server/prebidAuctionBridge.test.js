import assert from 'node:assert/strict';
import test from 'node:test';
import { __test, onRequestPost } from '../../functions/api/v1/prebid/auction.js';

const TOKEN = 'test-token';
const URL = 'https://nexbid.uk/api/v1/prebid/auction';

test('bridge rejects requests without the internal token', async () => {
  const response = await onRequestPost(context(requestBody(), {}, false));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { bids: [] });
});

test('bridge creates a contextual OpenRTB 2.5 banner request', () => {
  const body = requestBody();
  const request = __test.buildOrtbRequest(body, body.bids);

  assert.equal(request.imp[0].id, 'bid-1');
  assert.equal(request.imp[0].tagid, 'moneycontrol_300x250');
  assert.equal(request.imp[0].bidfloor, 0.25);
  assert.deepEqual(request.imp[0].banner.format, [{ w: 300, h: 250 }]);
  assert.equal(request.site.domain, 'moneycontrol.com');
  assert.equal(request.site.publisher.id, 'moneycontrol');
  assert.equal(request.source.ext.schain.nodes[0].sid, '2606001');
  assert.equal(request.user, undefined);
  assert.equal(request.device.ip, undefined);
  assert.equal(request.device.ua, undefined);
});

test('bridge returns the highest valid above-floor ORTB bid', async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      id: 'auction-1',
      cur: 'USD',
      seatbid: [{
        seat: 'buyer',
        bid: [
          { id: 'low', impid: 'bid-1', price: 0.2, adm: '<div>low</div>', adomain: ['low.example'] },
          { id: 'winner', impid: 'bid-1', price: 0.8, w: 300, h: 250, adm: '<div>paid ad</div>', adomain: ['advertiser.example'] }
        ]
      }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const response = await onRequestPost(context(requestBody(), {
      NEXBID_ORTB_URL: 'http://ortb.example/bid',
      NEXBID_PREBID_AUCTION_TOKEN: TOKEN
    }));
    const body = await response.json();

    assert.equal(forwarded.url, 'http://ortb.example/bid');
    assert.equal(forwarded.options.headers['x-openrtb-version'], '2.5');
    assert.equal(forwarded.body.imp[0].secure, 1);
    assert.equal(body.bids.length, 1);
    assert.equal(body.bids[0].cpm, 0.8);
    assert.equal(body.bids[0].creativeId, 'winner');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('bridge safely returns no-bid for an invalid upstream response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ seatbid: [] }), { status: 200 });

  try {
    const response = await onRequestPost(context(requestBody(), {
      NEXBID_ORTB_URL: 'http://ortb.example/bid',
      NEXBID_PREBID_AUCTION_TOKEN: TOKEN
    }));
    assert.deepEqual((await response.json()).bids, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function requestBody() {
  return {
    auctionId: 'auction-1',
    timeout: 1200,
    refererInfo: {
      page: 'https://www.moneycontrol.com/news/example',
      domain: 'moneycontrol.com'
    },
    ortb2: {
      site: { domain: 'moneycontrol.com' },
      device: { w: 1366, h: 768, ua: 'not-forwarded', ip: 'not-forwarded' }
    },
    privacy: { gdpr: { applies: false, consentString: 'not-forwarded' } },
    bids: [{
      requestId: 'bid-1',
      publisherId: 'moneycontrol',
      placementId: 'moneycontrol_300x250',
      configId: 'moneycontrol.com',
      sizes: [[300, 250]],
      floor: { currency: 'USD', value: 0.25 },
      schain: { ver: '1.0', complete: 1, nodes: [{ asi: 'nexbid.uk', sid: '2606001', hp: 1 }] }
    }]
  };
}

function context(body, env = {}, authorized = true) {
  const headers = { 'content-type': 'application/json' };
  if (authorized) headers.authorization = `Bearer ${TOKEN}`;
  return {
    env,
    request: new Request(URL, { method: 'POST', headers, body: JSON.stringify(body) })
  };
}

