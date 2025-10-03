let allCategories = [];
let currentFilter = "all";
let searchTerm = ""; // current text search filter
let showAllCategories = {}; // per category expansion state
let showAllContributors = false;
let allContributors = [];

async function loadLinks() {
  try {
    const response = await fetch("links.json");
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
    const response = await fetch("contributors.json");
    const data = await response.json();
    allContributors = data.contributors;
    renderContributors(allContributors);
    updateContributorStats(data.contributors.length);
  } catch (error) {
    console.error("Error loading contributors:", error);
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
          `<option value="${category.name}">${category.icon} ${category.name} (${category.links.length})</option>`
      )
      .join("");
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
        (link.description && link.description.toLowerCase().includes(term))
    );
    return { ...cat, links: filteredLinks };
  });

  // Remove categories that have zero links after search filtering
  filtered = filtered.filter((cat) => cat.links && cat.links.length > 0);

  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";
  if (filtered.length === 0) {
    mainContent.innerHTML = `<p class="text-center" style="color: var(--text-tertiary);">No tools found matching your criteria.</p>`;
    return;
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
      button.style.cssText = `
        background-color: var(--card-bg);
        color: var(--text-secondary);
        border-color: var(--border-color);
      `;
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "var(--bg-tertiary)";
      });
      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "var(--card-bg)";
      });
      // Update count styling for inactive buttons
      const countSpan = btn.querySelector("span:last-child");
      if (countSpan) {
        countSpan.className =
          "px-2 py-1 rounded-full text-xs";
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
      (category) => category.name === categoryName
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
    const linksToShow = isExpanded ? category.links : category.links.slice(0, 6);

    categoryDiv.innerHTML = `
      <div class="flex items-center space-x-4 mb-8">
        <span class="text-4xl">${category.icon}</span>
        <h2 class="text-3xl font-bold" style="color: var(--text-primary);">${category.name}</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${linksToShow
          .map(
            (link) => `
          <a href="${link.url}" target="_blank"
             class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 hover:border-blue-300 card-hover group"
             style="background-color: var(--card-bg); border-color: var(--card-border);"
             onclick="trackToolClick('${link.title}', '${category.name}')">
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-xl font-semibold group-hover:text-blue-600 transition-colors" style="color: var(--text-primary);">${
                link.title
              }</h3>
              <i class="fas fa-external-link-alt group-hover:text-blue-500 transition-colors" style="color: var(--text-tertiary);"></i>
            </div>
            <p class="mb-4 leading-relaxed" style="color: var(--text-secondary);">${
              link.description
            }</p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-blue-600 font-medium">${
                new URL(link.url).hostname
              }</span>
              <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Free</span>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
      ${category.links.length > 6 ? `
        <div class="text-center mt-6">
          <button class="show-more-btn" data-action="${isExpanded ? 'show-less' : 'show-more'}" onclick="toggleCategory('${category.name}')">
            <span>${isExpanded ? 'Show Less' : 'Show More'}</span>
          </button>
        </div>
      ` : ''}
    `;

    mainContent.appendChild(categoryDiv);
  });
}

function renderContributors(contributors) {
  // Update total contributors count
  const totalContributorsText = document.getElementById(
    "total-contributors-text"
  );
  if (totalContributorsText) {
    totalContributorsText.textContent = contributors.length;
  }

  // Always show all contributors (pagination removed)
  const contributorsToShow = contributors;

  // Render Modern Grid
  const modernGrid = document.getElementById("contributors-modern-grid");
  if (modernGrid) {
    modernGrid.innerHTML = contributorsToShow
      .map((contributor, index) => {
        const isCreator = contributor.role === "Creator & Maintainer";
        const contributionCount = contributor.contributions
          ? contributor.contributions.length
          : 0;

        return `
          <div class="contributor-card-modern"
               style="animation-delay: ${index * 0.1}s">
            <div>
              <div class="flex items-center space-x-3 mb-3">
                <img src="${contributor.avatar}" alt="${contributor.name}"
                     class="contributor-avatar-modern flex-shrink-0" />
                <div class="contributor-info flex-1 min-w-0">
                  <h4 class="font-semibold text-base mb-1 truncate" style="color: var(--text-primary);">${
                    contributor.name
                  }</h4>
                  ${
                    contributor.role
                      ? `<p class="text-blue-600 text-sm font-medium mb-1">${contributor.role}</p>`
                      : ""
                  }
                  ${
                    contributor.tagline
                      ? `<p class="text-xs contributor-tagline" style="color: var(--text-secondary);">"${contributor.tagline}"</p>`
                      : ""
                  }
                </div>
              </div>
            </div>

            <div class="contributor-social-modern">
              <a href="https://github.com/${
                contributor.github
              }" target="_blank"
                 class="social-link-modern" title="GitHub"
                 onclick="trackContributorClick('${contributor.name}')">
                <i class="fab fa-github"></i>
              </a>
              ${
                contributor.linkedin
                  ? `
                <a href="https://linkedin.com/in/${contributor.linkedin}" target="_blank"
                   class="social-link-modern" title="LinkedIn">
                  <i class="fab fa-linkedin"></i>
                </a>
              `
                  : ""
              }
              ${
                contributor.website
                  ? `
                <a href="${contributor.website}" target="_blank"
                   class="social-link-modern" title="Website">
                  <i class="fas fa-globe"></i>
                </a>
              `
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Pagination removed - no button needed
  const showAllBtnContainer = document.getElementById("show-all-contributors-container");
  if (showAllBtnContainer) {
    showAllBtnContainer.innerHTML = "";
  }
}

