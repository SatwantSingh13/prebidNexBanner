# NexBid Prebid Adapter

NexBid Prebid Adapter lets a publisher call NexBid before Google Ad Manager. NexBid can then return a CPM bid based on available NexBanner demand.

Current package contents:

- `src/nexbidBidAdapter.js` - Prebid.js bidder adapter module.
- `functions/api/v1/prebid/bid.js` - Cloudflare Pages bid endpoint.
- `public/prebid-renderer.js` - Renderer used when GAM/Prebid selects NexBid.
- `examples/publisher-prebid-example.html` - Publisher-side test wiring.
- `docs/publisher-setup.md` - Setup notes for the publisher team.

Default bidder code:

```text
nexbid
```

Default endpoints:

```text
https://nexbid.uk/api/v1/prebid/bid
https://nexbid.uk/nexbanner/prebid-renderer.js
```

This is separate from the GAM creative-tag NexBanner product. The purpose of this adapter is to let NexBid participate before Publisher GAM chooses the winner.
