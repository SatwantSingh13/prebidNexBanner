# NexBid Prebid Auction Backend Contract

The public Cloudflare endpoint is a validation gateway. It does not manufacture a CPM and does not treat a floor as demand. For production requests it forwards eligible bids to the private HTTPS service configured in `NEXBID_PREBID_AUCTION_URL`.

## Environment bindings

```text
NEXBID_PREBID_AUCTION_URL=https://auction.example.nexbid.uk/prebid
NEXBID_PREBID_AUCTION_TOKEN=<secret stored outside source control>
```

The token is optional at runtime but strongly recommended for production. It is sent to the private backend as a Bearer token.

## Backend request

```json
{
  "bidder": "nexbid",
  "auctionId": "auction-1",
  "bidderRequestId": "bidder-request-1",
  "timeout": 1200,
  "refererInfo": {
    "page": "https://publisher.example/article",
    "domain": "publisher.example"
  },
  "ortb2": {},
  "privacy": {
    "gdpr": {
      "applies": false,
      "consentString": ""
    },
    "usp": "1YNN",
    "gpp": {
      "string": "",
      "applicableSections": []
    }
  },
  "bids": [{
    "requestId": "bid-1",
    "adUnitCode": "publisher_300x250",
    "transactionId": "transaction-1",
    "sizes": [[300, 250]],
    "mediaTypes": {
      "banner": {
        "sizes": [[300, 250]]
      }
    },
    "publisherId": "2606001",
    "placementId": "publisher_300x250",
    "configId": "publisher.example",
    "test": false,
    "schain": {},
    "ortb2Imp": {},
    "floor": {
      "currency": "USD",
      "value": 0.25
    }
  }]
}
```

## Backend response

```json
{
  "bids": [{
    "requestId": "bid-1",
    "cpm": 1.2,
    "currency": "USD",
    "width": 300,
    "height": 250,
    "ttl": 300,
    "netRevenue": true,
    "creativeId": "creative-1",
    "advertiserDomains": ["advertiser.example"],
    "ad": "<div>renderable creative markup</div>",
    "dealId": "optional-deal-id"
  }]
}
```

## Required production behavior

- Return only a buyer-backed net CPM.
- Return no bid when no demand clears the supplied floor.
- Keep each `requestId` unchanged.
- Use an uppercase ISO 4217 currency code.
- Include at least one real advertiser landing domain.
- Return renderable banner markup in `ad`.
- Respect the request timeout, privacy values, supply chain and publisher authorization.
- Never return the dedicated static test creative for a production publisher ID.
