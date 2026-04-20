# Global Theme and Navigation System

This guide explains how to use the global theme and navigation system across all pages in your Quality Management Dashboard.

## Files Overview

### Core Files
- `global-theme.css` - Global CSS variables and styles for dark/light themes
- `global-theme.js` - JavaScript class for theme management and navigation
- `page-template.html` - Template for creating new pages

### Example Pages
- `preview.html` - Dashboard page (updated to use global system)
- `scorecard.html` - Example scorecard page using global system

## How to Use

### 1. Creating a New Page

Use the `page-template.html` as a starting point:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Page Title</title>
    <link rel="stylesheet" href="global-theme.css">
    <style>
        /* Page-specific styles */
    </style>
</head>
<body>
    <!-- Global Header Container -->
    <div id="globalHeaderContainer"></div>
    
    <!-- Global Navigation Container -->
    <div id="globalNavContainer"></div>
    
    <!-- Your page content -->
    <div class="page-content">
        <!-- Your content here -->
    </div>

    <script src="global-theme.js"></script>
    <script>
        // Page-specific JavaScript
    </script>
</body>
</html>
```

### 2. Global Components

#### Header
The global header includes:
- App title with gradient text
- Theme toggle button (🌙/☀️)
- User menu with avatar, email, and logout button

#### Navigation
The global navigation includes:
- Dashboard (📊)
- Scorecards (📝)
- Reporting (📈)
- Profile (👤)

### 3. CSS Variables

The system uses CSS custom properties for consistent theming:

#### Dark Theme (Default)
```css
--bg-primary: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
--text-primary: #f8fafc;
--border-color: rgba(255, 255, 255, 0.1);
```

#### Light Theme
```css
--bg-primary: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
--text-primary: #1e293b;
--border-color: rgba(15, 23, 42, 0.1);
```

### 4. Global CSS Classes

#### Cards
```html
<div class="global-card">
    <div class="global-card-title">Title</div>
    <div class="global-card-subtitle">Subtitle</div>
    <!-- Content -->
</div>
```

#### Buttons
```html
<button class="global-btn">Primary Button</button>
<button class="global-btn global-btn-secondary">Secondary Button</button>
```

#### Forms
```html
<div class="global-form-container">
    <div class="global-form-title">Form Title</div>
    <div class="global-form-group">
        <label class="global-form-label">Label</label>
        <input class="global-form-input" type="text" placeholder="Input">
    </div>
</div>
```

### 5. JavaScript API

#### Theme Management
```javascript
// Toggle theme
globalTheme.toggleTheme();

// Get current theme
const currentTheme = globalTheme.currentTheme;

// Set theme programmatically
globalTheme.currentTheme = 'light';
globalTheme.loadTheme();
```

#### Navigation
```javascript
// Navigate to page
globalTheme.navigateToPage('scorecard');

// Get current page
const currentPage = globalTheme.currentPage;
```

### 6. Adding New Navigation Items

To add a new navigation item, update the `createGlobalNavigation()` method in `global-theme.js`:

```javascript
createGlobalNavigation() {
    return `
        <div class="global-navigation">
            <div class="global-nav-items">
                <!-- Existing items -->
                <a href="#" class="global-nav-item" data-page="newpage">
                    <div class="global-nav-icon">🆕</div>
                    <div class="global-nav-label">New Page</div>
                </a>
            </div>
        </div>
    `;
}
```

### 7. Page Detection

The system automatically detects the current page based on the URL:
- `dashboard` - Dashboard page
- `scorecard` - Scorecard page
- `reporting` - Reporting page
- `login` - Login/Profile page

### 8. Theme Persistence

The theme preference is automatically saved to localStorage and restored on page load.

### 9. Responsive Design

The global system includes responsive breakpoints:
- Desktop: Full layout
- Tablet: Adjusted spacing
- Mobile: Stacked layout

### 10. Customization

#### Adding New CSS Variables
Add new variables to both `:root` and `[data-theme="light"]` in `global-theme.css`:

```css
:root {
    --your-new-variable: #value;
}

[data-theme="light"] {
    --your-new-variable: #light-value;
}
```

#### Custom Page Styles
Add page-specific styles in the `<style>` section of your HTML:

```css
.your-custom-class {
    background: var(--bg-card);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}
```

## Benefits

1. **Consistent Theming** - All pages use the same color scheme and styling
2. **Easy Maintenance** - Change themes globally by updating CSS variables
3. **User Preference** - Theme choice persists across all pages
4. **Responsive Design** - Works on all screen sizes
5. **Modular System** - Easy to add new pages and components
6. **Professional Appearance** - Modern, enterprise-grade design

## Next Steps

1. Update existing pages to use the global system
2. Create new pages using the template
3. Customize navigation items as needed
4. Add page-specific functionality while maintaining global consistency
