# Publisher Setup: NexBid Prebid Adapter

## Publisher Requirements

The publisher must already run Prebid.js or agree to add NexBid into the page header bidding wrapper.

Required GAM setup:

- Prebid key-values: `hb_bidder`, `hb_pb`, `hb_adid`, `hb_size`
- Prebid line items for the relevant CPM buckets
- Prebid universal creative or equivalent render support

## NexBid Bidder Params

```js
{
  bidder: 'nexbid',
  params: {
    publisherId: '2606001',
    publisherDomain: 'moneycontrol.com',
    placementId: 'moneycontrol_300x250',
    configId: 'moneycontrol.com-version-2-testing',
    floorCpm: '0.15',
    endpoint: 'https://nexbid.uk/api/v1/prebid/bid'
  }
}
```

## Auction Flow

```text
Publisher page
  -> Prebid calls NexBid adapter
  -> NexBid adapter calls /api/v1/prebid/bid
  -> NexBid returns CPM + render markup
  -> Prebid passes hb_* key-values into GAM
  -> GAM compares NexBid with AdX/direct/other demand
  -> If NexBid wins, Prebid renders NexBid markup
  -> NexBid renderer loads NexBanner player
```

## Testing CPM Buckets

Suggested starting buckets:

```text
$0.10
$0.15
$0.20
$0.30
$0.50
$0.75
$1.00
```

Approximate India CPM mapping:

```text
Rs 10 CPM ~= $0.12
Rs 15 CPM ~= $0.18
Rs 20 CPM ~= $0.24
Rs 25 CPM ~= $0.30
```
