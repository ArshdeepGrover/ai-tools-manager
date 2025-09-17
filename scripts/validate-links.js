// validate-links.js
// Script to validate and deduplicate links in links.json
const fs = require("fs");
const https = require("https");
const { URL } = require("url");

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
      const { hostname } = new URL(url);
      const req = https.request(
        url,
        { method: "HEAD", timeout: 5000 },
        (res) => {
          resolve(res.statusCode < 400);
        }
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

  const data = JSON.parse(fs.readFileSync("links.json", "utf8"));
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
          `      (Experimental/beta service - may become unavailable)`
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
      `   No critical errors, but ${warningCount} warnings to review.`
    );
  } else {
    console.log(`\n🎉 VALIDATION PASSED PERFECTLY!`);
    console.log(`   No errors or warnings found!`);
  }
}

// Check for duplicates only mode
function checkDuplicatesOnly() {
  console.log("🔍 Checking for duplicate links only...\n");

  const data = JSON.parse(fs.readFileSync("links.json", "utf8"));
  const allTitles = new Map();
  const allUrls = new Map();
  let hasError = false;
  let totalLinks = 0;

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
    `\n📊 Checked ${totalLinks} links across ${data.categories.length} categories`
  );

  if (hasError) {
    console.log("❌ DUPLICATES FOUND!");
    process.exit(1);
  } else {
    console.log("✅ No duplicates found!");
  }
}

if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  if (args.includes("--duplicates-only")) {
    checkDuplicatesOnly();
  } else {
    validateLinks();
  }
}
