# Signals & Sorcery — Plugin Template

A minimal, **working** starter for building [Signals & Sorcery](https://signalsandsorcery.com) plugins.
Tracks the current **plugin SDK 2.x**. A plugin appears as an accordion panel in the workstation and
can create tracks, write MIDI, generate audio, call the LLM, drive the mixer/FX, and more.

This template is a MIDI generator (like the built-in **Synths** plugin): it creates synth tracks and
fills them with notes — from the LLM when you're signed in, or a demo scale when you're not.

> **Best reference = the built-in plugins.** Their source is the ground truth for the current API:
> `sas-synth-plugin` (MIDI), `sas-drum-plugin`, `sas-instrument-plugin`, `sas-loops-plugin` (samples),
> `sas-stems-plugin` / `sas-texture-plugin` (audio), `sas-recorder` (mic capture), `sas-chat-plugin`
> (LLM tool-use agent).

## Quick start

```bash
npm install        # installs @signalsandsorcery/plugin-sdk + React (peer deps) from npm
npm run typecheck  # tsc --noEmit
npm run build      # bundles to dist/ (CommonJS + ESM + .d.ts)
npm run dev        # watch mode — rebuild on save
```

> **Developing inside this monorepo?** The pinned SDK version may not be on npm yet. Build the local
> SDK once — `(cd ../sas-plugin-sdk && npm install && npm run build)` — and point the
> `@signalsandsorcery/plugin-sdk` dev dependency at `file:../sas-plugin-sdk`.

## Install into the app

The host discovers external plugins in `plugins/` inside its user-data folder, and loads each one's
`dist/index.js` (the file named by `"main"` in `plugin.json`):

| OS | Plugins folder |
|----|----------------|
| macOS | `~/Library/Application Support/Signals & Sorcery/plugins/` |
| Windows | `%APPDATA%\Signals & Sorcery\plugins\` |
| Linux | `~/.config/Signals & Sorcery/plugins/` |

During development, symlink this folder in (macOS shown):

```bash
ln -s "$PWD" "$HOME/Library/Application Support/Signals & Sorcery/plugins/hello-world"
```

Then restart Signals & Sorcery — your panel appears in the workstation. A plugin that fails to load is
logged and skipped; it never crashes the app. (Settings → **Manage Plugins** opens this folder.)

## Files

| File | Purpose |
|------|---------|
| `plugin.json` | Manifest — validated on load (`id`, `displayName`, `version`, `main`, `generatorType`, `capabilities`) |
| `index.ts` | Plugin class — lifecycle + metadata (implements `GeneratorPlugin`) |
| `HelloWorldPanel.tsx` | React UI rendered in the accordion (uses the SDK's `<TrackRow>`) |
| `icon.svg` | 24×24 panel icon (referenced by `plugin.json`) |
| `tsup.config.ts` | Build config — externalizes react + SDK (never bundle them) |
| `tsconfig.json` | TypeScript config |

Keep `plugin.json` and `index.ts` in sync: the manifest's `id` / `displayName` / `version` /
`generatorType` match the class's `id` / `displayName` / `version` / `generatorType`.

## Manifest reference (`plugin.json`)

```json
{
  "id": "@my-org/hello-world",        // required — npm-style scoped id
  "displayName": "Hello World",       // required
  "version": "1.0.0",                 // required — semver
  "description": "…",                 // required
  "generatorType": "midi",            // required — midi | audio | sample | hybrid
  "main": "dist/index.js",            // required — built CommonJS entry
  "author": "Your Name",              // optional
  "icon": "icon.svg",                 // optional — 24×24 svg/png in the plugin dir
  "minHostVersion": "2.0.0",          // optional — minimum host/SDK version
  "builtIn": false,                   // optional — true only for shipped plugins
  "capabilities": { "requiresLLM": true, "requiresSurgeXT": true }
}
```

### Capabilities

Declare what your plugin uses. `requiresLLM`/`requiresSurgeXT` gate features (a missing one means the
related host call won't be available); the rest unlock host APIs.

| Flag | Enables |
|------|---------|
| `requiresLLM` | `host.generateWithLLM()` / `generateWithLLMTools()` (user must be signed in) |
| `requiresSurgeXT` | `createTrack({ loadSynth: true })` + `shufflePreset()` |
| `fileDialog` | native open/save dialogs |
| `audioCapture` | mic/line recording (`startTrackRecording`, …) |
| `network` | `{ "allowedHosts": ["api.example.com"] }` for outbound requests |

## Generator types

| `generatorType` | Produces | Examples |
|-----------------|----------|----------|
| `midi` | MIDI on synth/sampler tracks | melodies, drums, instruments |
| `audio` | audio files on tracks | textures, stems, recordings |
| `sample` | tracks from a sample library | loop browsers |
| `hybrid` | a mix of the above | full arrangers, chat assistant |

## The host API (highlights)

The `host` passed to `activate()` (and to the panel via props) is the whole API surface. Some of the
most-used calls — see the `@signalsandsorcery/plugin-sdk` type definitions for the complete list:

| Area | Methods |
|------|---------|
| Tracks | `createTrack` · `getPluginTracks` · `deleteTrack` · `duplicateTrack` · `getValidRoles` |
| Track state | `getTrackRuntimeState` · `getTrackFxDetailState` · `getTrackMidiInfo` |
| Mixer / FX | `setTrackVolume` · `setTrackPan` · `setTrackMute` · `setTrackSolo` · `shufflePreset` · `toggleTrackFx` |
| MIDI | `writeMidiClip` · `postProcessMidi` (quantize / swing / humanize / scale) |
| AI | `generateWithLLM` · `generateWithLLMTools` (tool-calling agent loop) |
| Context | `getMusicalContext` · `getValidRoles` |
| Storage | `setSceneData` / `getSceneData` · `setProjectData` / `getProjectData` |
| UI | `showToast` · `setProgress` · `confirmAction` |

## SDK UI components & hooks

Import host-styled UI from the SDK instead of rolling your own:

```ts
import {
  TrackRow,            // full track row: prompt, generate, mixer, FX, instrument picker
  VolumeSlider, PanSlider, FxToggleBar, InstrumentDrawer,
  SorceryProgressBar,  // paced progress bar for long operations
  WaveformView, LevelMeter, ScrollingWaveform, OffsetScrubber,  // audio UI
  DownloadPackButton, SamplePackCTACard,                        // sample packs
  useSceneState,       // React state keyed to the active scene
} from '@signalsandsorcery/plugin-sdk';
```

## Customize

1. Rename `id` / `displayName` in `plugin.json` **and** the matching fields in `index.ts`.
2. Build your UI in `HelloWorldPanel.tsx` (or replace `<TrackRow>` with your own controls).
3. Trim `capabilities` to what you actually use.
4. Rename the `HelloWorld*` files and classes to your plugin's name.

## License

MIT
