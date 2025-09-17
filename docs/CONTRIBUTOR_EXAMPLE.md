# Contributor Profile Example

This document shows the complete structure for adding yourself as a contributor to the AI Tools Hub.

## Complete JSON Structure

When adding yourself to `src/data/contributors.json`, use this structure:

```json
{
  "name": "Your Full Name",
  "github": "your-github-username",
  "avatar": "https://github.com/your-username.png",
  "contributions": [
    "Added ChatGPT to AI Writing & Content category",
    "Fixed broken link for Canva AI",
    "Improved mobile responsiveness for tool cards",
    "Added new AI Video category with 3 tools"
  ],
  "website": "https://your-website.com",
  "role": "Contributor"
}
```

## Field Descriptions

### Required Fields

- **`name`**: Your full name as you want it displayed
- **`github`**: Your GitHub username (without the full URL)
- **`avatar`**: URL to your profile image (GitHub avatar recommended)
- **`contributions`**: Array of your specific contributions to the project

### Optional Fields

- **`website`**: Your personal website or portfolio URL
- **`role`**: Your role in the project (defaults to "Contributor")

## Avatar Options

### GitHub Avatar (Recommended)

```json
"avatar": "https://github.com/your-username.png"
```

### Custom Avatar

```json
"avatar": "https://your-domain.com/path/to/your-image.jpg"
```

### Avatar Requirements

- **Size**: Minimum 200x200 pixels
- **Format**: PNG, JPG, or WebP
- **Aspect Ratio**: Square (1:1)
- **File Size**: Under 500KB for fast loading

## Contribution Examples

### Adding New Tools

```json
"contributions": [
  "Added Midjourney to AI Design & Images category",
  "Added DALL-E 2 to AI Design & Images category"
]
```

### Bug Fixes

```json
"contributions": [
  "Fixed broken link for Remove.bg",
  "Corrected description for Notion AI"
]
```

### Feature Improvements

```json
"contributions": [
  "Improved category filter button styling",
  "Added hover effects to tool cards",
  "Enhanced mobile navigation menu"
]
```

### Documentation

```json
"contributions": [
  "Updated README with better installation instructions",
  "Added comprehensive contributing guidelines",
  "Created deployment documentation"
]
```

## Role Types

### Creator & Maintainer

- Original project creator
- Has full repository access
- Reviews and merges pull requests

### Core Contributor

- Regular contributor with significant impact
- Helps with project direction and major features
- May have repository collaborator access

### Contributor

- Community member who has made contributions
- Added tools, fixed bugs, or improved documentation
- Default role for most contributors

### Special Recognition

- Guest contributors with unique expertise
- One-time contributors with significant impact
- Community moderators or advocates

## Complete Example

Here's a complete example of how Arshdeep Singh's profile is structured:

```json
{
  "name": "Arshdeep Singh",
  "github": "ArshdeepGrover",
  "avatar": "https://www.arshdeepsingh.info/images/arshdeep-singh.png",
  "contributions": [
    "Created the initial AI Tools Collection project",
    "Curated 28+ professional AI tools across 6 categories",
    "Designed the modern website interface with Tailwind CSS",
    "Implemented category filtering and search functionality",
    "Set up open source project structure and documentation",
    "Added comprehensive SEO optimization and social media integration",
    "Created contributor system and community guidelines",
    "Established GitHub workflows and issue templates"
  ],
  "website": "https://arshdeepsingh.info",
  "role": "Creator & Maintainer"
}
```

## Adding Your Profile

1. **Fork the repository**
2. **Edit `src/data/contributors.json`**
3. **Add your profile** to the contributors array
4. **Test locally** to ensure it displays correctly
   ```bash
   npm run build
   npm run dev
   ```
5. **Submit a pull request** with your changes

## Tips for Great Contributions

### Be Specific

Instead of: `"Added tools"`
Use: `"Added ChatGPT and Claude to AI Writing & Content category"`

### Include Impact

Instead of: `"Fixed bugs"`
Use: `"Fixed broken links for 5 tools in AI Design category"`

### Show Variety

Include different types of contributions:

- Tool additions
- Bug fixes
- Feature improvements
- Documentation updates

### Keep It Updated

Update your contributions list when you make new contributions to the project.

## Recognition

Contributors are displayed on the website in the Contributors section, showing:

- Your name and role
- Your avatar image
- Links to your GitHub profile and website
- Count of your contributions

Your contributions help build the most comprehensive AI tools directory for the community!
