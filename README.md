# NexBid Prebid.js Adapter

This repository contains the NexBid client-side bidder adapter package for submission to the official Prebid.js project.

## Bidder identity

- Bidder code: `nexbid`
- Media type: banner
- Bid endpoint: `https://nexbid.uk/api/v1/prebid/bid`
- Maintainer: `prebid@nexbid.uk`

## Submission files

- `modules/nexbidBidAdapter.js` - canonical Prebid.js module.
- `modules/nexbidBidAdapter.md` - module maintainer and test documentation.
- `test/spec/modules/nexbidBidAdapter_spec.js` - official-style unit tests.
- `docs/prebid-org-nexbid.md` - proposed `prebid.github.io` bidder page.
- `functions/api/v1/prebid/bid.js` - Cloudflare gateway endpoint.
- `public/prebid-renderer.js` - NexBanner creative renderer for buyer-backed production bids.
- `docs/version-1-script.md` - Version 1 Prebid/OpenWrap and GAM creative entry points.

## Commercial integrity

The gateway does not convert a configured floor into a production bid. Production bids are accepted only from the HTTPS backend configured through `NEXBID_PREBID_AUCTION_URL`, and each response must contain a positive CPM, valid size and currency, creative markup, and advertiser domain.

A static bid is available only for the documented `nexbid-test` account and `banner-300x250` placement when `test: true` is sent.

## Validation

```text
pnpm run check
pnpm run test:gateway
```

The official adapter test must also pass after the module and spec are copied into a current Prebid.js checkout:

```text
gulp test --file "test/spec/modules/nexbidBidAdapter_spec.js" --nolint
gulp lint --no-lint-warnings --file "modules/nexbidBidAdapter.js"
gulp build --modules=nexbidBidAdapter
```

## Deployment requirements

1. Deploy the gateway function at `/api/v1/prebid/bid` with POST and OPTIONS support.
2. Configure `NEXBID_PREBID_AUCTION_URL` to a real buyer-backed auction service before production traffic.
3. Store any backend token only in `NEXBID_PREBID_AUCTION_TOKEN`; never place it in publisher parameters or source control.
4. Deploy the renderer at the neutral public path `/nbx/render-v1.js` before returning production creatives that reference it.
5. Activate and monitor the group mailbox `prebid@nexbid.uk` before opening the Prebid pull request.

