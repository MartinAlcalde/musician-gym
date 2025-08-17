# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Functional Ear Training** web application that helps users recognize scale degrees by their function within a key. The app presents a cadence (I-IV-V-I in C major) followed by a target note, and users identify the scale degree relative to the tonic.

## Architecture

### Core Structure
- **Single-page application**: Everything runs in `index.html` with embedded JavaScript
- **Fully offline**: Uses `file://` protocol, no server or CDN dependencies required
- **Audio engine**: Built on Tone.js with embedded base64 piano samples

### Key Components
- **Audio System** (`index.html:100-185`): Manages Tone.js sampler, piano samples, and audio scheduling
- **Game State** (`index.html:187-257`): Tracks current exercise, scoring, and user interactions  
- **UI Controllers** (`index.html:258-501`): Handles piano clicks, keyboard shortcuts, settings
- **Piano Interface** (`index.html:504-583`): Dynamic piano keyboard with responsive layout
- **Key Mapping** (`index.html:584-663`): Custom keyboard shortcuts and WebHID remote support

### Audio Implementation
- Uses vendored Tone.js library (`assets/lib/Tone.js`)
- Piano samples embedded as base64 in `assets/piano.base64.js` (Salamander set)
- Supports C major cadences (I-IV-V-I) with smooth voice leading
- Real-time audio scheduling with conservative volume levels

### Exercise System
- **Exercise 1**: C-F (Do-Fa) - first half octave
- **Exercise 2**: G-C (Sol-Do) - second half octave  
- **Exercise 3**: Full octave C-C
- Adaptive highlighting shows valid answer range on piano

## Development

### No Build System
This project intentionally has no build system, package.json, or dependencies to install. It runs directly from the filesystem.

### File Structure
```
/
├── index.html          # Main application (HTML + CSS + JS)
├── README.md           # User documentation
├── assets/
│   ├── lib/Tone.js     # Vendored audio library
│   ├── piano.base64.js # Embedded piano samples
│   └── README.md       # Asset documentation
└── tools/              # (Empty directory)
```

### Running the Application
- Open `index.html` directly in a browser (double-click)
- Works with `file://` protocol offline
- No HTTP server required

### Key Features
- **Responsive piano UI**: CSS custom properties handle different screen sizes
- **WebHID support**: Can connect Bluetooth shutter remotes for answers
- **Local storage**: Saves user preferences (notation style, key mappings)
- **Keyboard shortcuts**: Customizable key mappings for piano notes

### Testing
- No formal test suite - testing is done manually by:
  1. Opening `index.html` in browser
  2. Verifying audio loads ("Ready. Press Start" message)
  3. Testing cadence playback and target note identification
  4. Checking piano UI responsiveness across screen sizes

### Modifying Audio
- Piano samples are embedded as base64 - no external files to manage
- Audio timing is carefully scheduled to avoid overlap/clipping
- Volume levels are conservative (0.15-0.24 gain) to prevent distortion