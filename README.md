# Custom Tab Switcher focused on efficiency inspired by the microsoft edge tab view

works in all browsers that suport chrome extentions

This replaces Edge's buggy built-in tab view (Ctrl+Shift+A) with a custom popup that actually works.

the extention whil soon be available in the chrome extention web store too

## Features

✅ **Arrow key navigation** - Navigate up/down through tabs 
✅ **Search tabs** - Type to filter tabs by title or URL
✅ **instantly lauch tabs**
✅ **pinn favorite tabs**
✅ **Fast and responsive** - Instant navigation

## Installation

1. **Download the extension and extract

2. **Open Edge Extensions**
   - Go to `edge://extensions/`
   - Enable **Developer mode** (toggle in bottom-left)

3. **Load the extension**
   - Click **Load unpacked**
   - Select the `tab-switcher` folder
   - Extension should now be installed

4. **Set up keyboard shortcut (optional)**
   - In `edge://extensions/`, click **Keyboard shortcuts** (bottom of page)
   - Find "Blue tabs"
   - Set your preferred shortcut (default is Ctrl+Shift+x)

## Usage

### Opening the Tab Switcher

**Method 1:** Press **Ctrl+Shift+Space** (or your custom shortcut)
**Method 2:** Click the extension icon in the toolbar

### Navigation

| Key | Action |
|-----|--------|
| **↑** / **↓** | Navigate up/down through tabs |
| **Enter** | Switch to selected tab |
| **Home** | Jump to first tab |
| **End** | Jump to last tab |
| **Page Up/Down** | Jump 10 tabs |
| **Ctrl+W** | Close selected tab |
| **Escape** | Close the tab switcher |
| **Type** | Search/filter tabs |

### Search

Just start typing in the search box to filter tabs by:
- Tab title
- URL

The list updates instantly as you type.

## Why This Works

Unlike the previous extension attempt, this one:

1. **Creates its own popup window** - Not trying to modify Edge's built-in UI
2. **Uses the Chrome Tabs API** - Gets tab list directly from the browser
3. **Implements its own navigation** - Complete control over arrow key behavior
4. **No DOM detection needed** - Works regardless of Edge's internal structure

The popup is a regular HTML page with JavaScript that has full control over keyboard events. Arrow keys work perfectly because we're handling them ourselves, not relying on Edge's broken implementation.

## Advantages Over Edge's Built-in Tab View

✅ Arrow keys actually work
✅ Faster and more responsive
✅ Better search functionality
✅ More keyboard shortcuts
✅ Can close tabs without switching to them
✅ Shows URLs for easier identification
✅ Visual indication of current tab

## Troubleshooting

**Keyboard shortcut not working?**
- Go to `edge://extensions/` → Keyboard shortcuts
- Make sure the shortcut is set and not conflicting with another extension
- Try a different key combination

**Extension not showing tabs?**
- Make sure you have tabs open
- Try reloading the extension
- Check that the extension has "tabs" permission

**Can't find the extension icon?**
- Click the puzzle piece icon in Edge toolbar
- Pin "Custom Tab Switcher" to toolbar

## Comparison to Original Requirements

| Feature | Built-in Edge Tab View | This Extension |
|---------|----------------------|----------------|
| Arrow key navigation | ❌ Broken | ✅ Works perfectly |
| Search tabs | ✅ Works | ✅ Works |
| Keyboard shortcuts | Limited | ✅ Full support |
| Close tabs with keyboard | Limited | ✅ Ctrl+W |
| Visual feedback | Basic | ✅ Clear highlighting |

## Technical Notes

This extension:
- Uses Manifest V3 (latest standard)
- Requires only "tabs" permission
- Popup is 500x600px
- Supports unlimited tabs (with scrolling)
- Uses native browser APIs (fast and reliable)
