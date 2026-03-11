# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension for color picking and management. The extension allows users to:
- Pick colors from any webpage using the EyeDropper API
- Store picked colors in localStorage
- View color details in HEX and RGB formats
- Export colors as a text file
- Clear all stored colors

## Architecture

### Core Files
- `manifest.json` - Chrome extension manifest (v3) with storage permissions
- `index.html` - Extension popup UI with picker and export buttons
- `index.js` - Main functionality including color picking, storage, and export
- `style.css` - UI styling with Roboto fonts and responsive design
- `icons/icon-512x512.png` - Extension icon

### Key Components
- **Color Picker**: Uses the modern EyeDropper API to select colors from screen
- **Color Storage**: Stores picked colors in Chrome's localStorage as JSON array
- **Color Display**: Rich card-based layout showing colors with individual delete buttons
- **Color Popup**: Beautiful modal with enhanced UI showing detailed color information (HEX/RGB)
- **Individual Color Deletion**: Each color can be removed individually via delete button
- **Export System**: Generates timestamped text files containing all picked colors

### Data Flow
1. User clicks picker button → activates EyeDropper API
2. Selected color is stored in `pickedColors` array and localStorage
3. UI updates to show new color in the grid
4. Clicking a color opens detailed popup with copy-to-clipboard functionality
5. Export creates downloadable text file with filename format `colors_YYYYMMDDHHMMSS.txt`

## Development Notes

### Browser API Usage
- Uses Chrome Extension Manifest v3
- Requires "storage" permission for localStorage access
- Relies on EyeDropper API (modern browsers only)
- Uses clipboard API for copy functionality

### UI Behavior
- Extension popup hides during color picking to avoid interference
- Colors are displayed in card-based layout with rich visual design
- Individual colors can be deleted with trash icon button
- Duplicate colors are automatically prevented
- Interface supports both Japanese and English text
- Uses TailwindCSS for modern, responsive design
- Enhanced animations and hover effects for better UX

### File Structure
- No build process - static files loaded directly
- TailwindCSS loaded via CDN for modern styling
- Custom CSS file for animations and enhancements
- JavaScript is vanilla ES6+ with async/await patterns
- Uses Inter font for UI and JetBrains Mono for code

### Installation
Extension is installed via Chrome's developer mode by loading the unpacked folder.