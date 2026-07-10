# Moneycontrol NexBid Prebid Integration

## Purpose

This document explains how Moneycontrol can add NexBid as a Prebid bidder so NexBid can participate before Google Ad Manager selects the final creative.

## Bidder

```text
Bidder code: nexbid
Endpoint: https://nexbid.uk/api/v1/prebid/bid
Renderer: https://nexbid.uk/nexbanner/prebid-renderer.js
Size: 300x250
Config ID: moneycontrol.com-version-2-testing
Publisher ID: 2606001
Publisher domain: moneycontrol.com
```

## Prebid Ad Unit Example

```js
pbjs.addAdUnits([{
  code: 'moneycontrol_300x250',
  mediaTypes: {
    banner: {
      sizes: [[300, 250]]
    }
  },
  bids: [{
    bidder: 'nexbid',
    params: {
      publisherId: '2606001',
      publisherDomain: 'moneycontrol.com',
      placementId: 'moneycontrol_300x250',
      configId: 'moneycontrol.com-version-2-testing',
      floorCpm: '0.15',
      endpoint: 'https://nexbid.uk/api/v1/prebid/bid'
    }
  }]
}]);
```

## Required GAM Setup

Moneycontrol must have Prebid GAM line items and key-values ready:

```text
hb_bidder
hb_pb
hb_adid
hb_size
```

NexBid will return CPM to Prebid. Prebid will map that CPM into `hb_pb`, and GAM will compare NexBid with AdX/direct/yield demand.

## Flow

```text
Moneycontrol page
  -> Prebid calls NexBid bidder
  -> NexBid returns CPM and render markup
  -> Prebid sends hb_* targeting into GAM
  -> GAM chooses winner
  -> If NexBid wins, renderer loads NexBanner player
```