function updateStats(categories) {
  const totalTools = categories.reduce(
    (sum, category) => sum + category.links.length,
    0
  );
  const totalToolsElement = document.getElementById("total-tools");
  if (totalToolsElement) {
    totalToolsElement.textContent = totalTools + "+";
  }
}

function updateContributorStats(count) {
  const contributorsElement = document.getElementById("total-contributors");
  if (contributorsElement) {
    contributorsElement.textContent = count + "+";
  }
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

function toggleShowAllContributors() {
  showAllContributors = !showAllContributors;
  renderContributors(allContributors);
  // Scroll to default parts when showing less
  if (!showAllContributors) {
    setTimeout(() => {
      const contributorsSection = document.getElementById('contributors');
      if (contributorsSection) {
        contributorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }
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
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value;
      applyFilters();
    });
  }
  const categorySelect = document.getElementById("category-select");
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      applyFilters();
      trackCategoryFilter(currentFilter);
    });
  }

  // Load content
  loadLinks();
  loadContributors();
  loadGitHubStars();
});

// GitHub Stars functionality
async function loadGitHubStars() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/ArshdeepGrover/ai-tools-manager"
    );
    const data = await response.json();
    const starCount = data.stargazers_count;
    const forkCount = data.forks_count;

    // Update all GitHub star buttons
    updateGitHubButtons(starCount);

    // Update footer stats
    updateFooterStats(starCount, forkCount);
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    // Fallback - just show the buttons without star count
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
    "contributors-star-count"
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

function updateFooterStats(starCount, forkCount) {
  // Update footer star count
  const footerStarCount = document.getElementById("footer-star-count");
  if (footerStarCount) {
    footerStarCount.textContent = starCount;
    footerStarCount.classList.add("animate-pulse");
    setTimeout(() => {
      footerStarCount.classList.remove("animate-pulse");
    }, 1000);
  }

  // Update footer fork count
  const footerForkCount = document.getElementById("footer-fork-count");
  if (footerForkCount) {
    footerForkCount.textContent = forkCount;
    footerForkCount.classList.add("animate-pulse");
    setTimeout(() => {
      footerForkCount.classList.remove("animate-pulse");
    }, 1000);
  }

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
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const root = document.documentElement; // apply data-theme on <html> to minimize FOUC
  const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

  const getSavedPreference = () => localStorage.getItem('theme'); // 'light' | 'dark' | null
  const inSystemMode = () => getSavedPreference() == null;

  const applyTheme = (mode) => {
    if (mode === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  };

  const syncToggle = (mode) => {
    const isLight = mode === 'light';
    themeToggle.checked = isLight; // Checked = light mode
    themeToggle.setAttribute('aria-checked', String(isLight));
  };

  const effectiveTheme = () => {
    const saved = getSavedPreference();
    if (saved === 'light' || saved === 'dark') return saved;
    // Default to system preference when no saved value
    return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
  };

  // Initial apply
  const initial = effectiveTheme();
  applyTheme(initial);
  syncToggle(initial);

  // Respond to system changes only when in "system mode" (no saved preference)
  const handleSystemChange = (e) => {
    if (!inSystemMode()) return;
    const next = e.matches ? 'dark' : 'light';
    applyTheme(next);
    syncToggle(next);
  };
  if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleSystemChange);
  } else if (mediaQuery && typeof mediaQuery.addListener === 'function') {
    // Safari fallback
    mediaQuery.addListener(handleSystemChange);
  }

  // Toggle handler: user explicitly chooses light/dark (exits system mode)
  themeToggle.addEventListener('change', function () {
    const next = this.checked ? 'light' : 'dark';
    applyTheme(next);
    syncToggle(next);
    localStorage.setItem('theme', next);
  });
}

// Initialize theme when DOM is loaded (runs alongside other DOMContentLoaded)
document.addEventListener('DOMContentLoaded', initializeTheme);

//back to top button
const backToTopBtn = document.getElementById("backToTopBtn");

// Show/hide button on scroll
window.onscroll = function () {
  if (document.body.scrollTop > 150 || document.documentElement.scrollTop > 150) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
};

// Scroll to top smoothly
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});