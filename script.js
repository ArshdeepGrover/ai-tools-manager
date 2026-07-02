let allCategories = [];
let currentFilter = "all";
let searchTerm = ""; // current text search filter
let showAllCategories = {}; // per category expansion state
let allContributors = [];

// --- Security helpers -------------------------------------------------
// Escape untrusted strings (community-contributed JSON) before injecting
// them into innerHTML to prevent XSS.
function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escape a value for use inside a single-quoted JS string (inline handlers).
function escapeJsString(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

// Safely derive the hostname from a URL; returns "" if it can't be parsed.
function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "";
  }
}

// Only allow http/https URLs; otherwise return "#" to block javascript: etc.
function safeUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch (e) {
    /* fall through */
  }
  return "#";
}

// Favicon service for a given tool URL (used as a visual logo on cards).
function faviconUrl(url) {
  const host = safeHostname(url);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    host,
  )}&sz=64`;
}

// Contributors pagination
let currentContributorPage = 1;
const contributorsPerPage = 16; // 12 contributors per page (4x3 grid)
let filteredContributors = [];
let searchContributorsText = "";

async function loadLinks() {
  try {
    const response = await fetch("data/links.json");
    const data = await response.json();
    allCategories = data.categories;
    renderCategoryFilters(allCategories); // populate dropdown
    applyFilters(); // initial render using combined filters
    updateStats(allCategories);
  } catch (error) {
    console.error("Error loading links:", error);
    document.getElementById("main-content").innerHTML =
      "<p>Error loading links</p>";
  }
}

async function loadContributors() {
  try {
    const response = await fetch("data/contributors.json");
    const data = await response.json();

    if (
      data &&
      Array.isArray(data.contributors) &&
      data.contributors.length > 0
    ) {
      allContributors = data.contributors;
      renderContributors(allContributors);
      updateContributorStats(data.contributors.length);
      updateFooterContributorsCount(data.contributors.length);
    } else {
      throw new Error("No contributors data found");
    }
  } catch (error) {
    console.error("Error loading contributors:", error);
    // Fallback with dash
    // add fallback contributor for only development
    allContributors = [
      {
        name: "Testing Contributor",
        github: "tester123",
        avatar: "https://thispersondoesnotexist.com/",
        linkedin: "testing123",
        tagline:
          "This is a fallback contributor added due to an error in loading the contributors data.",
        contributions: ["Testing the contributors loading functionality."],
        role: "Contributor",
        featured: true,
      },
      {
        name: "Testing Contributor",
        github: "tester123",
        avatar: "https://thispersondoesnotexist.com/",
        linkedin: "testing123",
        tagline:
          "This is a fallback contributor added due to an error in loading the contributors data.",
        contributions: ["Testing the contributors loading functionality."],
        role: "Contributor",
        featured: false,
      },
    ];
    renderContributors(allContributors);
    updateFooterContributorsCount("-");
  }
}

function renderCategoryFilters(categories) {
  const select = document.getElementById("category-select");
  if (!select) return;
  const total = categories.reduce((sum, cat) => sum + cat.links.length, 0);
  select.innerHTML =
    `<option value="all">🎯 All Categories (${total})</option>` +
    categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category.name)}">${escapeHtml(
            category.icon,
          )} ${escapeHtml(category.name)} (${category.links.length})</option>`,
      )
      .join("");
  renderCategoryChips(categories, total);
}

// Quick-filter chip row mirroring the category dropdown.
function renderCategoryChips(categories, total) {
  const container = document.getElementById("category-chips");
  if (!container) return;

  const chip = (value, label, icon, count) => `
    <button type="button" class="category-chip ${
      currentFilter === value ? "active" : ""
    }" data-category="${escapeHtml(value)}"
      onclick="filterToCategory('${escapeJsString(value)}')">
      <span>${icon ? escapeHtml(icon) + " " : ""}${escapeHtml(label)}</span>
      <span class="chip-count">${count}</span>
    </button>`;

  container.innerHTML =
    chip("all", "All", "🎯", total) +
    categories
      .map((c) => chip(c.name, c.name, c.icon, c.links.length))
      .join("");
}

// Central handler used by chips (keeps dropdown + chips + filters in sync).
function filterToCategory(categoryName) {
  currentFilter = categoryName;
  const select = document.getElementById("category-select");
  if (select) select.value = categoryName;
  syncChipActiveState();
  applyFilters();
  trackCategoryFilter(categoryName);
}

function syncChipActiveState() {
  document.querySelectorAll("#category-chips .category-chip").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === currentFilter);
  });
}

