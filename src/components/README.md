# Components Directory

This directory contains reusable UI components and modules for the AI Tools Hub.

## Structure

```
components/
├── ui/              # UI components (cards, buttons, modals)
├── layout/          # Layout components (header, footer, navigation)
├── features/        # Feature-specific components (search, filters)
└── common/          # Common/shared components
```

## Component Guidelines

### File Naming
- Use kebab-case for file names: `tool-card.js`
- Use PascalCase for class/component names: `ToolCard`

### Structure
Each component should be self-contained and reusable:

```javascript
// Example: tool-card.js
export class ToolCard {
  constructor(toolData) {
    this.data = toolData;
  }
  
  render() {
    // Component rendering logic
  }
}
```

### Dependencies
- Keep components lightweight
- Minimize external dependencies
- Use vanilla JavaScript for better performance