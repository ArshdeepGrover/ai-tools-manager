# Assets Directory

This directory contains all the visual assets for the AI Tools Collection website.

## Files Included

### Images

- `og-image.svg` - Open Graph image for social media sharing (1200x630)
- `favicon.svg` - Main favicon in SVG format (scalable vector)

### Required Favicon Files (to be generated)

To complete the favicon setup, you'll need to generate these files from the favicon.svg:

- `favicon-16x16.png` - 16x16 PNG favicon
- `favicon-32x32.png` - 32x32 PNG favicon
- `apple-touch-icon.png` - 180x180 PNG for iOS devices
- `android-chrome-192x192.png` - 192x192 PNG for Android
- `android-chrome-512x512.png` - 512x512 PNG for Android

## How to Generate Favicon Files

You can use online tools like:

1. [Favicon.io](https://favicon.io/) - Upload the favicon.svg and generate all sizes
2. [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive favicon generator
3. [Favicon Generator](https://www.favicon-generator.org/) - Simple favicon generator

Or use command line tools:

```bash
# Using ImageMagick (if installed)
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
convert favicon.svg -resize 192x192 android-chrome-192x192.png
convert favicon.svg -resize 512x512 android-chrome-512x512.png
```

## Social Media Image

The `og-image.svg` is optimized for:

- Facebook Open Graph
- Twitter Cards
- LinkedIn sharing
- Discord embeds
- Other social platforms

## Design Details

### Color Scheme

- Primary Blue: #3b82f6
- Secondary Purple: #8b5cf6
- Gradient: Blue to Purple
- Background: Multi-color gradient (blue → purple → pink)

### Typography

- Font Family: Inter (Google Fonts)
- Weights: 300, 400, 500, 600, 700, 800

### Icons

- Robot icon represents AI/automation
- Gear icon represents tools/productivity
- Emoji icons for categories (🤖, ✨, 🚀)

## Usage Guidelines

1. **Favicon**: Use favicon.svg as the primary favicon with PNG fallbacks for older browsers
2. **Social Sharing**: og-image.svg is automatically used when sharing links on social platforms
3. **PWA**: The manifest.json references these icons for progressive web app installation
4. **Branding**: Maintain the blue-purple gradient theme across all assets for consistency
5. **Performance**: SVG format ensures crisp display at all screen resolutions and sizes

## Asset Optimization

- All SVG files are optimized for web delivery
- Images use efficient compression without quality loss
- Assets are designed to work across all modern browsers and devices
- Color schemes follow accessibility guidelines for contrast ratios
