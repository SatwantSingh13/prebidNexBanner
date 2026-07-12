# NexBanner Version 1 Publisher Integration

Version 1 has two supported entry points. They serve different parts of the publisher stack and must not be confused.

## Prebid/OpenWrap integration (recommended)

Moneycontrol adds the NexBid bidder to its existing Prebid or OpenWrap ad unit:

```javascript
{
  bidder: 'nexbid',
  params: {
    publisherId: '2606001',
    placementId: 'moneycontrol_300x250',
    configId: 'moneycontrol.com'
  }
}
```

This runs before GAM. The adapter calls the fixed NexBid bid endpoint and returns a bid only when real demand supplies a valid CPM and creative. GAM then compares NexBid with AdX and the publisher's other eligible demand.

When a buyer-backed Version 1 bid wins, its creative may load the neutral renderer URL:

```text
https://nexbid.uk/nbx/render-v1.js
```

## GAM creative integration (legacy waterfall)

For a GAM creative that loads only after GAM has already selected NexBanner, use:

```html
<script src="https://nexbid.uk/nbx/v1.js" data-config-id="moneycontrol.com"></script>
```

This remains the stable Version 1 video-first waterfall. It does not participate in the publisher's pre-GAM price auction because GAM has already selected the creative before this script runs.

## Live files

- `https://nexbid.uk/nbx/v1.js` - short Version 1 GAM creative loader.
- `https://nexbid.uk/nbx/player-v1.js` - stable Version 1 player.
- `https://nexbid.uk/nbx/render-v1.js` - Version 1 Prebid winning-creative renderer.
- `https://nexbid.uk/api/v1/prebid/bid` - fixed NexBid bidder endpoint.

