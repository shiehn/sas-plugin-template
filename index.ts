/**
 * Plugin entry point — @my-org/hello-world
 *
 * A minimal, working starter for Signals & Sorcery plugins. Rename the ids
 * and metadata below, build your UI in HelloWorldPanel.tsx, run `npm run
 * build`, and drop the folder into the app's plugins directory (see README).
 *
 * Lifecycle:
 *   1. The host reads plugin.json and loads the file named by "main".
 *   2. It imports the default export (this class) and constructs it.
 *   3. activate(host) runs once — `host` is your entire API surface.
 *   4. getUIComponent() returns the React panel shown in the accordion.
 *   5. deactivate() runs on disable/shutdown (finish within ~5s).
 *
 * The metadata fields here mirror plugin.json — keep id, displayName,
 * version, and generatorType in sync across both files.
 *
 * Docs: https://signalsandsorcery.com/plugin-sdk/
 */

import type { ComponentType } from 'react';
import type {
  GeneratorPlugin,
  GeneratorType,
  PluginHost,
  PluginUIProps,
  PluginSettingsSchema,
  MusicalContext,
} from '@signalsandsorcery/plugin-sdk';
import { HelloWorldPanel } from './HelloWorldPanel';

export class HelloWorldPlugin implements GeneratorPlugin {
  readonly id = '@my-org/hello-world';
  readonly displayName = 'Hello World';
  readonly version = '1.0.0';
  readonly description = 'A starter template for building Signals & Sorcery plugins';

  /** What this plugin produces: 'midi' | 'audio' | 'sample' | 'hybrid'. */
  readonly generatorType: GeneratorType = 'midi';

  private host: PluginHost | null = null;

  /** Runs once when the plugin loads. `host` is the whole API surface. */
  async activate(host: PluginHost): Promise<void> {
    this.host = host;
    console.log('[HelloWorld] activated');
  }

  /** Runs on disable/shutdown. Clean up listeners and timers here. */
  async deactivate(): Promise<void> {
    this.host = null;
    console.log('[HelloWorld] deactivated');
  }

  /** The React component rendered inside the accordion panel. */
  getUIComponent(): ComponentType<PluginUIProps> {
    return HelloWorldPanel;
  }

  /** A JSON Schema for a settings form, or null for no settings. */
  getSettingsSchema(): PluginSettingsSchema | null {
    return null;
  }

  // ── Optional lifecycle hooks (delete if unused) ───────────────────

  /** Called when the user switches scenes. */
  async onSceneChanged(_sceneId: string | null): Promise<void> {
    // e.g. re-sync this scene's tracks: await this.host?.adoptSceneTracks();
  }

  /** Called when the musical context changes (chords, BPM, tracks…). */
  onContextChanged(_context: MusicalContext): void {
    // e.g. regenerate when the chord progression changes.
  }

  // Advanced: implement getSkills() to expose LLM-callable actions to the
  // in-app assistant. See the chat plugin for a complete example.
}

export default HelloWorldPlugin;
