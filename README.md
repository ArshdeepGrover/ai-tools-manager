# 🚀 AI Tools Hub - Professional Directory

A curated collection of 100+ professional AI tools, maintained by the community. This project welcomes contributions from developers worldwide to help build the most comprehensive AI tools directory.

## 🌟 Features

- **Curated AI Tools**: Hand-picked collection of the best free AI tools
- **Community Driven**: Open for contributions from anyone
- **Responsive Design**: Works perfectly on all devices
- **Easy Navigation**: Organized by categories for quick discovery
- **Analytics Tracking**: Usage insights with Google Analytics

## 🚀 Live Demo

Visit the live website: [AI Tools Collection](https://ai-tool-collection.vercel.app/)

## 📊 Current Stats

- **100+** Free AI Tools
- **10** Categories
- **Open Source** & Community Maintained

## 🤝 How to Contribute

We welcome contributions from everyone! Here's how you can help improve this project:

### Adding New AI Tools

1. **Fork this repository**
2. **Clone your fork locally**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-tools-manager.git
   cd ai-tools-manager
   ```

3. **Add your tool to `src/data/links.json`**
   - Find the appropriate category or create a new one
   - Add your tool following this format:

   ```json
   {
     "title": "Tool Name",
     "url": "https://tool-website.com",
     "description": "Brief description of what the tool does"
   }
   ```

4. **Add yourself as a contributor** (see below)

5. **Test your changes**
   ```bash
   npm run build
   npm run dev
   ```
   - Verify your tool appears correctly
   - Check that the link works

6. **Submit a Pull Request**
   - Create a descriptive title
   - Explain what tool you added and why it's valuable
   - Include any relevant screenshots

### Adding Yourself as a Contributor

When you contribute, add yourself to the contributors list:

1. **Add your information to `src/data/contributors.json`**:

   ```json
   {
     "name": "Your Name",
     "github": "your-github-username",
     "avatar": "https://github.com/your-username.png",
     "contributions": ["Added Tool Name", "Fixed bug in category X"],
     "website": "https://your-website.com" // optional
   }
   ```

2. **Your profile will automatically appear** in the contributors section

## 📁 Project Structure

```
ai-tools-hub/
├── 📁 src/                     # Source files
│   ├── 📁 assets/              # Images, icons, fonts
│   ├── 📁 styles/              # CSS files
│   ├── 📁 scripts/             # JavaScript files
│   ├── 📁 data/                # JSON data files
│   └── 📁 templates/           # HTML templates
├── 📁 public/                  # Build output
│   └── index.html              # Main HTML file
├── 📁 scripts/                 # Build/utility scripts
├── 📁 tests/                   # Test files
├── 📁 .github/                 # GitHub workflows & templates
├── package.json
├── README.md
└── LICENSE
```

## 🛠️ Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ArshdeepGrover/ai-tools-manager.git
   cd ai-tools-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Development workflow**

   ```bash
   # Build the project
   npm run build
   
   # Start development server
   npm run dev
   
   # Validate data files
   npm run validate
   
   # Run tests
   npm test
   ```

4. **Make your changes**
   - Edit `src/data/links.json` to add/modify tools
   - Update `src/data/contributors.json` to add yourself
   - Modify files in `src/` directory as needed

## 📋 Contribution Guidelines

### For AI Tools

- **Free or Freemium**: Tools should have a free tier or be completely free
- **Working Links**: Ensure all URLs are active and correct
- **Accurate Descriptions**: Provide clear, concise descriptions
- **Appropriate Category**: Place tools in the right category
- **No Duplicates**: Check if the tool already exists

### For Code Contributions

- **Clean Code**: Follow existing code style and structure
- **Test Changes**: Ensure your changes don't break existing functionality
- **Responsive Design**: Maintain mobile-friendly design
- **Performance**: Keep the site fast and lightweight

### Creating New Categories

If you want to add a new category:

1. **Add to `src/data/links.json`**:

   ```json
   {
     "name": "New Category Name",
     "icon": "🔥", // Choose an appropriate emoji
     "links": [
       // Your tools here
     ]
   }
   ```

2. **Ensure it fits the theme**: Should be AI-related tools

## 🎨 Design Guidelines

- **Consistent Styling**: Follow the existing design patterns
- **Accessibility**: Ensure good contrast and keyboard navigation
- **Mobile First**: Design should work on mobile devices
- **Performance**: Optimize images and minimize code

## 📈 Analytics

This project uses Google Analytics to track:

- Page views and user engagement
- Popular tools and categories
- Geographic distribution of users
- Device and browser usage

Analytics help us understand how to improve the collection and what tools are most valuable to users.

## 🏆 Contributors

Thank you to all the amazing people who have contributed to this project!

<!-- Contributors will be automatically displayed here -->

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Original Creator**: [Arshdeep Singh](https://github.com/ArshdeepGrover)
- **All Contributors**: Thank you for making this project better!
- **AI Tool Creators**: Thanks to all the amazing AI tool developers

## 📋 Issue Templates

We have comprehensive issue templates for different types of contributions:

- 🛠️ **Add New Tool** - Add AI tools to the collection
- 🐛 **Bug Report** - Report bugs and issues
- 🚀 **Feature Request** - Suggest new features
- 🔧 **Improvement Request** - Enhance existing features
- 📚 **Documentation Issue** - Fix/improve documentation
- 🔍 **Data Quality Issue** - Fix tool info/broken links
- 🎨 **Design/UI Issue** - Visual/UX improvements
- ⚡ **Performance Issue** - Speed/optimization
- 🏷️ **Category Request** - New tool categories
- 🤝 **Collaboration Request** - Partnerships
- 🔒 **Security Issue** - Security vulnerabilities
- 📱 **Mobile Issue** - Mobile-specific problems
- 🌐 **Accessibility Issue** - A11y improvements

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/ArshdeepGrover/ai-tools-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ArshdeepGrover/ai-tools-manager/discussions)
- **Creator**: [Arshdeep Singh](https://arshdeepsingh.info)

---

**⭐ If you find this project helpful, please give it a star on GitHub!**

Made with ❤️ by the community
