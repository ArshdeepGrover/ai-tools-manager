# 📁 Improved Folder Structure

## Current Structure

```
ai-tools-hub/
├── 📁 .github/                 # GitHub configuration
│   ├── 📁 hooks/               # Git hooks
│   ├── 📁 ISSUE_TEMPLATE/      # 13 issue templates
│   ├── 📁 workflows/           # CI/CD workflows
│   └── pull_request_template.md
├── 📁 docs/                    # Documentation
│   ├── CHANGELOG.md
│   ├── COMMIT_GUIDELINES.md
│   ├── CONTRIBUTING.md
│   ├── CONTRIBUTOR_EXAMPLE.md
│   └── FOLDER_STRUCTURE.md
├── 📁 public/                  # Build output (served files)
│   ├── index.html
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── 📁 scripts/                 # Build & utility scripts
│   ├── build.js
│   ├── check-duplicates.js
│   ├── validate-contributors.js
│   └── validate-links.js
├── 📁 src/                     # Source files
│   ├── 📁 assets/              # Images, icons, fonts
│   │   ├── favicon.svg
│   │   ├── og-image.svg
│   │   └── README.md
│   ├── 📁 components/          # Reusable UI components
│   │   └── README.md
│   ├── 📁 config/              # Configuration files
│   │   └── site.json
│   ├── 📁 data/                # JSON data files
│   │   ├── contributors.json
│   │   └── links.json
│   ├── 📁 scripts/             # JavaScript files
│   │   ├── 📁 components/      # Component modules
│   │   ├── 📁 utils/           # Utility functions
│   │   └── script.js
│   ├── 📁 styles/              # CSS files
│   │   └── style.css
│   ├── 📁 templates/           # HTML templates
│   └── 📁 utils/               # Utility functions
│       └── README.md
├── 📁 tests/                   # Test files
│   ├── 📁 integration/         # Integration tests
│   └── 📁 unit/                # Unit tests
├── 📁 tools/                   # Development tools
│   └── README.md
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## Directory Purposes

### 📁 `.github/`
- **hooks/**: Git hooks for pre-commit validation
- **ISSUE_TEMPLATE/**: 13 specialized issue templates
- **workflows/**: GitHub Actions for CI/CD
- **pull_request_template.md**: PR template

### 📁 `docs/`
- **CHANGELOG.md**: Version history and changes
- **COMMIT_GUIDELINES.md**: Commit message standards
- **CONTRIBUTING.md**: Contribution guidelines
- **CONTRIBUTOR_EXAMPLE.md**: Contributor profile examples
- **FOLDER_STRUCTURE.md**: This file

### 📁 `public/`
- Build output directory (what gets deployed)
- Contains compiled/copied files from `src/`
- **index.html**: Main HTML file
- **manifest.json**: PWA manifest
- **robots.txt**: SEO robots file
- **sitemap.xml**: SEO sitemap

### 📁 `scripts/`
- **build.js**: Build script for development
- **check-duplicates.js**: Find duplicate tools
- **validate-contributors.js**: Validate contributor data
- **validate-links.js**: Check for broken links

### 📁 `src/`
Source code directory - where development happens

#### 📁 `src/assets/`
- **favicon.svg**: Site favicon
- **og-image.svg**: Social media preview image
- Static assets (images, icons, fonts)

#### 📁 `src/components/`
- Reusable UI components
- Modular JavaScript components
- Component documentation

#### 📁 `src/config/`
- **site.json**: Site configuration and settings
- Environment-specific configs
- Feature flags

#### 📁 `src/data/`
- **contributors.json**: Contributor profiles
- **links.json**: AI tools database
- All JSON data files

#### 📁 `src/scripts/`
- **script.js**: Main JavaScript file
- **components/**: Component-specific scripts
- **utils/**: Utility functions

#### 📁 `src/styles/`
- **style.css**: Main stylesheet
- Component-specific styles
- Responsive design styles

#### 📁 `src/templates/`
- HTML template files
- Reusable HTML components
- Template partials

#### 📁 `src/utils/`
- Utility functions and helpers
- API wrappers
- Common functionality

### 📁 `tests/`
- **integration/**: Integration tests
- **unit/**: Unit tests
- Test utilities and fixtures

### 📁 `tools/`
- Development and maintenance tools
- Data management scripts
- Utility tools for contributors

## Development Workflow

### 1. **Development**
```bash
# Work in src/ directory
src/
├── Edit data/links.json
├── Modify scripts/script.js
├── Update styles/style.css
└── Add assets/
```

### 2. **Build**
```bash
npm run build
# Copies src/ files to public/
```

### 3. **Serve**
```bash
npm run dev
# Serves public/ directory
```

### 4. **Deploy**
```bash
# Deploy public/ directory to hosting
```

## File Naming Conventions

### JavaScript Files
- **kebab-case**: `tool-card.js`, `search-filter.js`
- **PascalCase for classes**: `ToolCard`, `SearchFilter`

### CSS Files
- **kebab-case**: `main.css`, `components.css`
- **BEM methodology**: `.tool-card__title`

### JSON Files
- **kebab-case**: `site-config.json`
- **camelCase for properties**: `toolName`, `categoryIcon`

### Directories
- **kebab-case**: `issue-template/`, `build-scripts/`
- **lowercase**: `src/`, `docs/`, `tests/`

## Benefits of This Structure

### 🎯 **Separation of Concerns**
- Source code in `src/`
- Build output in `public/`
- Documentation in `docs/`
- Tools in `tools/`

### 🔧 **Maintainability**
- Clear file organization
- Easy to find and modify files
- Consistent naming conventions

### 🚀 **Scalability**
- Room for growth in each directory
- Modular component structure
- Easy to add new features

### 👥 **Collaboration**
- Clear contribution guidelines
- Comprehensive issue templates
- Well-documented structure

### ⚡ **Performance**
- Optimized build process
- Separate development and production files
- Easy asset management

## Migration Notes

### From v1.0 to v2.0
- Moved all files to proper directories
- Updated all file references
- Added build process
- Created comprehensive documentation

### Breaking Changes
- File paths changed (use new `src/` structure)
- Build process required for development
- Updated npm scripts