// New unified filtering applying category + search term
function applyFilters() {
  let categoriesToUse = allCategories;
  if (currentFilter !== "all") {
    categoriesToUse = allCategories.filter((c) => c.name === currentFilter);
  }

  const term = searchTerm.trim().toLowerCase();
  let filtered = categoriesToUse.map((cat) => {
    if (!term) return cat; // no search filtering
    const filteredLinks = cat.links.filter(
      (link) =>
        link.title.toLowerCase().includes(term) ||
        (link.description && link.description.toLowerCase().includes(term)),
    );
    return { ...cat, links: filteredLinks };
  });

  // Remove categories that have zero links after search filtering
  filtered = filtered.filter((cat) => cat.links && cat.links.length > 0);

  // Keep the chip row in sync with the current filter
  syncChipActiveState();

  const mainContent = document.getElementById("main-content");
  const resultsCount = document.getElementById("results-count");
  mainContent.innerHTML = "";

  if (filtered.length === 0) {
    if (resultsCount) resultsCount.textContent = "";
    mainContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-magnifying-glass"></i>
        <p>No tools found matching your criteria.</p>
        <p class="empty-hint">Try a different search term or category.</p>
      </div>`;
    return;
  }

  // Update results count
  if (resultsCount) {
    const toolCount = filtered.reduce((sum, cat) => sum + cat.links.length, 0);
    const catLabel = filtered.length === 1 ? "category" : "categories";
    const toolLabel = toolCount === 1 ? "tool" : "tools";
    resultsCount.textContent = `Showing ${toolCount} ${toolLabel} across ${filtered.length} ${catLabel}`;
  }

  renderLinks(filtered);
}

function filterByCategory(categoryName) {
  currentFilter = categoryName;

  // Update active button styles
  document.querySelectorAll("#category-filters button").forEach((btn) => {
    if (btn.dataset.category === categoryName) {
      btn.className =
        "bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 active-filter";
      // Update count styling for active button
      const countSpan = btn.querySelector("span:last-child");
      if (countSpan) {
        countSpan.className =
          "bg-blue-500 text-white px-2 py-1 rounded-full text-xs";
      }
    } else {
      btn.className =
        "px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2" +
        " border-2" +
        " hover:border-blue-300";
      btn.style.cssText = `
        background-color: var(--card-bg);
        color: var(--text-secondary);
        border-color: var(--border-color);
      `;
      btn.addEventListener("mouseover", () => {
        btn.style.backgroundColor = "var(--bg-tertiary)";
      });
      btn.addEventListener("mouseout", () => {
        btn.style.backgroundColor = "var(--card-bg)";
      });
      // Update count styling for inactive buttons
      const countSpan = btn.querySelector("span:last-child");
      if (countSpan) {
        countSpan.className = "px-2 py-1 rounded-full text-xs";
        countSpan.style.cssText = `
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
        `;
      }
    }
  });

  // Filter and render categories
  let filteredCategories;
  if (categoryName === "all") {
    filteredCategories = allCategories;
  } else {
    filteredCategories = allCategories.filter(
      (category) => category.name === categoryName,
    );
  }

  // Clear and re-render
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";
  renderLinks(filteredCategories);

  // Track filter usage
  trackCategoryFilter(categoryName);
}

function renderLinks(categories) {
  const mainContent = document.getElementById("main-content");

  categories.forEach((category) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "mb-16";
    categoryDiv.setAttribute("data-category", category.name);

    // Check if category is expanded
    const isExpanded = showAllCategories[category.name] || false;
    const linksToShow = isExpanded
      ? category.links
      : category.links.slice(0, 6);

    const safeCatName = escapeHtml(category.name);
    const catJs = escapeJsString(category.name);

    categoryDiv.innerHTML = `
      <div class="flex items-center space-x-4 mb-8">
        <span class="text-4xl">${escapeHtml(category.icon)}</span>
        <h2 class="text-3xl font-bold" style="color: var(--text-primary);">${safeCatName}</h2>
        <span class="category-count-pill">${category.links.length}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${linksToShow
          .map((link) => {
            const url = safeUrl(link.url);
            const host = safeHostname(link.url);
            const favicon = faviconUrl(link.url);
            return `
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"
             class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 hover:border-blue-300 card-hover group"
             style="background-color: var(--card-bg); border-color: var(--card-border);"
             onclick="trackToolClick('${escapeJsString(
               link.title,
             )}', '${catJs}')">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3 min-w-0">
                ${
                  favicon
                    ? `<img src="${escapeHtml(favicon)}" alt="" loading="lazy"
                         class="tool-favicon" width="32" height="32"
                         onerror="this.style.display='none'" />`
                    : ""
                }
                <h3 class="text-lg font-semibold group-hover:text-blue-600 transition-colors truncate" style="color: var(--text-primary);">${escapeHtml(
                  link.title,
                )}</h3>
              </div>
              <i class="fas fa-external-link-alt group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" style="color: var(--text-tertiary);"></i>
            </div>
            <p class="mb-4 leading-relaxed" style="color: var(--text-secondary);">${escapeHtml(
              link.description,
            )}</p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-blue-600 font-medium truncate">${escapeHtml(
                host,
              )}</span>
              <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">Free</span>
            </div>
          </a>
        `;
          })
          .join("")}
      </div>
      ${
        category.links.length > 6
          ? `
        <div class="text-center mt-6">
          <button class="show-more-btn" data-action="${
            isExpanded ? "show-less" : "show-more"
          }" onclick="toggleCategory('${catJs}')">
            <span>${isExpanded ? "Show Less" : "Show More"}</span>
          </button>
        </div>
      `
          : ""
      }
    `;

    mainContent.appendChild(categoryDiv);
  });
}

// Shared builder for a contributor card (used by initial render + pagination).
// Escapes all community-provided fields and hardens external links.
function contributorCardHTML(contributor, index) {
  const contributionCount = contributor.contributions
    ? contributor.contributions.length
    : 0;
  const modalIndex = allContributors.indexOf(contributor);
  const name = escapeHtml(contributor.name);
  const nameJs = escapeJsString(contributor.name);
  const githubUrl = escapeHtml(
    safeUrl("https://github.com/" + contributor.github),
  );

  return `
    <div class="contributor-card-modern no-scroll ${
      contributor.featured ? "featured" : ""
    }"
         style="animation-delay: ${index * 0.05}s"
         onclick="openContributorModal(${modalIndex})">
      ${contributor.featured ? `<div class="floating-badge">Featured</div>` : ""}
      <div>
        <div class="flex space-x-3 mb-3 no-scroll">
          <img src="${escapeHtml(contributor.avatar)}" alt="${name}" loading="lazy"
               class="contributor-avatar-modern flex-shrink-0" />
          <div class="contributor-info flex-1 min-w-0">
            <h4 class="font-semibold text-base truncate" style="color: var(--text-primary);">${name}</h4>
            ${
              contributor.role
                ? `<p class="text-blue-600 text-sm font-medium mb-1">${escapeHtml(
                    contributor.role,
                  )}</p>`
                : ""
            }
          </div>
        </div>
        ${
          contributor.tagline
            ? `<p class="text-xs contributor-tagline truncate" style="color: var(--text-secondary);">"${escapeHtml(
                contributor.tagline,
              )}"</p>`
            : ""
        }
      </div>

      <div class="flex justify-between items-center mt-2 no-scroll">
        <div class="contributor-stats">
          ${
            contributionCount > 0
              ? `<span class="stat-item"><i class="fas fa-star" style="color: #f59e0b;"></i><span>${contributionCount}</span></span>`
              : ""
          }
        </div>
        <div class="contributor-social-modern">
          <a href="${githubUrl}" target="_blank" rel="noopener noreferrer"
             class="social-link-modern" title="GitHub"
             onclick="event.stopPropagation(); trackContributorClick('${nameJs}')">
            <i class="fab fa-github"></i>
          </a>
          ${
            contributor.linkedin
              ? `<a href="${escapeHtml(
                  safeUrl("https://linkedin.com/in/" + contributor.linkedin),
                )}" target="_blank" rel="noopener noreferrer" class="social-link-modern" title="LinkedIn" onclick="event.stopPropagation()"><i class="fab fa-linkedin"></i></a>`
              : ""
          }
          ${
            contributor.website
              ? `<a href="${escapeHtml(
                  safeUrl(contributor.website),
                )}" target="_blank" rel="noopener noreferrer" class="social-link-modern" title="Website" onclick="event.stopPropagation()"><i class="fas fa-globe"></i></a>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function renderContributors(contributors) {
  // Update total contributors count
  const totalContributorsText = document.getElementById(
    "total-contributors-text",
  );
  if (totalContributorsText) {
    totalContributorsText.textContent = contributors.length;
  }

  // Filter contributors based on search text
  if (searchContributorsText.trim()) {
    const searchLower = searchContributorsText.toLowerCase();
    filteredContributors = contributors.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        (c.tagline && c.tagline.toLowerCase().includes(searchLower)) ||
        (c.role && c.role.toLowerCase().includes(searchLower)),
    );
  } else {
    filteredContributors = contributors;
  }

  // Reset to page 1 when filtering
  currentContributorPage = 1;

  // Calculate pagination
  const totalPages = Math.ceil(
    filteredContributors.length / contributorsPerPage,
  );
  const startIndex = (currentContributorPage - 1) * contributorsPerPage;
  const contributorsToShow = filteredContributors.slice(
    startIndex,
    startIndex + contributorsPerPage,
  );

  // Render Modern Grid
  const modernGrid = document.getElementById("contributors-modern-grid");
  if (modernGrid) {
    if (filteredContributors.length === 0) {
      modernGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-search text-4xl" style="color: var(--text-tertiary); opacity: 0.5;"></i>
          <p class="mt-4" style="color: var(--text-secondary);">No contributors found matching your search.</p>
        </div>
      `;
    } else {
      modernGrid.innerHTML = contributorsToShow
        .map((contributor, index) => contributorCardHTML(contributor, index))
        .join("");
    }
  }

  // Render pagination controls
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let html = "";

  // Previous button
  html += `
    <button class="pagination-button ${
      currentContributorPage === 1 ? "disabled" : ""
    }"
            ${
              currentContributorPage === 1
                ? "disabled"
                : "onclick='changeContributorPage(" +
                  (currentContributorPage - 1) +
                  ")'"
            }>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Page numbers with ellipsis
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentContributorPage - 1 && i <= currentContributorPage + 1)
    ) {
      html += `
        <button class="pagination-button ${
          i === currentContributorPage ? "active" : ""
        }"
                onclick="changeContributorPage(${i})">
          ${i}
        </button>
      `;
    } else if (i === 2 || i === totalPages - 1) {
      html += `<span class="pagination-info">...</span>`;
    }
  }

  // Next button
  html += `
    <button class="pagination-button ${
      currentContributorPage === totalPages ? "disabled" : ""
    }"
            ${
              currentContributorPage === totalPages
                ? "disabled"
                : "onclick='changeContributorPage(" +
                  (currentContributorPage + 1) +
                  ")'"
            }>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  // Pagination info
  const totalDisplayed = filteredContributors.length;
  const startNum = Math.min(
    (currentContributorPage - 1) * contributorsPerPage + 1,
    totalDisplayed,
  );
  const endNum = Math.min(
    currentContributorPage * contributorsPerPage,
    totalDisplayed,
  );

  html += `<span class="pagination-info">Showing ${startNum}-${endNum} of ${totalDisplayed}</span>`;

  paginationContainer.innerHTML = html;
}

