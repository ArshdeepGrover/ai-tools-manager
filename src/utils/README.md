# Utils Directory

This directory contains utility functions and helper modules used throughout the application.

## Available Utilities

### API Utilities
- **api.js** - HTTP request helpers and API wrappers
- **github.js** - GitHub API integration functions

### Data Utilities
- **validators.js** - Data validation functions
- **formatters.js** - Data formatting and transformation
- **storage.js** - Local storage management

### UI Utilities
- **dom.js** - DOM manipulation helpers
- **events.js** - Event handling utilities
- **animations.js** - Animation and transition helpers

### General Utilities
- **helpers.js** - General purpose helper functions
- **constants.js** - Application constants and configuration
- **logger.js** - Logging and debugging utilities

## Usage

```javascript
// Import specific utilities
import { validateUrl } from './utils/validators.js';
import { formatDate } from './utils/formatters.js';
import { createElement } from './utils/dom.js';

// Use in your code
const isValid = validateUrl('https://example.com');
const formatted = formatDate(new Date());
const element = createElement('div', { class: 'tool-card' });
```

## Guidelines

- Keep functions pure when possible
- Use descriptive function names
- Add JSDoc comments for complex functions
- Write unit tests for utility functions