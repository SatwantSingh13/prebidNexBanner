export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const origin = new URL(context.request.url).origin;
    const bids = Array.isArray(body.bids) ? body.bids : [];
    const responses = [];

    for (const bid of bids) {
      const response = await buildBidResponse(context, origin, bid);
      if (response) responses.push(response);
    }

    return json({ bidder: "nexbid", bids: responses });
  } catch (error) {
    return json({ bidder: "nexbid", bids: [], error: error.message || "bad_request" }, 400);
  }
}

async function buildBidResponse(context, origin, bid) {
  const width = Number(firstSize(bid)[0] || 300);
  const height = Number(firstSize(bid)[1] || 250);
  const config = await readConfig(context.env, bid.configId);
  const cpm = priceForBid(bid, config);

  if (!bid.bidId || !cpm || cpm <= 0) {
    await track(origin, bid, "prebid_no_bid", { reason: "no_price" });
    return null;
  }

  const winId = makeWinId();
  const payload = {
    winId,
    requestId: bid.bidId,
    configId: bid.configId || "",
    publisherId: bid.publisherId || "",
    publisherDomain: bid.publisherDomain || "",
    placementId: bid.placementId || "",
    width,
    height,
    cpm,
    currency: bid.currency || "USD",
    apiBase: origin,
    renderScript: `${origin}/nexbanner/prebid-renderer.js`,
    demand: demandSummary(config),
    schain: bid.schain || null
  };

  await storeWin(context.env, winId, payload);
  await track(origin, bid, "prebid_bid", { cpm });

  return {
    requestId: bid.bidId,
    cpm,
    currency: bid.currency || "USD",
    width,
    height,
    ttl: 300,
    netRevenue: true,
    creativeId: `nexbid-${bid.placementId || "placement"}-${width}x${height}`,
    demandSource: "NexBid",
    advertiserDomains: ["nexbid.uk"],
    ad: renderMarkup(payload)
  };
}

function renderMarkup(payload) {
  const encoded = encodeURIComponent(JSON.stringify(payload));
  return [
    `<div class="nexbid-prebid-slot" style="width:${payload.width}px;height:${payload.height}px;overflow:hidden;"></div>`,
    `<script async src="${payload.renderScript}" data-nexbid-prebid="${encoded}"></script>`
  ].join("");
}

async function readConfig(env, configId) {
  if (!configId || !env.NEXBANNER_CONFIGS || !env.NEXBANNER_CONFIGS.get) return null;
  try {
    return await env.NEXBANNER_CONFIGS.get(configId, "json");
  } catch (_) {
    return null;
  }
}

async function storeWin(env, winId, payload) {
  const store = env.NEXBANNER_PREBID_WINS || env.NEXBANNER_CONFIGS;
  if (!store || !store.put) return;
  await store.put(`prebid-win:${winId}`, JSON.stringify(payload), { expirationTtl: 60 * 10 });
}

function priceForBid(bid, config) {
  const testCpm = numberValue(bid.testCpm, 0);
  if (testCpm > 0) return testCpm;

  const floor = numberValue(bid.floorCpm, 0);
  const configFloor = numberValue(config && config.prebidFloorCpm, 0);
  const demandFloor = highestDemandFloor(config);
  const chosen = Math.max(floor, configFloor, demandFloor);

  return chosen > 0 ? roundCpm(chosen) : 0;
}

function highestDemandFloor(config) {
  if (!config) return 0;
  return []
    .concat(config.vastDemand || [])
    .concat(config.prebidDemand || [])
    .concat(config.displayScriptDemand || [])
    .concat(config.adserverScriptDemand || [])
    .concat(config.adserverHtmlDemand || [])
    .concat(config.ortbDemand || [])
    .reduce((max, item) => Math.max(max, numberValue(item && item.floorCpm, 0)), 0);
}

function demandSummary(config) {
  if (!config) return { mode: "unknown" };
  return {
    mode: config.rotationMode || config.mode || "video-first",
    vast: (config.vastDemand || []).length,
    adserverHtml: (config.adserverHtmlDemand || []).length,
    adserverScript: (config.adserverScriptDemand || []).length,
    ortb: (config.ortbDemand || []).length
  };
}

function firstSize(bid) {
  const sizes = Array.isArray(bid.sizes) ? bid.sizes : [];
  const first = sizes.find((size) => Array.isArray(size) && size.length >= 2);
  return first || [300, 250];
}

async function track(origin, bid, event, extra) {
  const url = new URL(`${origin}/api/v1/track`);
  url.searchParams.set("event", event);
  url.searchParams.set("layer", "prebid");
  url.searchParams.set("config_id", bid.configId || "");
  url.searchParams.set("publisher_id", bid.publisherId || "");
  url.searchParams.set("publisher_domain", bid.publisherDomain || "");
  url.searchParams.set("placement_id", bid.placementId || "");
  if (extra && extra.cpm) url.searchParams.set("cpm", String(extra.cpm));
  if (extra && extra.reason) url.searchParams.set("reason", extra.reason);
  try {
    await fetch(url.toString(), { credentials: "omit" });
  } catch (_) {}
}

function makeWinId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function numberValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCpm(value) {
  return Math.round(Number(value) * 100) / 100;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}