function changeContributorPage(pageNumber) {
  const totalPages = Math.ceil(
    filteredContributors.length / contributorsPerPage,
  );

  if (pageNumber < 1 || pageNumber > totalPages) return;

  currentContributorPage = pageNumber;

  // Re-render with current filtered contributors
  const totalContributorsText = document.getElementById(
    "total-contributors-text",
  );
  if (totalContributorsText) {
    totalContributorsText.textContent = filteredContributors.length;
  }

  // Calculate pagination
  const startIndex = (currentContributorPage - 1) * contributorsPerPage;
  const contributorsToShow = filteredContributors.slice(
    startIndex,
    startIndex + contributorsPerPage,
  );

  // Render Modern Grid
  const modernGrid = document.getElementById("contributors-modern-grid");
  if (modernGrid) {
    modernGrid.innerHTML = contributorsToShow
      .map((contributor, index) => contributorCardHTML(contributor, index))
      .join("");
  }

  // Re-render pagination
  renderPaginationControls(totalPages);

  // Smooth scroll to contributors section
  const contributorsSection = document.getElementById("contributors");
  if (contributorsSection) {
    contributorsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openContributorModal(contributorIndex) {
  const contributor = allContributors[contributorIndex];
  if (!contributor) return;

  // Remove any existing modal
  const existingModal = document.getElementById("contributor-modal-backdrop");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const cName = escapeHtml(contributor.name);
  const cWebsite = escapeHtml(safeUrl(contributor.website));
  const cWebsiteHost = escapeHtml(safeHostname(contributor.website));
  const cGithub = escapeHtml(
    safeUrl("https://github.com/" + contributor.github),
  );
  const cLinkedin = escapeHtml(
    safeUrl("https://linkedin.com/in/" + contributor.linkedin),
  );
  const modalHTML = `
    <div id="contributor-modal-backdrop" class="contributor-modal-backdrop active no-scroll">
      <div class="contributor-modal no-scroll">
        <button class="modal-close-btn" onclick="closeContributorModal()" title="Close">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="modal-header">
          <img src="${escapeHtml(contributor.avatar)}" alt="${cName}" class="modal-avatar" />
          <div class="modal-title-section flex-1">
            <h2>${cName}</h2>
            ${
              contributor.website
                ? `<p><i class="fas fa-globe"></i> <a href="${cWebsite}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6;">${cWebsiteHost}</a></p>`
                : ""
            }
            ${
              contributor.role
                ? `<div class="modal-role-badge">${escapeHtml(
                    contributor.role,
                  )}</div>`
                : ""
            }
          </div>
        </div>

        ${
          contributor.tagline
            ? `
          <div class="modal-section">
            <p style="color: var(--text-secondary); font-style: italic; border-left: 3px solid #3b82f6; padding-left: 12px;">
              "${escapeHtml(contributor.tagline)}"
            </p>
          </div>
        `
            : ""
        }

        ${
          contributor.contributions && contributor.contributions.length > 0
            ? `
          <div class="modal-section">
            <div class="modal-section-title">
              <i class="fas fa-star"></i>
              <span>Contributions (${contributor.contributions.length})</span>
            </div>
            <ul class="contributions-list">
              ${contributor.contributions
                .map((contrib) => `<li>${escapeHtml(contrib)}</li>`)
                .join("")}
            </ul>
          </div>
        `
            : ""
        }

        <div class="modal-section no-scroll ">
          <div class="modal-section-title">
            <i class="fas fa-link"></i>
            <span>Connect</span>
          </div>
          <div class="modal-social-links">
            <a href="${cGithub}" target="_blank" rel="noopener noreferrer" class="modal-social-link">
              <i class="fab fa-github"></i>
              <span>GitHub</span>
            </a>
            ${
              contributor.linkedin
                ? `
              <a href="${cLinkedin}" target="_blank" rel="noopener noreferrer" class="modal-social-link">
                <i class="fab fa-linkedin"></i>
                <span>LinkedIn</span>
              </a>
            `
                : ""
            }
            ${
              contributor.website
                ? `
              <a href="${cWebsite}" target="_blank" rel="noopener noreferrer" class="modal-social-link">
                <i class="fas fa-globe"></i>
                <span>Website</span>
              </a>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Append to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Close on backdrop click
  document
    .getElementById("contributor-modal-backdrop")
    .addEventListener("click", (e) => {
      if (e.target.id === "contributor-modal-backdrop") {
        closeContributorModal();
      }
    });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeContributorModal();
    }
  });
}

