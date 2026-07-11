# Publisher Setup: NexBid Prebid.js Adapter

## Requirements

The publisher must run a Prebid.js build that contains `nexbidBidAdapter` or use an OpenWrap profile in which PubMatic has enabled the released NexBid module.

Required GAM integration:

- Standard Prebid targeting, including `hb_bidder`, `hb_pb`, `hb_adid` and `hb_size`.
- Price-bucket line items or the publisher's existing Prebid line-item structure.
- Prebid Universal Creative or equivalent rendering support.

## Bidder parameters

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

`publisherId` and `placementId` are required. `configId` is optional. The endpoint and CPM are not publisher parameters.

## Auction flow

```text
Publisher page
  -> Prebid/OpenWrap calls the NexBid adapter
  -> Adapter calls the fixed NexBid HTTPS endpoint
  -> NexBid gateway obtains a real buyer-backed bid or returns no-bid
  -> Prebid passes hb_* targeting into GAM
  -> GAM compares NexBid with AdX, direct and other eligible demand
  -> Prebid renders the creative only when NexBid wins
```

## Test parameters

```javascript
{
  bidder: 'nexbid',
  params: {
    publisherId: 'nexbid-test',
    placementId: 'banner-300x250',
    configId: 'prebid-review',
    test: true
  }
}
```

The test flag does not produce a bid for production publisher IDs.
