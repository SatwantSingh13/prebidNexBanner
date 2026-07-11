# Moneycontrol NexBid Prebid/OpenWrap Integration

## Proposed bidder mapping

```text
Bidder code: nexbid
Module: nexbidBidAdapter
Publisher ID: 2606001
Placement ID: moneycontrol_300x250
Config ID: moneycontrol.com
Media type: banner
Size: 300x250
```

## Ad-unit entry

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

PubMatic must include the released `nexbidBidAdapter` module in Moneycontrol's OpenWrap profile. Moneycontrol then maps this bidder entry to the selected 300x250 ad units and tests it on limited traffic.

NexBid does not control Moneycontrol's GAM line-item price. NexBid supplies a buyer-backed CPM to Prebid/OpenWrap before GAM runs, and GAM makes the final selection using the publisher's existing header-bidding setup.