function closeContributorModal() {
  const modal = document.getElementById("contributor-modal-backdrop");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

function updateStats(categories) {
  const totalTools = categories.reduce(
    (sum, category) => sum + category.links.length,
    0,
  );
  const totalToolsElement = document.getElementById("total-tools");
  if (totalToolsElement) {
    totalToolsElement.textContent = totalTools + "+";
  }

  // Update tools count in status widget
  const toolsCountElement = document.getElementById("tools-count");
  if (toolsCountElement) {
    toolsCountElement.textContent = `${totalTools} tools`;
  }
}

function updateContributorStats(count) {
  const contributorsElement = document.getElementById("total-contributors");
  if (contributorsElement) {
    contributorsElement.textContent = count + "+";
  }
}

function updateFooterContributorsCount(count) {
  // Update ALL footer contributors count elements
  const footerContributorsCounts = document.querySelectorAll(
    '[id="footer-contributors-count"]',
  );
  footerContributorsCounts.forEach((element) => {
    // Show count or dash if invalid
    const displayCount = count && count > 0 ? count : "-";
    element.textContent = displayCount;
    if (displayCount !== "-") {
      element.classList.add("animate-pulse");
      setTimeout(() => {
        element.classList.remove("animate-pulse");
      }, 1000);
    }
  });
}

// Tooltip functionality
function showTooltip(element) {
  const contributorName = element.dataset.contributorName;
  const contributionCount = element.dataset.contributionCount;
  const contributions = JSON.parse(element.dataset.contributions);

  // Remove any existing tooltip
  const existingTooltip = document.getElementById("contribution-tooltip-modal");
  if (existingTooltip) {
    existingTooltip.remove();
  }

  // Create tooltip HTML
  const tooltipHTML = `
    <div id="contribution-tooltip-modal" class="tooltip-modal">
      <div class="tooltip-backdrop-modal" onclick="closeTooltip()"></div>
      <div class="tooltip-content-modal">
        <div class="flex justify-between items-center mb-3">
          <div class="tooltip-header-modal">Contributions (${contributionCount})</div>
          <button class="text-lg transition-colors" onclick="closeTooltip()" title="Close" style="color: var(--text-tertiary);" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-tertiary)'">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="mb-2 font-medium" style="color: var(--text-secondary);">${contributorName}</div>
        <ul class="tooltip-list-modal">
          ${
            contributions.length > 0
              ? contributions.map((contrib) => `<li>• ${contrib}</li>`).join("")
              : "<li>No contributions listed</li>"
          }
        </ul>
      </div>
    </div>
  `;

  // Append to body
  document.body.insertAdjacentHTML("beforeend", tooltipHTML);
}

function closeTooltip() {
  const tooltip = document.getElementById("contribution-tooltip-modal");
  if (tooltip) {
    tooltip.remove();
  }
}

// Analytics tracking functions
function trackToolClick(toolName, category) {
  if (typeof gtag !== "undefined") {
    gtag("event", "tool_click", {
      tool_name: toolName,
      category: category,
      event_category: "engagement",
    });
  }
}

function trackContributorClick(contributorName) {
  if (typeof gtag !== "undefined") {
    gtag("event", "contributor_click", {
      contributor_name: contributorName,
      event_category: "engagement",
    });
  }
}

function trackCategoryFilter(categoryName) {
  if (typeof gtag !== "undefined") {
    gtag("event", "category_filter", {
      category_name: categoryName,
      event_category: "navigation",
    });
  }
}

// Simple mobile menu toggle
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const menuIcon = document.getElementById("menu-icon");

  if (mobileMenu.classList.contains("hidden")) {
    // Show menu
    mobileMenu.classList.remove("hidden");
    menuIcon.classList.add("rotate");
    menuIcon.classList.remove("fa-bars");
    menuIcon.classList.add("fa-times");
  } else {
    // Hide menu
    mobileMenu.classList.add("hidden");
    menuIcon.classList.remove("rotate");
    menuIcon.classList.remove("fa-times");
    menuIcon.classList.add("fa-bars");
  }
}

