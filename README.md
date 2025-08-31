# Musician Gym

**Functional ear training focused on scale degrees and tonal context.**

Musician Gym helps you recognize scale degrees by their function within a key. Instead of abstract interval training, you learn to hear notes in harmonic context using I-IV-V-I cadences.

## Key Features

**🎧 Auto Mode** - Passive training with automatic cadence playback. Practice while commuting or doing other activities.

**🎮 Remote Control Support** - Use Bluetooth gamepads, cheap USB camera shutters (~$2), or any HID device. Practice hands-free from across the room.

**🎼 Functional Training** - Learn scale degrees in tonal context rather than isolated intervals.

**🌙 Dark Theme** - Easy on the eyes for practice in bed or low-light environments.

**⌨️ Custom Key Mapping** - Map scale degrees to any keyboard keys or Bluetooth device buttons for personalized practice.

## Getting Started

1. **[Open Musician Gym](https://martinalcalde.github.io/musician-gym/)**
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
- Perfect for background learning

## Exercises

- **Exercise 1**: C-F (Do-Fa) - lower tetrachord
- **Exercise 2**: G-C (Sol-Do) - upper tetrachord  
- **Exercise 3**: Full octave C-C

## Technical Details

- Built with React + Vite
- Audio engine: Tone.js with piano samples
- Works offline, no data collection
- Mobile optimized

## Development

```bash
git clone https://github.com/MartinAlcalde/musician-gym
cd musician-gym
npm install
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.