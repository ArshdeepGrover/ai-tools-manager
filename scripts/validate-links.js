// validate-links.js
// Script to validate and deduplicate links in links.json
const fs = require("fs");
const http = require("http");
const https = require("https");
const { URL } = require("url");
const { execFileSync } = require("child_process");

// README "Contribution Guidelines": descriptions are max 60 characters.
// Enforced only for tools a change adds or edits (see --base); older entries
// that predate the check are reported as one summary warning (BUG-020).
const MAX_DESCRIPTION_LENGTH = 60;
const REQUIRED_FIELDS = ["title", "url", "description"];

const UNSTABLE_DOMAINS = [
  "jules.google.com",
  "labs.google/flow",
  "gemini.google.com/gem",
];

function isUnstable(url) {
  return UNSTABLE_DOMAINS.some((domain) => url.includes(domain));
}

function checkReachability(url) {
  return new Promise((resolve) => {
    try {
      // Pick the client that matches the URL's scheme. Calling https.request()
      // on an http:// URL throws ERR_INVALID_PROTOCOL, which the catch below
      // would silently report as "unreachable".
      const { protocol } = new URL(url);
      const client = protocol === "http:" ? http : https;
      const req = client.request(
        url,
        { method: "HEAD", timeout: 5000 },
        (res) => {
          resolve(res.statusCode < 400);
        },
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function validateLinks() {
  console.log("🔍 AI Tools Links Validation");
  console.log("=".repeat(50));

  const data = JSON.parse(fs.readFileSync("data/links.json", "utf8"));
  const allTitles = new Map();
  const allUrls = new Map();
  let hasError = false;
  let warningCount = 0;
  let totalLinks = 0;
  let unreachableCount = 0;
  let unstableCount = 0;

  // Count total links
  for (const category of data.categories) {
    if (category.links && Array.isArray(category.links)) {
      totalLinks += category.links.length;
    }
  }

  console.log(`📊 OVERVIEW:`);
  console.log(`   Categories: ${data.categories.length}`);
  console.log(`   Total links: ${totalLinks}\n`);

  console.log("🔍 CHECKING FOR DUPLICATES:");
  console.log("-".repeat(30));

  for (const category of data.categories) {
    console.log(`\n📁 ${category.name} (${category.links.length} links)`);

    for (const link of category.links) {
      // Duplicate title check
      if (allTitles.has(link.title)) {
        console.error(`   ❌ DUPLICATE TITLE: "${link.title}"`);
        console.error(`      First found in: "${allTitles.get(link.title)}"`);
        console.error(`      Duplicate in: "${category.name}"`);
        hasError = true;
      } else {
        allTitles.set(link.title, category.name);
      }

      // Duplicate URL check
      if (allUrls.has(link.url)) {
        console.error(`   ❌ DUPLICATE URL: ${link.url}`);
        console.error(`      First used by: "${allUrls.get(link.url)}"`);
        console.error(`      Duplicate in: "${link.title}"`);
        hasError = true;
      } else {
        allUrls.set(link.url, link.title);
      }

      // Unstable URL check
      if (isUnstable(link.url)) {
        console.warn(`   ⚠️  UNSTABLE: "${link.title}"`);
        console.warn(`      URL: ${link.url}`);
        console.warn(
          `      (Experimental/beta service - may become unavailable)`,
        );
        unstableCount++;
        warningCount++;
      }
    }
  }

  // URL Reachability check
  console.log(`\n🌐 CHECKING URL REACHABILITY:`);
  console.log("-".repeat(30));
  console.log(`Testing ${allUrls.size} unique URLs...\n`);

  let checked = 0;
  for (const [url, title] of allUrls.entries()) {
    const reachable = await checkReachability(url);
    checked++;

    if (!reachable) {
      console.warn(`   ⚠️  UNREACHABLE: "${title}"`);
      console.warn(`      URL: ${url}`);
      console.warn(`      (May be temporarily down or blocked)\n`);
      unreachableCount++;
      warningCount++;
    }

    // Progress indicator
    if (checked % 10 === 0 || checked === allUrls.size) {
      console.log(`   Progress: ${checked}/${allUrls.size} URLs tested`);
    }
  }

  // Final Results
  console.log("\n" + "=".repeat(50));
  console.log("📋 VALIDATION RESULTS:");
  console.log("=".repeat(50));
  console.log(`✅ Categories processed: ${data.categories.length}`);
  console.log(`✅ Total links validated: ${totalLinks}`);
  console.log(`✅ Unique links: ${allUrls.size}`);

  if (warningCount > 0) {
    console.log(`\n⚠️  WARNINGS (${warningCount} total):`);
    if (unstableCount > 0) {
      console.log(`   • ${unstableCount} unstable domains`);
    }
    if (unreachableCount > 0) {
      console.log(`   • ${unreachableCount} unreachable URLs`);
    }
  }

  if (hasError) {
    console.log(`\n❌ VALIDATION FAILED!`);
    console.log(`   Critical errors found - duplicates must be fixed.`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n✅ VALIDATION PASSED WITH WARNINGS`);
    console.log(
      `   No critical errors, but ${warningCount} warnings to review.`,
    );
  } else {
    console.log(`\n🎉 VALIDATION PASSED PERFECTLY!`);
    console.log(`   No errors or warnings found!`);
  }
}

// Load data/links.json as it was at a git ref, to tell new or edited tools
// apart from existing ones. Returns a Map of url -> description, or null.
function loadBaseLinks(ref) {
  try {
    const raw = execFileSync("git", ["show", `${ref}:data/links.json`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const base = new Map();
    for (const category of JSON.parse(raw).categories || []) {
      for (const link of category.links || []) {
        base.set(link.url, link.description);
      }
    }
    return base;
  } catch {
    console.warn(
      `⚠️  Could not read data/links.json at "${ref}"; treating every tool as existing.`,
    );
    return null;
  }
}

// Per-entry rules. Returns { errors, longExisting }.
function checkEntryRules(raw, data, baseRef) {
  const errors = [];
  let parsedCount = 0;
  let longExisting = 0;
  const base = baseRef ? loadBaseLinks(baseRef) : null;

  for (const category of data.categories) {
    for (const link of category.links || []) {
      parsedCount++;
      const label = `"${link.title || "(untitled)"}" in "${category.name}"`;

      for (const field of REQUIRED_FIELDS) {
        if (typeof link[field] !== "string" || !link[field].trim()) {
          errors.push(`MISSING FIELD "${field}": ${label}`);
        }
      }
      if (typeof link.url === "string" && !link.url.startsWith("https://")) {
        errors.push(`URL MUST USE HTTPS: ${label} -> ${link.url}`);
      }

      const description = link.description || "";
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        const isNewOrEdited =
          base !== null &&
          (!base.has(link.url) || base.get(link.url) !== description);
        if (isNewOrEdited) {
          errors.push(
            `DESCRIPTION TOO LONG (${description.length}/${MAX_DESCRIPTION_LENGTH} chars): ${label}`,
          );
        } else {
          longExisting++;
        }
      }
    }
  }

  // JSON.parse keeps only the last value of a repeated key, so two tools
  // fused into one object by a bad merge still parse - and one silently
  // disappears (BUG-001, BUG-017). Every "title" key in the raw text must
  // belong to its own parsed tool.
  const rawTitleKeys = (raw.match(/"title"\s*:/g) || []).length;
  if (rawTitleKeys !== parsedCount) {
    errors.push(
      `MERGED OBJECTS: the file contains ${rawTitleKeys} "title" keys but only ${parsedCount} tools parse. ` +
        `A merge probably dropped the "}, {" between two tools - check the most recent additions.`,
    );
  }

  return { errors, longExisting };
}

// Check for duplicates only mode
function checkDuplicatesOnly(baseRef) {
  console.log("🔍 Checking for duplicate links only...\n");

  const raw = fs.readFileSync("data/links.json", "utf8");
  const data = JSON.parse(raw);
  const allTitles = new Map();
  const allUrls = new Map();
  let hasError = false;
  let totalLinks = 0;

  const { errors, longExisting } = checkEntryRules(raw, data, baseRef);
  for (const message of errors) {
    console.error(`❌ ${message}`);
    hasError = true;
  }
  if (longExisting > 0) {
    console.warn(
      `⚠️  ${longExisting} existing descriptions are longer than ${MAX_DESCRIPTION_LENGTH} characters (allowed for older entries; please shorten them when editing).`,
    );
  }

  for (const category of data.categories) {
    if (!category.name || !category.links || !Array.isArray(category.links)) {
      continue;
    }

    totalLinks += category.links.length;

    for (const link of category.links) {
      if (!link.title || !link.url) continue;

      // Duplicate title check
      if (allTitles.has(link.title)) {
        console.error(`❌ DUPLICATE TITLE: "${link.title}"`);
        console.error(`   First found in: "${allTitles.get(link.title)}"`);
        console.error(`   Duplicate in: "${category.name}"`);
        hasError = true;
      } else {
        allTitles.set(link.title, category.name);
      }

      // Duplicate URL check
      if (allUrls.has(link.url)) {
        console.error(`❌ DUPLICATE URL: ${link.url}`);
        console.error(`   First found in: "${allUrls.get(link.url)}"`);
        console.error(`   Duplicate in: "${link.title}"`);
        hasError = true;
      } else {
        allUrls.set(link.url, link.title);
      }
    }
  }

  console.log(
    `\n📊 Checked ${totalLinks} links across ${data.categories.length} categories`,
  );

  if (hasError) {
    console.log("❌ VALIDATION FAILED - see the errors above.");
    process.exit(1);
  } else {
    console.log("✅ No duplicates found!");
  }
}

if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  try {
    const baseIndex = args.indexOf("--base");
    const baseRef = baseIndex !== -1 ? args[baseIndex + 1] : null;
    if (args.includes("--duplicates-only")) {
      checkDuplicatesOnly(baseRef);
    } else {
      validateLinks();
    }
  } catch (err) {
    console.error("\n❌ Script error:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
