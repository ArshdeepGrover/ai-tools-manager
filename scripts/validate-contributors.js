// validate-contributors.js
// Script to validate contributors.json structure and data
const fs = require("fs");
const https = require("https");
const { URL } = require("url");

// Required fields for each contributor
const REQUIRED_FIELDS = ["name", "github", "avatar", "contributions", "role"];
const OPTIONAL_FIELDS = ["linkedin", "website", "tagline"];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

// Valid social media domains
const VALID_DOMAINS = {
  github: ["github.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  website: [], // Any domain allowed for website
};

function validateUrl(url, type = "website") {
  try {
    const parsedUrl = new URL(url);

    // Check if it's HTTPS (recommended)
    if (parsedUrl.protocol !== "https:") {
      return { valid: false, error: "URL should use HTTPS protocol" };
    }

    // Check domain for specific types
    if (
      type === "github" &&
      !VALID_DOMAINS.github.some((domain) =>
        parsedUrl.hostname.includes(domain)
      )
    ) {
      return { valid: false, error: "GitHub URL should be from github.com" };
    }

    if (
      type === "linkedin" &&
      !VALID_DOMAINS.linkedin.some((domain) =>
        parsedUrl.hostname.includes(domain)
      )
    ) {
      return {
        valid: false,
        error: "LinkedIn URL should be from linkedin.com",
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}

function checkUrlReachability(url) {
  return new Promise((resolve) => {
    try {
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

async function validateContributors() {
  console.log("🔍 Starting contributors validation...\n");

  try {
    const data = JSON.parse(fs.readFileSync("contributors.json", "utf8"));
    let hasError = false;
    let warningCount = 0;

    // Validate JSON structure
    if (!data.contributors || !Array.isArray(data.contributors)) {
      console.error("❌ Invalid JSON structure: contributors array not found");
      process.exit(1);
    }

    console.log(`👥 Found ${data.contributors.length} contributors\n`);

    const seenNames = new Set();
    const seenGitHub = new Set();
    const seenAvatars = new Set();

    for (let i = 0; i < data.contributors.length; i++) {
      const contributor = data.contributors[i];
      console.log(
        `🔍 Validating contributor ${i + 1}: ${contributor.name || "unnamed"}`
      );

      // Check for required fields
      for (const field of REQUIRED_FIELDS) {
        if (!contributor[field]) {
          console.error(`❌ Missing required field: ${field}`);
          hasError = true;
        }
      }

      // Check for unknown fields
      for (const field in contributor) {
        if (!ALL_FIELDS.includes(field)) {
          console.warn(`⚠️  Unknown field: ${field}`);
          warningCount++;
        }
      }

      if (contributor.name) {
        // Check for duplicate names
        if (seenNames.has(contributor.name.toLowerCase())) {
          console.error(`❌ Duplicate contributor name: ${contributor.name}`);
          hasError = true;
        } else {
          seenNames.add(contributor.name.toLowerCase());
        }

        // Validate name format
        if (contributor.name.length < 2) {
          console.error(`❌ Name too short: ${contributor.name}`);
          hasError = true;
        }

        if (contributor.name.length > 50) {
          console.warn(`⚠️  Name very long: ${contributor.name}`);
          warningCount++;
        }
      }

      if (contributor.github) {
        // Check for duplicate GitHub usernames
        if (seenGitHub.has(contributor.github.toLowerCase())) {
          console.error(`❌ Duplicate GitHub username: ${contributor.github}`);
          hasError = true;
        } else {
          seenGitHub.add(contributor.github.toLowerCase());
        }

        // Validate GitHub username format
        if (
          !/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/.test(contributor.github) &&
          contributor.github.length > 1
        ) {
          console.warn(
            `⚠️  GitHub username format may be invalid: ${contributor.github}`
          );
          warningCount++;
        }
      }

      if (contributor.avatar) {
        // Check for duplicate avatar URLs
        if (seenAvatars.has(contributor.avatar)) {
          console.warn(`⚠️  Duplicate avatar URL: ${contributor.avatar}`);
          warningCount++;
        } else {
          seenAvatars.add(contributor.avatar);
        }

        // Validate avatar URL
        const avatarValidation = validateUrl(contributor.avatar, "avatar");
        if (!avatarValidation.valid) {
          console.error(`❌ Invalid avatar URL: ${avatarValidation.error}`);
          hasError = true;
        }
      }

      if (contributor.linkedin) {
        // Check for inconsistent LinkedIn format - should be username only
        if (contributor.linkedin.includes("linkedin.com")) {
          console.error(
            `❌ LinkedIn should be username only, not full URL: ${contributor.linkedin}`
          );
          console.error(
            `   Expected format: "username" not "https://linkedin.com/in/username"`
          );
          console.error(
            `   Example: "john-doe" instead of "https://linkedin.com/in/john-doe"`
          );
          hasError = true;
        } else {
          // Validate username format
          if (!/^[a-zA-Z0-9-]+$/.test(contributor.linkedin)) {
            console.error(
              `❌ LinkedIn username format invalid: ${contributor.linkedin}`
            );
            console.error(
              `   Should contain only letters, numbers, and hyphens`
            );
            hasError = true;
          }

          if (contributor.linkedin.length < 3) {
            console.error(
              `❌ LinkedIn username too short: ${contributor.linkedin}`
            );
            hasError = true;
          }

          if (contributor.linkedin.length > 100) {
            console.error(
              `❌ LinkedIn username too long: ${contributor.linkedin}`
            );
            hasError = true;
          }
        }
      }

      if (contributor.website) {
        const websiteValidation = validateUrl(contributor.website);
        if (!websiteValidation.valid) {
          console.error(`❌ Invalid website URL: ${websiteValidation.error}`);
          hasError = true;
        }
      }

      if (contributor.tagline) {
        if (contributor.tagline.length > 100) {
          console.warn(
            `⚠️  Tagline very long (${contributor.tagline.length} chars): ${contributor.tagline}`
          );
          warningCount++;
        }

        if (contributor.tagline.length < 3) {
          console.warn(`⚠️  Tagline very short: ${contributor.tagline}`);
          warningCount++;
        }
      }

      if (contributor.contributions) {
        if (!Array.isArray(contributor.contributions)) {
          console.error(`❌ Contributions should be an array`);
          hasError = true;
        } else {
          if (contributor.contributions.length === 0) {
            console.warn(`⚠️  No contributions listed`);
            warningCount++;
          }

          // Check each contribution
          contributor.contributions.forEach((contribution, idx) => {
            if (typeof contribution !== "string") {
              console.error(`❌ Contribution ${idx + 1} should be a string`);
              hasError = true;
            } else if (contribution.length < 10) {
              console.warn(
                `⚠️  Contribution ${idx + 1} very short: ${contribution}`
              );
              warningCount++;
            }
          });
        }
      }

      console.log(`   ✅ Basic validation completed\n`);
    }

    // Check URL reachability (optional)
    console.log("🌐 Checking URL reachability...\n");

    for (const contributor of data.contributors) {
      if (contributor.avatar) {
        const reachable = await checkUrlReachability(contributor.avatar);
        if (!reachable) {
          console.warn(
            `⚠️  Avatar URL not reachable: ${contributor.name} - ${contributor.avatar}`
          );
          warningCount++;
        }
      }

      if (contributor.website) {
        const reachable = await checkUrlReachability(contributor.website);
        if (!reachable) {
          console.warn(
            `⚠️  Website URL not reachable: ${contributor.name} - ${contributor.website}`
          );
          warningCount++;
        }
      }
    }

    // Summary
    console.log("\n📋 Contributors Validation Summary:");
    console.log(`   Total contributors: ${data.contributors.length}`);
    console.log(`   Unique names: ${seenNames.size}`);
    console.log(`   Unique GitHub profiles: ${seenGitHub.size}`);
    console.log(`   Warnings: ${warningCount}`);

    if (hasError) {
      console.log("\n❌ Contributors validation failed with critical errors!");
      process.exit(1);
    } else if (warningCount > 0) {
      console.log("\n⚠️  Contributors validation completed with warnings.");
      console.log("   Consider reviewing the warnings above.");
    } else {
      console.log(
        "\n✅ Contributors validation completed successfully! All data is valid."
      );
    }
  } catch (error) {
    console.error(
      "❌ Error reading or parsing contributors.json:",
      error.message
    );
    process.exit(1);
  }
}

// Check for contributors only mode
function checkContributorsOnly() {
  console.log("🔍 Quick contributors check...\n");

  try {
    const data = JSON.parse(fs.readFileSync("contributors.json", "utf8"));
    let hasError = false;

    if (!data.contributors || !Array.isArray(data.contributors)) {
      console.error("❌ Invalid contributors structure");
      process.exit(1);
    }

    const seenNames = new Set();
    const seenGitHub = new Set();

    for (const contributor of data.contributors) {
      // Check required fields
      for (const field of REQUIRED_FIELDS) {
        if (!contributor[field]) {
          console.error(
            `❌ Missing ${field} for: ${
              contributor.name || "unnamed contributor"
            }`
          );
          hasError = true;
        }
      }

      // Check duplicates
      if (contributor.name) {
        if (seenNames.has(contributor.name.toLowerCase())) {
          console.error(`❌ Duplicate name: ${contributor.name}`);
          hasError = true;
        } else {
          seenNames.add(contributor.name.toLowerCase());
        }
      }

      if (contributor.github) {
        if (seenGitHub.has(contributor.github.toLowerCase())) {
          console.error(`❌ Duplicate GitHub: ${contributor.github}`);
          hasError = true;
        } else {
          seenGitHub.add(contributor.github.toLowerCase());
        }
      }

      // Check LinkedIn format consistency
      if (
        contributor.linkedin &&
        contributor.linkedin.includes("linkedin.com")
      ) {
        console.error(
          `❌ LinkedIn should be username only: ${contributor.name}`
        );
        console.error(`   Found: ${contributor.linkedin}`);
        console.error(`   Expected: username only (e.g., "john-doe")`);
        hasError = true;
      }
    }

    console.log(`📊 Checked ${data.contributors.length} contributors`);

    if (hasError) {
      console.log("❌ Contributors validation failed!");
      process.exit(1);
    } else {
      console.log("✅ All contributors data is valid!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes("--quick")) {
    checkContributorsOnly();
  } else {
    validateContributors();
  }
}

module.exports = { validateContributors, checkContributorsOnly };
