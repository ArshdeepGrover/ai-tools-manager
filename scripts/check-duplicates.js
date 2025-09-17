// check-duplicates.js
// Simple script to check for duplicate links in links.json
const fs = require("fs");

function checkDuplicates() {
  console.log("🔍 Checking for duplicate links...\n");

  try {
    const data = JSON.parse(fs.readFileSync("links.json", "utf8"));
    const allTitles = new Map();
    const allUrls = new Map();
    let hasError = false;
    let totalLinks = 0;

    // Validate JSON structure
    if (!data.categories || !Array.isArray(data.categories)) {
      console.error("❌ Invalid JSON structure: categories array not found");
      process.exit(1);
    }

    console.log(`📊 Found ${data.categories.length} categories`);

    for (const category of data.categories) {
      if (!category.name || !category.links || !Array.isArray(category.links)) {
        console.error(
          `❌ Invalid category structure: ${
            category.name || "unnamed category"
          }`
        );
        hasError = true;
        continue;
      }

      console.log(
        `📁 Checking category: ${category.name} (${category.links.length} links)`
      );
      totalLinks += category.links.length;

      for (const link of category.links) {
        // Validate required fields
        if (!link.title || !link.url) {
          console.error(
            `❌ Missing title or URL in link: ${JSON.stringify(link)}`
          );
          hasError = true;
          continue;
        }

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

    // Summary
    console.log("\n📋 Summary:");
    console.log(`   Total categories: ${data.categories.length}`);
    console.log(`   Total links: ${totalLinks}`);
    console.log(`   Unique links: ${allUrls.size}`);

    if (hasError) {
      console.log("\n❌ DUPLICATES FOUND!");
      console.log("Please remove duplicate titles or URLs and try again.");
      process.exit(1);
    } else {
      console.log("\n✅ No duplicates found! All links are unique.");
    }
  } catch (error) {
    console.error("❌ Error reading or parsing links.json:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkDuplicates();
}

module.exports = { checkDuplicates };
