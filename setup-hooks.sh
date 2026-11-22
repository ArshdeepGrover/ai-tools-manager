#!/bin/bash
# Setup script for git hooks

echo "🔧 Setting up git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp .github/hooks/pre-commit .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 Hook behavior (runs when data/links.json or data/contributors.json is staged):"
echo "   • Every branch: JSON syntax, merged/fused entries, required fields,"
echo "     HTTPS-only URLs, and the 60-character limit for new or edited descriptions"
echo "   • 'production' branch: the same checks again before release"
echo ""
echo "🧪 To test manually:"
echo "   node scripts/validate-links.js --duplicates-only --base HEAD"
echo "   node scripts/validate-contributors.js --quick"
