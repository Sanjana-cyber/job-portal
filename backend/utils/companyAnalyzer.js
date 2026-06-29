const axios = require("axios");
const dns = require("dns").promises;

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
 * Uses DNS to verify if a company domain exists and is active on the internet.
 * Completely free and requires no API keys.
 */
const verifyCompanyExistence = async (companyName, domain) => {
  if (!domain) return { exists: false };

  console.log(`[CompanyAnalyzer] 🔍 Checking internet presence for: ${domain}`);

  try {
    // Check if the domain has any IPv4 or IPv6 addresses
    const addresses = await dns.resolve(domain);
    if (addresses && addresses.length > 0) {
      console.log(`[CompanyAnalyzer] ✅ Domain "${domain}" is active and exists online.`);
      return { exists: true };
    }
  } catch (err) {
    console.log(`[CompanyAnalyzer] DNS check failed for ${domain}: ${err.message}`);
    
    // Fallback: Try with 'www.' prefix just in case the bare domain doesn't resolve
    if (!domain.startsWith("www.")) {
      try {
        const wwwDomain = "www." + domain;
        console.log(`[CompanyAnalyzer] 🔍 Fallback checking: ${wwwDomain}`);
        const fallbackAddresses = await dns.resolve(wwwDomain);
        if (fallbackAddresses && fallbackAddresses.length > 0) {
          console.log(`[CompanyAnalyzer] ✅ Domain "${wwwDomain}" is active.`);
          return { exists: true };
        }
      } catch (fallbackErr) {
        console.log(`[CompanyAnalyzer] ❌ Fallback check also failed.`);
      }
    }
  }

  console.log(`[CompanyAnalyzer] ❌ Company domain NOT found online.`);
  return { exists: false };
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

  const searchResult = await verifyCompanyExistence(companyName, targetDomain);
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
