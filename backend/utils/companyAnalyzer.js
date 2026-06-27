const axios = require("axios");

const PUBLIC_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "aol.com", "icloud.com", "mail.com", "protonmail.com", "yandex.com",
  "live.com", "msn.com", "rediffmail.com", "zoho.com"
];

/**
 * Extracts the root domain from a URL or email.
 */
const extractDomain = (input) => {
  if (!input) return "";

  if (input.includes("@")) {
    return input.split("@")[1].toLowerCase().trim();
  }

  try {
    let url = input.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return input.toLowerCase().trim();
  }
};

const isPublicDomain = (domain) => PUBLIC_DOMAINS.includes(domain);

/**
 * Uses Google Custom Search API to check if a company exists on the web.
 */
const verifyCompanyWithGoogle = async (companyName, domain) => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  // --- Detailed env debug ---
  console.log(`[CompanyAnalyzer] API Key loaded: ${apiKey ? "YES (" + apiKey.slice(0, 8) + "...)" : "MISSING"}`);
  console.log(`[CompanyAnalyzer] CX loaded:      ${cx ? "YES (" + cx + ")" : "MISSING"}`);

  if (!apiKey || !cx || apiKey === "your_google_api_key_here") {
    console.warn("[CompanyAnalyzer] ❌ API keys not set — falling back to manual review.");
    return { exists: null };
  }

  const query = `"${companyName}" "${domain}"`;
  const fallbackQuery = `${companyName} official website`;

  console.log(`[CompanyAnalyzer] 🔍 Searching Google for: ${query}`);

  try {
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: { key: apiKey, cx, q: query, num: 3 },
      timeout: 8000,
    });

    const items = response.data?.items;
    console.log(`[CompanyAnalyzer] Primary search returned ${items ? items.length : 0} result(s).`);

    if (items && items.length > 0) {
      console.log(`[CompanyAnalyzer] ✅ Company found via primary search.`);
      return { exists: true };
    }

    // Fallback broader search
    console.log(`[CompanyAnalyzer] 🔍 No results. Trying fallback: ${fallbackQuery}`);
    const fallback = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: { key: apiKey, cx, q: fallbackQuery, num: 3 },
      timeout: 8000,
    });

    const fallbackItems = fallback.data?.items;
    console.log(`[CompanyAnalyzer] Fallback search returned ${fallbackItems ? fallbackItems.length : 0} result(s).`);

    if (fallbackItems && fallbackItems.length > 0) {
      console.log(`[CompanyAnalyzer] ✅ Company found via fallback search.`);
      return { exists: true };
    }

    console.log(`[CompanyAnalyzer] ❌ Company NOT found in both searches.`);
    return { exists: false };

  } catch (error) {
    const status = error.response?.status;
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`[CompanyAnalyzer] ❌ Google API error [${status}]: ${errMsg}`);

    if (status === 403) {
      console.error("[CompanyAnalyzer] 403 = Invalid API key or Custom Search API not enabled.");
    } else if (status === 429) {
      console.error("[CompanyAnalyzer] 429 = Daily quota exceeded (100 req/day free limit hit).");
    } else if (status === 400) {
      console.error("[CompanyAnalyzer] 400 = Bad request. Check CX engine ID.");
    }

    return { exists: null }; // Graceful fallback
  }
};

/**
 * Main Analysis Function
 *
 * Rules (applied in order):
 * 1. No searchable domain → PENDING (admin manual review)
 * 2. Company NOT found   → REJECTED (auto reject)
 * 3. Company found + public email (gmail) → PENDING (admin reviews)
 * 4. Company found + business email → APPROVED (auto approve)
 * 5. API unavailable / error → PENDING (safe fallback)
 */
const analyzeCompanyDetails = async (companyName, workEmail, companyWebsite) => {
  console.log("\n========== [CompanyAnalyzer] Starting Analysis ==========");
  console.log(`  Company:  ${companyName}`);
  console.log(`  Email:    ${workEmail}`);
  console.log(`  Website:  ${companyWebsite || "(none)"}`);

  const emailDomain = extractDomain(workEmail);
  const websiteDomain = extractDomain(companyWebsite);

  console.log(`  Email domain:   ${emailDomain} (public: ${isPublicDomain(emailDomain)})`);
  console.log(`  Website domain: ${websiteDomain || "(none)"}`);

  // Choose which domain to search
  let targetDomain = websiteDomain;
  if (!targetDomain && !isPublicDomain(emailDomain)) {
    targetDomain = emailDomain;
  }

  if (!targetDomain) {
    console.log("[CompanyAnalyzer] ⚠️  No business domain available → PENDING (manual review)");
    return {
      status: "pending",
      note: "No business website provided and a public email domain was used. Waiting for admin manual review.",
    };
  }

  console.log(`[CompanyAnalyzer] Using domain for search: ${targetDomain}`);

  const searchResult = await verifyCompanyWithGoogle(companyName, targetDomain);
  console.log(`[CompanyAnalyzer] Search result: exists=${searchResult.exists}`);

  // Rule 5: API error — safe fallback
  if (searchResult.exists === null) {
    console.log("[CompanyAnalyzer] → PENDING (API unavailable/error)");
    return {
      status: "pending",
      note: "Automatic company search was skipped (API unavailable or quota exceeded). Waiting for manual admin review.",
    };
  }

  // Rule 2: Company not found
  if (searchResult.exists === false) {
    console.log("[CompanyAnalyzer] → REJECTED (company not found online)");
    return {
      status: "rejected",
      note: `No verifiable web presence found for "${companyName}" (domain: ${targetDomain}). Please provide a valid company website for a legitimate, established business.`,
    };
  }

  // Company found — check email trust level
  if (isPublicDomain(emailDomain)) {
    console.log("[CompanyAnalyzer] → PENDING (company found but Gmail used)");
    return {
      status: "pending",
      note: `Company "${companyName}" was found online, but a personal email domain (${emailDomain}) was used. Admin review required to confirm identity.`,
    };
  }

  console.log("[CompanyAnalyzer] → APPROVED (company found + business email)");
  return {
    status: "approved",
    note: `Automatically verified. "${companyName}" confirmed via web search with business email domain (${emailDomain}).`,
  };
};

module.exports = {
  analyzeCompanyDetails,
  extractDomain,
  isPublicDomain,
};