function toggleCategory(categoryName) {
  showAllCategories[categoryName] = !showAllCategories[categoryName];
  applyFilters(); // Re-render with current filters
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add smooth scrolling to all anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Close mobile menu if open
        const mobileMenu = document.getElementById("mobile-menu");
        if (!mobileMenu.classList.contains("hidden")) {
          toggleMobileMenu();
        }
      }
    });
  });

  // Set up search + category listeners
  const searchInput = document.getElementById("tool-search");
  if (searchInput) {
    const runToolSearch = debounce((value) => {
      searchTerm = value;
      applyFilters();
    }, 180);
    searchInput.addEventListener("input", (e) => runToolSearch(e.target.value));
  }

  // Contributors search listener
  const contributorsSearchInput = document.getElementById(
    "contributors-search",
  );
  if (contributorsSearchInput) {
    const runContributorSearch = debounce((value) => {
      searchContributorsText = value;
      renderContributors(allContributors);
    }, 180);
    contributorsSearchInput.addEventListener("input", (e) =>
      runContributorSearch(e.target.value),
    );
  }

  const categorySelect = document.getElementById("category-select");
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      syncChipActiveState();
      applyFilters();
      trackCategoryFilter(currentFilter);
    });
  }

  // Show loading skeletons while data is being fetched
  showToolsSkeleton();

  // Load content
  loadLinks();
  loadContributors();
  loadGitHubStars();
});

