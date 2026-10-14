// ==============================================================================
// iCONNECT BLR — LIVE WHATSAPP INTENT ROUTER & ANTI-REPETITION COPY HELPER
// ==============================================================================

export const iConnectConfig = {
  storePhonePointer: "917829439076", // Verified primary WhatsApp communication node
  rtNagarPhone: "917829439076",
  yeshwanthpurPhone: "916361733735",
  ganganagarPhone: "917829439076",
  fallbackUrl: "https://www.iconnectblr.in",
} as const;

export type StoreBranchName = "RT Nagar" | "Yeshwanthpur" | "Ganganagar";

/**
 * Resolves the store branch context from a product tag or explicit branch name.
 */
export function resolveStoreContext(tagOrBranch?: string): StoreBranchName {
  if (!tagOrBranch) return "RT Nagar";
  const normalized = tagOrBranch.toLowerCase();
  if (normalized.includes("yeshwanthpur")) return "Yeshwanthpur";
  if (normalized.includes("ganganagar")) return "Ganganagar";
  return "RT Nagar";
}

/**
 * Splits a product name like "iPhone 13" or "Samsung S23" into brand and model.
 */
export function splitBrandAndModel(fullName: string, spec?: string): { brand: string; model: string } {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { brand: "Smartphone", model: "Device" };

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("iphone") || lower.startsWith("ipad") || lower.startsWith("macbook") || lower.startsWith("apple")) {
    const modelPart = trimmed.replace(/^apple\s+/i, "");
    return {
      brand: "Apple",
      model: spec ? `${modelPart} (${spec.split(/[·•]/)[0]?.trim() || spec})` : modelPart,
    };
  }
  if (lower.startsWith("galaxy")) {
    return {
      brand: "Samsung",
      model: spec ? `${trimmed} (${spec.split(/[·•]/)[0]?.trim() || spec})` : trimmed,
    };
  }

  const parts = trimmed.split(/\s+/);
  const brand = parts[0] || "Smartphone";
  const baseModel = parts.slice(1).join(" ") || trimmed;
  const storage = spec?.split(/[·•]/)[0]?.trim();

  return {
    brand,
    model: storage ? `${baseModel} (${storage})` : baseModel,
  };
}

/**
 * Generates custom dynamic URLs to immediately trigger localized client interactions on WhatsApp.
 * Drives rapid sales execution for Buy, Sell, and Exchange enquiries.
 */
export function buildWhatsAppIntentUrl(
  brand: string,
  model: string,
  storeContext: string = "RT Nagar"
): string {
  if (!brand || !model) return iConnectConfig.fallbackUrl;

  const standardQueryText = `Hi iConnect BLR Team! I am browsing your web store and I am highly interested in the pre-owned *${brand} ${model}*. 

Could you please share:
1. Real physical images/video of the device?
2. Current maximum Battery Health percentage?
3. Estimated exchange valuation if I trade in my old phone?

Looking to sync up with the team at the ${storeContext} hub!`;

  const safeEncodedText = encodeURIComponent(standardQueryText);
  return `https://wa.me/${iConnectConfig.storePhonePointer}?text=${safeEncodedText}`;
}

/**
 * Deterministic non-repeating copy generator used when creating or polishing
 * device descriptions without repeating boilerplate phrases.
 */
export function buildDistinctDeviceCopy(params: {
  deviceBrand: string;
  deviceModel: string;
  conditionScore?: string;
  spec?: string;
  branch?: string;
}): string {
  const { deviceBrand, deviceModel, conditionScore = "Excellent", spec = "", branch = "RT Nagar" } = params;
  const fullTitle = `${deviceBrand} ${deviceModel}`.replace(/\b(\w+)\s+\1\b/i, "$1").trim();
  const hash = Array.from(fullTitle + spec).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const templates = [
    `Available to buy, sell, or exchange at our ${branch} hub: this ${conditionScore.toLowerCase()}-grade ${fullTitle} features verified battery health, original display hardware, and transparent walk-in inspection before you pay.`,
    `Upgrade your daily driver or trade in your current handset for this thoroughly inspected ${fullTitle} (${conditionScore} condition) at iConnect BLR ${branch}, complete with a 6-month store warranty and GST invoice.`,
    `Rigorously verified across camera, display, and charging diagnostics, this ${fullTitle} is ready for hands-on testing at our ${branch} branch—bring your old phone for an instant exchange valuation or message us on WhatsApp for live photos.`,
    `Hand-picked for performance and value, this ${conditionScore.toLowerCase()} ${fullTitle} can be inspected in person at iConnect BLR ${branch} with direct buyback and upgrade exchange options available on the spot.`,
  ];

  return templates[hash % templates.length];
}
