import { registerBidder } from "../src/adapters/bidderFactory.js";
import { BANNER } from "../src/mediaTypes.js";

const BIDDER_CODE = "nexbid";
const DEFAULT_ENDPOINT = "https://nexbid.uk/api/v1/prebid/bid";

export const spec = {
  code: BIDDER_CODE,
  aliases: ["nexbanner"],
  supportedMediaTypes: [BANNER],

  isBidRequestValid(bid) {
    const params = bid.params || {};
    return Boolean(params.publisherId && params.placementId);
  },

  buildRequests(validBidRequests, bidderRequest) {
    const firstParams = (validBidRequests[0] && validBidRequests[0].params) || {};
    const endpoint = firstParams.endpoint || DEFAULT_ENDPOINT;

    return {
      method: "POST",
      url: endpoint,
      options: {
        contentType: "application/json",
        withCredentials: false
      },
      data: JSON.stringify({
        bidder: BIDDER_CODE,
        auctionId: bidderRequest && bidderRequest.auctionId,
        timeout: bidderRequest && bidderRequest.timeout,
        gdprConsent: bidderRequest && bidderRequest.gdprConsent,
        uspConsent: bidderRequest && bidderRequest.uspConsent,
        refererInfo: bidderRequest && bidderRequest.refererInfo,
        bids: validBidRequests.map(toNexBidRequest)
      })
    };
  },

  interpretResponse(serverResponse, request) {
    const body = serverResponse && serverResponse.body;
    if (!body || !Array.isArray(body.bids)) return [];

    return body.bids.map((bid) => ({
      requestId: bid.requestId,
      cpm: Number(bid.cpm || 0),
      width: Number(bid.width || 300),
      height: Number(bid.height || 250),
      creativeId: bid.creativeId || "nexbid-prebid",
      currency: bid.currency || "USD",
      netRevenue: bid.netRevenue !== false,
      ttl: Number(bid.ttl || 300),
      ad: bid.ad || "",
      meta: {
        advertiserDomains: bid.advertiserDomains || ["nexbid.uk"],
        mediaType: BANNER,
        demandSource: bid.demandSource || "NexBid"
      }
    })).filter((bid) => bid.requestId && bid.cpm > 0 && bid.ad);
  },

  getUserSyncs() {
    return [];
  }
};

function toNexBidRequest(bid) {
  const params = bid.params || {};
  return {
    bidId: bid.bidId,
    adUnitCode: bid.adUnitCode,
    transactionId: bid.transactionId,
    sizes: bid.sizes || sizesFromMediaTypes(bid.mediaTypes),
    mediaTypes: bid.mediaTypes || {},
    publisherId: params.publisherId,
    publisherDomain: params.publisherDomain || "",
    placementId: params.placementId,
    configId: params.configId || "",
    floorCpm: params.floorCpm || "",
    testCpm: params.testCpm || "",
    currency: params.currency || "USD",
    schain: params.schain || null,
    page: pageFromBid(bid)
  };
}

function sizesFromMediaTypes(mediaTypes) {
  return mediaTypes && mediaTypes.banner && mediaTypes.banner.sizes
    ? mediaTypes.banner.sizes
    : [];
}

function pageFromBid(bid) {
  if (bid && bid.params && bid.params.page) return bid.params.page;
  try {
    return window.location.href;
  } catch (_) {
    return "";
  }
}

registerBidder(spec);
