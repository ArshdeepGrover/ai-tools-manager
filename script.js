let allCategories = [];
let currentFilter = "all";

async function loadLinks() {
  try {
    const response = await fetch("links.json");
    const data = await response.json();
    allCategories = data.categories;
    renderCategoryFilters(allCategories);
    renderLinks(allCategories);
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
    renderContributors(data.contributors);
    updateContributorStats(data.contributors.length);
  } catch (error) {
    console.error("Error loading contributors:", error);
  }
}

function renderCategoryFilters(categories) {
  const filtersContainer = document.getElementById("category-filters");

  // Add "All" filter button
  const allButton = `
    <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 active-filter" onclick="filterByCategory('all')" data-category="all">
      <span>🎯</span>
      <span>All Categories</span>
      <span class="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">${categories.reduce(
        (sum, cat) => sum + cat.links.length,
        0
      )}</span>
    </button>
  `;

  // Add individual category filter buttons
  const categoryButtons = categories
    .map(
      (category) => `
    <button class="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 hover:border-blue-300 transition-colors flex items-center space-x-2" onclick="filterByCategory('${category.name}')" data-category="${category.name}">
      <span>${category.icon}</span>
      <span>${category.name}</span>
      <span class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">${category.links.length}</span>
    </button>
  `
    )
    .join("");

  filtersContainer.innerHTML = allButton + categoryButtons;
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
        "bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 hover:border-blue-300 transition-colors flex items-center space-x-2";
      // Update count styling for inactive buttons
      const countSpan = btn.querySelector("span:last-child");
      if (countSpan) {
        countSpan.className =
          "bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs";
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

    categoryDiv.innerHTML = `
      <div class="flex items-center space-x-4 mb-8">
        <span class="text-4xl">${category.icon}</span>
        <h2 class="text-3xl font-bold text-gray-900">${category.name}</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${category.links
          .map(
            (link) => `
          <a href="${link.url}" target="_blank" 
             class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-blue-300 card-hover group"
             onclick="trackToolClick('${link.title}', '${category.name}')">
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">${
                link.title
              }</h3>
              <i class="fas fa-external-link-alt text-gray-400 group-hover:text-blue-500 transition-colors"></i>
            </div>
            <p class="text-gray-600 mb-4 leading-relaxed">${
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
    `;

    mainContent.appendChild(categoryDiv);
  });
}

function renderContributors(contributors) {
  const contributorsGrid = document.getElementById("contributors-grid");

  contributorsGrid.innerHTML = contributors
    .map(
      (contributor) => `
    <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 text-center card-hover">
      <img src="${contributor.avatar}" alt="${contributor.name}" 
           class="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-gray-100" />
      <h4 class="text-lg font-semibold text-gray-900 mb-1">${
        contributor.name
      }</h4>
      ${
        contributor.role
          ? `<p class="text-blue-600 text-sm font-medium mb-2">${contributor.role}</p>`
          : ""
      }
      ${
        contributor.tagline
          ? `<p class="text-gray-600 text-sm mb-4 italic">"${contributor.tagline}"</p>`
          : ""
      }
      <div class="flex justify-center space-x-2 mb-4">
        <a href="https://github.com/${contributor.github}" target="_blank" 
           class="w-9 h-9 bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors text-sm"
           onclick="trackContributorClick('${contributor.name}')">
          <i class="fab fa-github"></i>
        </a>
        ${
          contributor.linkedin
            ? `
          <a href="https://linkedin.com/in/${contributor.linkedin}" target="_blank" 
             class="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors text-sm">
            <i class="fab fa-linkedin"></i>
          </a>
        `
            : ""
        }
        ${
          contributor.website
            ? `
          <a href="${contributor.website}" target="_blank" 
             class="w-9 h-9 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors text-sm">
            <i class="fas fa-globe"></i>
          </a>
        `
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");
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

// Mobile menu toggle
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenu.classList.toggle("hidden");
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
          mobileMenu.classList.add("hidden");
        }
      }
    });
  });

  // Load content
  loadLinks();
  loadContributors();
});

let feedbackStars = 0;
const feedback = []

window.addEventListener("load",()=>{
  const ratingDiv = document.getElementById("feedback-stars");
  for (let i = 1 ;i <= 5 ; i++){
    const star = document.createElement("span");
    star.innerHTML = "\u2605";
    star.dataset.value = i;
    star.addEventListener("click",() => {
      feedbackStars = i;
      HighlightFeedbackStars(i);
    });
    ratingDiv.appendChild(star);
  }
  loadFeedback();
});

function HighlightFeedbackStars(count){
  const stars = document.querySelectorAll("#feedback-stars span");
  stars.forEach((stars,index)=>{
    if (index < count ){
      stars.classList.add("active");
    }
    else{
      stars.classList.remove("active")
    }
  })
}

function submitFeedback(){
  const comment = document.getElementById("feedback-comment").value;
  if (feedbackStars === 0 ){
    alert("Please select a star rating ! ");
    return;
  }
    feedback.push({stars:feedbackStars,comment});
    saveFeedback()
    displayFeedbak()
    feedbackStars = 0;
    HighlightFeedbackStars(0);
    document.getElementById("feedback-comment").value = "";
}
function displayFeedbak(){
  const list = document.getElementById("feedback-list");
  list.innerHTML = "<h3> User Feedback : </h3>";
}

feedback.forEach(fb => {
  const fbEl = document.createElement("div")
  fbEl.innerHTML = "<strong>$ {"*".repeat(fb.stars)}</strong> -$ {fb.comment}";
  list.appendChild(fbEl); 
});

function saveFeedback(){
  localStorage.setItem("feedbacks",JSON.stringify(feedback));
}

function loadFeedback(){
  const saved = localStorage.getItem("feedbacks");
  if (saved){
    feedback.push(...JSON.parse(saved));
    displayFeedbak();
  }
}