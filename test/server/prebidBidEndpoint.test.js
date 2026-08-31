import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestOptions, onRequestPost } from '../../functions/api/v1/prebid/bid.js';

const TEST_URL = 'https://nexbid.uk/api/v1/prebid/bid';

test('OPTIONS exposes the bidder CORS contract', async () => {
  const response = await onRequestOptions();

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
});

test('documented test account receives a static test bid', async () => {
  const response = await callEndpoint({
    bids: [{
      requestId: 'bid-1',
      publisherId: 'nexbid-test',
      placementId: 'banner-300x250',
      test: true,
      sizes: [[300, 250]]
    }]
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(body.bids.length, 1);
  assert.equal(body.bids[0].requestId, 'bid-1');
  assert.equal(body.bids[0].cpm, 0.5);
  assert.deepEqual(body.bids[0].advertiserDomains, ['nexbid.uk']);
  assert.match(body.bids[0].ad, /NexBid Prebid Test/);
});

test('test flag cannot create a bid for a production publisher', async () => {
  const response = await callEndpoint({
    bids: [{
      requestId: 'bid-1',
      publisherId: '2606001',
      placementId: 'moneycontrol_300x250',
      test: true,
      sizes: [[300, 250]],
      floor: { currency: 'USD', value: 50 }
    }]
  });
  const body = await response.json();

  assert.deepEqual(body.bids, []);
});

test('production request returns no-bid without a configured auction backend', async () => {
  const response = await callEndpoint(productionRequest());
  const body = await response.json();

  assert.deepEqual(body.bids, []);
});

test('production request forwards to HTTPS backend and validates its response', async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url, options };
    return new Response(JSON.stringify({
      bids: [
        {
          requestId: 'bid-1',
          cpm: 1.2,
          currency: 'USD',
          width: 300,
          height: 250,
          creativeId: 'creative-1',
          advertiserDomains: ['advertiser.example'],
          ad: '<div>paid creative</div>'
        },
        {
          requestId: 'unknown-bid',
          cpm: 99,
          currency: 'USD',
          width: 300,
          height: 250,
          advertiserDomains: ['invalid.example'],
          ad: '<div>invalid</div>'
        }
      ]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const response = await callEndpoint(productionRequest(), {
      NEXBID_PREBID_AUCTION_URL: 'https://auction.nexbid.example/bid',
      NEXBID_PREBID_AUCTION_TOKEN: 'server-secret'
    });
    const body = await response.json();

    assert.equal(forwarded.url, 'https://auction.nexbid.example/bid');
    assert.equal(forwarded.options.method, 'POST');
    assert.equal(forwarded.options.headers.authorization, 'Bearer server-secret');
    assert.equal(body.bids.length, 1);
    assert.equal(body.bids[0].requestId, 'bid-1');
    assert.equal(body.bids[0].cpm, 1.2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('malformed input safely returns no-bid', async () => {
  const request = new Request(TEST_URL, {
    method: 'POST',
    body: '{bad json'
  });
  const response = await onRequestPost({ request, env: {} });

  assert.deepEqual(await response.json(), { bidder: 'nexbid', bids: [] });
});

function productionRequest() {
  return {
    auctionId: 'auction-1',
    timeout: 1200,
    bids: [{
      requestId: 'bid-1',
      publisherId: '2606001',
      placementId: 'moneycontrol_300x250',
      configId: 'moneycontrol.com',
      sizes: [[300, 250]],
      floor: { currency: 'USD', value: 0.25 }
    }]
  };
}

function callEndpoint(body, env = {}) {
  const request = new Request(TEST_URL, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(body)
  });
  return onRequestPost({ request, env });
}
