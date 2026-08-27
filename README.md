# Musician Gym

**Functional ear training focused on scale degrees and tonal context.**

Musician Gym helps you recognize scale degrees by their function within a key. Instead of abstract interval training, you learn to hear notes in harmonic context using major and minor cadences.

## Key Features

**🎧 Auto Mode** - Passive training with automatic cadence playback. Practice while commuting or doing other activities.

**🎮 Remote Control Support** - Use Bluetooth gamepads, cheap USB camera shutters (~$2), or any HID device. Practice hands-free from across the room.

**🎼 Functional Training** - Learn scale degrees in tonal context rather than isolated intervals.

**🎹 36 Tonalities & 3 Registers** - Practice every major, natural-minor, and harmonic-minor key in low, middle, or high registers.

**🌙 Dark Theme** - Easy on the eyes for practice in bed or low-light environments.

**⌨️ Custom Key Mapping** - Map scale degrees to any keyboard keys or Bluetooth device buttons for personalized practice.

**📲 Installable & Offline** - Install it as a PWA and keep practicing after the first successful online load.

**📊 Persistent Progress** - Attempts, correct answers, and accuracy remain available between sessions.

## Getting Started

1. **[Open Musician Gym](https://musician-gym.vercel.app/)**
2. Click "Start" to hear a cadence + target note  
3. Identify the scale degree on the piano
4. Track your progress over time

### Custom Controls

**Keyboard Mapping**: Assign scale degrees to any keys (default: home row A-S-D-F-G-H-J-K)

**Bluetooth Controllers**: 
- Piano controllers or keyboards (any HID device)
- Gaming controllers (Xbox, PlayStation, etc.)
- Cheap camera shutters (~$2) <img src="ble-controller.png" alt="Camera Shutter" width="60">
- Any HID-compatible device

Configure in Settings > Key Mapping. Click "Set key" next to any note, then press your desired key or controller button.

### Auto Mode

Enable in settings for passive practice:
- Adjustable intervals
- Optional audio feedback
- Screen wake lock on supported mobile browsers
- Perfect for background learning

## Training range

Choose any of 36 tonalities—12 major, 12 natural minor, and 12 harmonic minor—and one of three registers. Solfege stays relative to the selected tonic (Do is always degree 1), while letter notation shows the sounding pitch.

- Major uses an I-IV-V-I cadence.
- Natural minor uses i-iv-v-i and includes the lowered seventh.
- Harmonic minor uses i-iv-V-i and includes the raised seventh.

## Exercises

- **Exercise 1**: Do-Fa - lower tetrachord
- **Exercise 2**: Sol-Do - upper tetrachord
- **Exercise 3**: Full octave Do-Do

## Technical Details

- Built with React + Vite
- Audio engine: Tone.js with piano samples
- Works offline, no data collection
- Mobile optimized

## Development

```bash
git clone https://github.com/MartinAlcalde/musician-gym
cd musician-gym
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm test
npm run build
```

The production workflow runs all three checks before publishing GitHub Pages.

## License

MIT License - see [LICENSE](LICENSE) file for details.