// Lightweight debounce used for search inputs.
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Render shimmer placeholder cards while tools load.
function showToolsSkeleton(count = 6) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;
  const card = `
    <div class="skeleton-card">
      <div class="skeleton-line title"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>`;
  mainContent.innerHTML = `<div class="skeleton-grid">${card.repeat(
    count,
  )}</div>`;
}

// GitHub Stars functionality
async function loadGitHubStars() {
  const owner = "ArshdeepGrover";
  const repo = "ai-tools-manager";

  // Set initial loading state
  updateFooterStats("-", "-", "-");

  try {
    const response = await fetch(
      "https://api.github.com/repos/ArshdeepGrover/ai-tools-manager",
    );

    const data = await response.json();
    const starCount = data.stargazers_count || "-";
    const forkCount = data.forks_count || "-";

    // Get open issues
    let issuesCount = "-";
    try {
      const issuesRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=open`,
      );
      const issuesData = await issuesRes.json();
      issuesCount = Array.isArray(issuesData)
        ? issuesData.filter((item) => !item.pull_request).length
        : "-";
    } catch (e) {
      console.warn("Could not fetch issues count:", e);
    }

    // Update all GitHub star buttons
    if (starCount !== "-") {
      updateGitHubButtons(starCount);
    }

    // Update footer stats
    updateFooterStats(starCount, forkCount, issuesCount);
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    // Keep loading state ("-") if API fails
    updateFooterStats("-", "-", "-");
  }
}

function updateGitHubButtons(starCount) {
  // Update navigation GitHub button
  const navStarCount = document.getElementById("nav-star-count");
  if (navStarCount) {
    navStarCount.innerHTML = `<i class="fas fa-star mr-1"></i>${starCount}`;
    navStarCount.classList.remove("hidden");
    navStarCount.classList.add("star-count-appear");
  }

  // Update hero section GitHub button
  const heroStarCount = document.getElementById("hero-star-count");
  if (heroStarCount) {
    heroStarCount.innerHTML = `<i class="fas fa-star mr-1"></i>${starCount}`;
    heroStarCount.classList.remove("hidden");
    heroStarCount.classList.add("star-count-appear");
  }

  // Update contributors section GitHub button
  const contributorsStarCount = document.getElementById(
    "contributors-star-count",
  );
  if (contributorsStarCount) {
    contributorsStarCount.innerHTML = `<i class="fas fa-star mr-1"></i>${starCount}`;
    contributorsStarCount.classList.remove("hidden");
    contributorsStarCount.classList.add("star-count-appear");
  }

  // Track GitHub stars loaded
  if (typeof gtag !== "undefined") {
    gtag("event", "github_stars_loaded", {
      star_count: starCount,
      event_category: "engagement",
    });
  }
}

function updateFooterStats(starCount, forkCount, issuesCount) {
  // Update ALL footer star count elements (there might be multiple)
  const footerStarCounts = document.querySelectorAll(
    '[id="footer-star-count"]',
  );
  footerStarCounts.forEach((element) => {
    element.textContent = starCount;
    element.classList.add("animate-pulse");
    setTimeout(() => {
      element.classList.remove("animate-pulse");
    }, 1000);
  });

  // Update ALL footer fork count elements
  const footerForkCounts = document.querySelectorAll(
    '[id="footer-fork-count"]',
  );
  footerForkCounts.forEach((element) => {
    element.textContent = forkCount;
    element.classList.add("animate-pulse");
    setTimeout(() => {
      element.classList.remove("animate-pulse");
    }, 1000);
  });

  // Update ALL footer issues count elements
  const footerIssuesCounts = document.querySelectorAll(
    '[id="footer-issue-count"]',
  );
  footerIssuesCounts.forEach((element) => {
    element.textContent = issuesCount;
    element.classList.add("animate-pulse");
    setTimeout(() => {
      element.classList.remove("animate-pulse");
    }, 1000);
  });

  // Track GitHub stats loaded
  if (typeof gtag !== "undefined") {
    gtag("event", "github_stats_loaded", {
      star_count: starCount,
      fork_count: forkCount,
      event_category: "engagement",
    });
  }
}

// Theme Toggle Functionality (system-aware with persistence)
function initializeTheme() {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = document.getElementById("theme-icon");
  if (!themeToggleBtn || !themeIcon) return;

  const root = document.documentElement;
  const mediaQuery =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");

  const getSavedPreference = () => localStorage.getItem("theme");
  const inSystemMode = () => getSavedPreference() == null;

  const applyTheme = (mode) => {
    if (mode === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  };

  const updateIcon = (mode) => {
    if (mode === "dark") {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
      themeToggleBtn.setAttribute("title", "Switch to light mode");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
      themeToggleBtn.setAttribute("title", "Switch to dark mode");
    }
  };

  const effectiveTheme = () => {
    const saved = getSavedPreference();
    if (saved === "light" || saved === "dark") return saved;
    return mediaQuery && mediaQuery.matches ? "dark" : "light";
  };

  // Initial apply
  const initial = effectiveTheme();
  applyTheme(initial);
  updateIcon(initial);

  // Respond to system changes only when in "system mode"
  const handleSystemChange = (e) => {
    if (!inSystemMode()) return;
    const next = e.matches ? "dark" : "light";
    applyTheme(next);
    updateIcon(next);
  };
  if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handleSystemChange);
  } else if (mediaQuery && typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handleSystemChange);
  }

  // Toggle handler: user explicitly chooses light/dark
  themeToggleBtn.addEventListener("click", function () {
    const current = effectiveTheme();
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    updateIcon(next);
    localStorage.setItem("theme", next);
  });
}

// Initialize theme when DOM is loaded (runs alongside other DOMContentLoaded)
document.addEventListener("DOMContentLoaded", initializeTheme);

//back to top button
const backToTopBtn = document.getElementById("backToTopBtn");

// Show/hide button on scroll
window.onscroll = function () {
  if (
    document.body.scrollTop > 150 ||
    document.documentElement.scrollTop > 150
  ) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
};

// Scroll to top smoothly
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// PWA and Offline Functionality
class PWAManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.lastSyncTime = localStorage.getItem("ai-tools-last-sync") || "Never";
    this.installPrompt = null;
    this.swRegistration = null;
    this.init();
  }

  async init() {
    this.setupConnectionListeners();
    this.setupServiceWorker();
    this.setupInstallPrompt();
    this.updateConnectionStatus();
    this.loadCachedDataWhenOffline();
  }

  // Service Worker Registration
  async setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register("/sw.js");

        console.log("[PWA] Service Worker registered successfully");

        // Listen for SW messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        // Check for updates
        this.swRegistration.addEventListener("updatefound", () => {
          this.handleServiceWorkerUpdate();
        });

        // Handle SW state changes
        if (this.swRegistration.waiting) {
          this.showUpdateAvailable();
        }
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    }
  }

  // Handle messages from Service Worker
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case "DATA_UPDATE":
        this.handleDataUpdate(data);
        break;
      case "CACHE_STATUS":
        this.updateCacheStatus(data);
        break;
      case "CACHE_CLEARED":
        this.showNotification("Cache cleared successfully", "success");
        break;
    }
  }

  // Handle data updates from SW
  handleDataUpdate(data) {
    if (data.isStale) {
      this.showNotification(
        "Working offline - some features may be limited",
        "warning",
      );
    } else {
      this.lastSyncTime = new Date().toLocaleString();
      localStorage.setItem("ai-tools-last-sync", this.lastSyncTime);
      this.updateSyncStatus();
    }
  }

  // Handle SW updates
  handleServiceWorkerUpdate() {
    const newWorker = this.swRegistration.installing;

    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        this.showUpdateAvailable();
      }
    });
  }

  // Show update notification
  showUpdateAvailable() {
    const updateNotification = this.createNotification(
      "App Update Available",
      "A new version is ready. Refresh to update.",
      "info",
      [
        {
          text: "Update Now",
          action: () => {
            if (this.swRegistration.waiting) {
              this.swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            }
          },
        },
        {
          text: "Later",
          action: () => this.dismissNotification(),
        },
      ],
    );
    this.showNotificationElement(updateNotification);
  }

  // Connection Status Management
  setupConnectionListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.updateConnectionStatus();
      this.syncDataWhenOnline();
      this.showNotification("Connection restored", "success");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.updateConnectionStatus();
      this.showNotification("Working offline", "warning");
    });
  }

  // Update connection status in UI
  updateConnectionStatus() {
    // Update floating status widget
    const statusWidget = document.getElementById("status-widget");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    if (statusWidget && statusDot && statusText) {
      if (this.isOnline) {
        statusWidget.classList.remove("offline");
        statusDot.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
        statusText.textContent = "Online";
      } else {
        statusWidget.classList.add("offline");
        statusDot.className =
          "w-2 h-2 rounded-full bg-orange-500 animate-pulse";
        statusText.textContent = "Offline";
      }
    }

    // Show/hide offline banner
    const offlineBanner = document.getElementById("offline-banner");
    if (offlineBanner) {
      if (this.isOnline) {
        offlineBanner.classList.add("hidden");
      } else {
        offlineBanner.classList.remove("hidden");
      }
    }
  }

  // Update sync status display
  updateSyncStatus() {
    // Sync status is now handled by the connection status
    // No separate sync display needed in the minimal design
  }

  // Load cached data when offline
  async loadCachedDataWhenOffline() {
    if (!this.isOnline) {
      try {
        // Override the loadLinks function to use cache-first strategy
        if (typeof loadLinks === "function") {
          const originalLoadLinks = loadLinks;

          window.loadLinks = async () => {
            try {
              await originalLoadLinks();
            } catch (error) {
              console.log("[PWA] Loading from cache due to network error");
              await this.loadFromCache();
            }
          };
        }
      } catch (error) {
        console.error("[PWA] Error setting up offline data loading:", error);
      }
    }
  }

  // Load data from cache
  async loadFromCache() {
    try {
      const cache = await caches.open("ai-tools-data-v1.0.0");
      const cachedResponse = await cache.match("/data/links.json");

      if (cachedResponse) {
        const data = await cachedResponse.json();
        allCategories = data.categories;
        renderCategoryFilters(allCategories);
        applyFilters();
        updateStats(allCategories);
        this.showNotification("Loaded saved data", "info");
      }
    } catch (error) {
      console.error("[PWA] Error loading cached data:", error);
    }
  }

  // Sync data when coming back online
  async syncDataWhenOnline() {
    if (this.swRegistration && this.swRegistration.sync) {
      try {
        await this.swRegistration.sync.register("background-sync-data");
      } catch (error) {
        console.log("[PWA] Background sync not available, manual sync");
        // Manual sync fallback
        setTimeout(() => {
          if (typeof loadLinks === "function") loadLinks();
          if (typeof loadContributors === "function") loadContributors();
        }, 1000);
      }
    }
  }

  // PWA Installation
  setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton();
    });

    // Handle install result
    window.addEventListener("appinstalled", () => {
      this.installPrompt = null;
      this.hideInstallButton();
      this.showNotification("App installed successfully!", "success");
      // Track installation
      if (typeof gtag !== "undefined") {
        gtag("event", "pwa_install", {
          event_category: "engagement",
        });
      }
    });
  }

  // Show install button
  showInstallButton() {
    const installButton = document.getElementById("pwa-install-btn");
    if (installButton) {
      installButton.classList.remove("hidden");
      installButton.addEventListener("click", () => this.promptInstall());
    } else {
      // Create install button if it doesn't exist
      this.createInstallButton();
    }
  }

  // Create install button
  createInstallButton() {
    const installBtn = document.createElement("button");
    installBtn.id = "pwa-install-btn";
    installBtn.className =
      "fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center space-x-2";
    installBtn.innerHTML =
      '<i class="fas fa-download"></i><span>Install App</span>';
    installBtn.addEventListener("click", () => this.promptInstall());

    document.body.appendChild(installBtn);
  }

  // Prompt installation
  async promptInstall() {
    if (!this.installPrompt) return;

    try {
      const result = await this.installPrompt.prompt();

      if (typeof gtag !== "undefined") {
        gtag("event", "pwa_install_prompt", {
          event_category: "engagement",
          result: result.outcome,
        });
      }

      this.installPrompt = null;
    } catch (error) {
      console.error("[PWA] Install prompt error:", error);
    }
  }

  // Hide install button
  hideInstallButton() {
    const installButton = document.getElementById("pwa-install-btn");
    if (installButton) {
      installButton.classList.add("hidden");
    }
  }

  // Notification System
  showNotification(message, type = "info", duration = 5000) {
    const notification = this.createNotification(message, "", type);
    this.showNotificationElement(notification);

    if (duration > 0) {
      setTimeout(() => {
        this.dismissNotification(notification);
      }, duration);
    }
  }

  createNotification(title, message, type = "info", actions = []) {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;

    // Type-specific styling
    const typeClasses = {
      success: "bg-green-500 text-white",
      warning: "bg-orange-500 text-white",
      error: "bg-red-500 text-white",
      info: "bg-blue-500 text-white",
    };

    notification.classList.add(...typeClasses[type].split(" "));

    const icons = {
      success: "fas fa-check-circle",
      warning: "fas fa-exclamation-triangle",
      error: "fas fa-times-circle",
      info: "fas fa-info-circle",
    };

    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <i class="${icons[type]} mt-1"></i>
        <div class="flex-1">
          <div class="font-semibold">${title}</div>
          ${message ? `<div class="text-sm opacity-90">${message}</div>` : ""}
          ${
            actions.length > 0
              ? `
            <div class="mt-2 flex space-x-2">
              ${actions
                .map(
                  (action) => `
                <button class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition-colors" onclick="this.parentElement.parentElement.parentElement.parentElement.querySelector('.notification-action-${actions.indexOf(
                  action,
                )}').click()">
                  ${action.text}
                </button>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
        <button class="text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add action handlers
    actions.forEach((action, index) => {
      const actionBtn = document.createElement("button");
      actionBtn.className = `notification-action-${index} hidden`;
      actionBtn.addEventListener("click", action.action);
      notification.appendChild(actionBtn);
    });

    return notification;
  }

  showNotificationElement(notification) {
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);
  }

  dismissNotification(notification) {
    if (notification && notification.parentElement) {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }
  }

  // Cache Management
  async getCacheStatus() {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalSize += requests.length;
      }

      return {
        cacheCount: cacheNames.length,
        totalItems: totalSize,
      };
    } catch (error) {
      return { cacheCount: 0, totalItems: 0 };
    }
  }

  async clearCache() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      this.showNotification("Cache cleared successfully", "success");
    } catch (error) {
      this.showNotification("Error clearing cache", "error");
    }
  }
}

// Initialize PWA Manager
let pwaManager;
document.addEventListener("DOMContentLoaded", () => {
  pwaManager = new PWAManager();
});

// Expose PWA functions globally for debugging
window.pwa = {
  clearCache: () => pwaManager?.clearCache(),
  getCacheStatus: () => pwaManager?.getCacheStatus(),
  promptInstall: () => pwaManager?.promptInstall(),
  sync: () => pwaManager?.syncDataWhenOnline(),
};
// Update current year in footer
function updateCurrentYear() {
  const currentYearElement = document.getElementById("current-year");
  if (currentYearElement) {
    const currentYear = new Date().getFullYear();
    currentYearElement.textContent = currentYear;
  }
}

// Initialize year update when DOM is loaded
document.addEventListener("DOMContentLoaded", updateCurrentYear);
