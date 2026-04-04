# Signals & Sorcery Plugin Template

A starter template for building plugins for [Signals & Sorcery](https://signalsandsorcery.com) — an AI-powered music production workstation.

Use this template to create your own generator plugin that appears as a panel in the Loop Workstation. Plugins can create tracks, write MIDI, generate audio, use AI, and more.

## Quick Start

### 1. Clone this template

```bash
# Clone into the S&S plugins directory
cd ~/.signals-and-sorcery/plugins/
git clone https://github.com/shiehn/sas-plugin-template.git @my-org/hello-world
cd @my-org/hello-world
```

### 2. Install and build

```bash
npm install
npm run build
```

### 3. Restart Signals & Sorcery

The plugin appears as a new accordion panel in the workstation.

### 4. Develop

Edit the source files, rebuild, and restart to see changes:

```bash
npm run dev    # Watch mode — rebuilds on save
```

## Project Structure

```
plugin.json              # Plugin manifest (id, name, capabilities)
index.ts                 # Plugin class (lifecycle, metadata)
HelloWorldPanel.tsx      # React UI component (your plugin's interface)
package.json             # Dependencies and build scripts
tsup.config.ts           # Build configuration
tsconfig.json            # TypeScript configuration
```

## Customize

1. **Update `plugin.json`** — Change `id`, `displayName`, `description`, and `capabilities`
2. **Update `index.ts`** — Match the `id` and metadata, add lifecycle logic
3. **Edit `HelloWorldPanel.tsx`** — Build your UI using the PluginHost API
4. **Rename files** — Replace "HelloWorld" with your plugin name

## What Can a Plugin Do?

The `host` object in your UI component gives you access to everything:

| Category | Examples |
|----------|---------|
| **Tracks** | `createTrack()`, `deleteTrack()`, `setTrackMute()`, `setTrackVolume()` |
| **MIDI** | `writeMidiClip()`, `clearMidi()`, `postProcessMidi()` |
| **Audio** | `writeAudioClip()`, `generateAudioTexture()` |
| **Synths** | `loadSynthPlugin()`, `shufflePreset()`, `getAvailableInstruments()` |
| **FX** | `toggleTrackFx()`, `setTrackFxPreset()`, `setTrackFxDryWet()` |
| **AI/LLM** | `generateWithLLM()`, `isLLMAvailable()` |
| **Context** | `getMusicalContext()`, `getSceneList()`, `getTransportState()` |
| **UI** | `showToast()`, `setProgress()`, `confirmAction()` |
| **Storage** | `settings.get/set()`, `getSceneData()`, `storeSecret()` |

See the [API Reference](https://signalsandsorcery.com/plugin-sdk/api-reference.html) for the complete list.

## Capabilities

Declare what your plugin needs in `plugin.json`:

```json
{
  "capabilities": {
    "requiresLLM": true,        // AI text generation (needs user auth)
    "requiresSurgeXT": true,    // Synth preset loading
    "fileDialog": true,         // Native open/save file dialogs
    "network": {                // HTTP requests (allowlist required)
      "allowedHosts": ["api.example.com"]
    }
  }
}
```

Undeclared capabilities will throw `CAPABILITY_DENIED` at runtime.

## Generator Types

| Type | What it creates | Example |
|------|----------------|---------|
| `midi` | MIDI patterns via synth tracks | Melody generators, drum sequencers |
| `audio` | Audio files on tracks | AI texture generators, samplers |
| `sample` | Manages samples from a library | Sample browsers, beat slicers |
| `hybrid` | Combines multiple types | Full arrangement generators |

## SDK Components

The SDK provides pre-built UI components that match the host app's style:

```typescript
import {
  TrackRow,              // Full-featured track row with all controls
  VolumeSlider,          // Horizontal volume slider with dB tooltip
  PanSlider,             // Horizontal pan slider (-1 to +1)
  FxToggleBar,           // 6-category FX control panel
  SorceryProgressBar,    // Animated progress bar for long operations
  InstrumentDrawer,      // VST3/AU instrument browser
  useSceneState,         // State that persists across scene switches
} from '@signalsandsorcery/plugin-sdk';
```

## Ecosystem

| Resource | Link |
|----------|------|
| Plugin SDK (npm) | [@signalsandsorcery/plugin-sdk](https://www.npmjs.com/package/@signalsandsorcery/plugin-sdk) |
| SDK Source | [github.com/shiehn/sas-plugin-sdk](https://github.com/shiehn/sas-plugin-sdk) |
| Documentation | [signalsandsorcery.com/plugin-sdk](https://signalsandsorcery.com/plugin-sdk/) |
| Getting Started | [signalsandsorcery.com/plugin-sdk/getting-started](https://signalsandsorcery.com/plugin-sdk/getting-started.html) |
| API Reference | [signalsandsorcery.com/plugin-sdk/api-reference](https://signalsandsorcery.com/plugin-sdk/api-reference.html) |
| Tutorial | [signalsandsorcery.com/plugin-sdk/tutorial](https://signalsandsorcery.com/plugin-sdk/tutorial.html) |
| Synth Plugin (reference) | [github.com/shiehn/sas-synth-plugin](https://github.com/shiehn/sas-synth-plugin) |
| Sample Plugin (reference) | [github.com/shiehn/sas-sample-plugin](https://github.com/shiehn/sas-sample-plugin) |
| Audio Plugin (reference) | [github.com/shiehn/sas-audio-plugin](https://github.com/shiehn/sas-audio-plugin) |

## License

MIT
