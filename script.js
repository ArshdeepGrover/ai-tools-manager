let allCategories = [];
let currentFilter = "all";
let searchTerm = ""; // current text search filter

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
    renderContributors(data.contributors);
    updateContributorStats(data.contributors.length);
  } catch (error) {
    console.error("Error loading contributors:", error);
  }
}

function renderCategoryFilters(categories) {
  const select = document.getElementById("category-select");
  if (!select) return;
  const total = categories.reduce((sum, cat) => sum + cat.links.length, 0);
  select.innerHTML = `<option value="all">🎯 All Categories (${total})</option>` +
    categories
      .map(
        (category) => `<option value="${category.name}">${category.icon} ${category.name} (${category.links.length})</option>`
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
    mainContent.innerHTML = `<p class="text-center text-gray-500">No tools found matching your criteria.</p>`;
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
});

let feedbackStars = 0;

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
  });
}

function submitFeedback(){
  const comment = document.getElementById("feedback-comment").value;
  if (feedbackStars === 0 ){
    alert("Please select a star rating ! ");
    return;
  }
    saveFeedback(feedbackStars,comment)
    feedbackStars = 0;
    HighlightFeedbackStars(0);
    document.getElementById("feedback-comment").value = "";
}

function saveFeedback(stars,comment){
  fetch("http://localhost:5000/api/feedback",{
   method : "POST",
   headers : {"content-Type":"application/json"},
   body : JSON.stringify({
    tool : "GitHubCopilot",
    stars,
    comment
   })
  })
    .then(res => {
      if(!res.ok){
        throw new Error("Network response was not ok ");
      }
      return res.json();
    })
    .then(data =>{
      console.log("Feedback Saved : ",data);
      loadFeedback();
    })
    .catch(err =>
      console.error("Error saving feedback : ",err));
}

function loadFeedback(){
  fetch("http://localhost:5000/feedback/GitHubCopilot")
  .then(res => {
    if(!res.ok){
      throw new Error("Network response was not ok ")
    }
    return res.json();
  })
  .then(data => {
    // console.log("Feedback fetched : ",data)
    displayFeedback(data);
  })
  .catch(err => 
    console.error("Error loading feedback : ",err)
  );
}

 function displayFeedback(feedbackData){
   const list = document.getElementById("feedback-list");
   list.innerHTML = "<h3> User Reviews : </h3>";
   if (feedbackData.length === 0 || !feedbackData){
       const noFeedback = document.createElement("P");
       noFeedback.textContent = "No feedback yet . ";
       list.appendChild(noFeedback);
       return;
  }
   feedbackData.forEach(fb => {
      const fbEl = document.createElement("div")
      fbEl.innerHTML = `${"Rating : "} - <strong>${"\u2605 ".repeat(fb.stars || 0)}</strong> - ${fb.comment || "No comment "} `; 
      fbEl.querySelectorAll("strong").forEach(e1 => e1.style.color = "gold");
      list.appendChild(fbEl); 
  });
}