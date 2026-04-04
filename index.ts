/**
 * Plugin Entry Point
 *
 * This is the main file of your plugin. It exports a class that implements
 * the GeneratorPlugin interface from the SDK. The host discovers this file
 * via the "main" field in plugin.json.
 *
 * Lifecycle:
 *   1. Host discovers plugin.json in the plugins directory
 *   2. Host loads this file and finds the default export
 *   3. Host calls activate(host) — you receive the PluginHost API
 *   4. Host calls getUIComponent() — you return your React panel
 *   5. On shutdown/disable, host calls deactivate()
 *
 * Docs: https://signalsandsorcery.com/plugin-sdk/getting-started.html
 * API:  https://signalsandsorcery.com/plugin-sdk/api-reference.html
 */

import type { ComponentType } from 'react';
import type {
  GeneratorPlugin,
  PluginHost,
  PluginUIProps,
  PluginSettingsSchema,
  MusicalContext,
} from '@signalsandsorcery/plugin-sdk';
import { HelloWorldPanel } from './HelloWorldPanel';

/**
 * HelloWorldPlugin — A minimal plugin template.
 *
 * Change the id, displayName, and description to match your plugin.
 * The id MUST match the "id" field in plugin.json.
 *
 * generatorType determines what kind of content your plugin creates:
 *   - 'midi'   → Creates MIDI patterns (synths, drums, melodies)
 *   - 'audio'  → Creates audio files (textures, samples)
 *   - 'sample' → Manages audio samples from a library
 *   - 'hybrid' → Combines multiple types
 */
export class HelloWorldPlugin implements GeneratorPlugin {
  readonly id = '@my-org/hello-world';
  readonly displayName = 'Hello World';
  readonly version = '1.0.0';
  readonly description = 'A starter template for building S&S plugins';
  readonly generatorType = 'midi' as const;

  // Store the host reference so your UI component can access it
  private host: PluginHost | null = null;

  /**
   * Called once when the plugin is loaded.
   * Use this to initialize state, register event listeners, etc.
   * The host object is your entire API surface — tracks, MIDI, audio, LLM, and more.
   */
  async activate(host: PluginHost): Promise<void> {
    this.host = host;
    console.log('[HelloWorld] Plugin activated!');

    // Example: Log the current musical context
    // const ctx = await host.getMusicalContext();
    // console.log(`[HelloWorld] Key: ${ctx.key} ${ctx.mode}, BPM: ${ctx.bpm}`);
  }

  /**
   * Called when the plugin is disabled or the app shuts down.
   * Clean up event listeners, timers, etc. Must complete within 5 seconds.
   */
  async deactivate(): Promise<void> {
    this.host = null;
    console.log('[HelloWorld] Plugin deactivated');
  }

  /**
   * Return the React component that renders in the accordion panel.
   * The component receives PluginUIProps: { host, activeSceneId, isAuthenticated, isConnected, ... }
   */
  getUIComponent(): ComponentType<PluginUIProps> {
    return HelloWorldPanel;
  }

  /**
   * Return a JSON Schema for plugin settings, or null for no settings.
   * If provided, the host auto-renders a settings form in the plugin manager.
   */
  getSettingsSchema(): PluginSettingsSchema | null {
    return null;
  }

  /**
   * Optional: Called when the user switches to a different scene.
   * Use this to reload scene-specific state or clear caches.
   */
  async onSceneChanged(_sceneId: string | null): Promise<void> {
    // Example: reload your plugin's tracks for the new scene
    // const tracks = await this.host?.getPluginTracks();
  }

  /**
   * Optional: Called when the musical context changes
   * (chords updated, tracks added/removed, BPM changed).
   */
  onContextChanged(_context: MusicalContext): void {
    // Example: re-generate content when chords change
    // console.log(`[HelloWorld] Context changed: ${context.key} ${context.mode}`);
  }
}

// Default export — the host looks for this
export default HelloWorldPlugin;
