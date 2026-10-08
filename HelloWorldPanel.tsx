/**
 * HelloWorldPanel — the plugin's React UI, rendered inside an accordion
 * section of the Signals & Sorcery workstation.
 *
 * It receives PluginUIProps from the host. The props this template uses:
 *   host            The PluginHost API — tracks, MIDI, LLM, mixer, FX, …
 *   activeSceneId   Current scene id, or null if none is selected
 *   isAuthenticated Whether the user is signed in (the LLM needs this)
 *   isConnected     Whether the audio engine is connected
 *
 * The flow mirrors the built-in plugins (synth/drum/instrument):
 *   1. Load the plugin's tracks for the active scene (getPluginTracks)
 *   2. Create new synth tracks (createTrack)
 *   3. Generate MIDI per track — via the LLM when signed in, or a
 *      deterministic fallback so the template still works offline
 *   4. Render each track with the shared <TrackRow> component (prompt box,
 *      generate/shuffle, mixer, FX, instrument picker — all wired below)
 *
 * Full API reference: https://signalsandsorcery.com/plugin-sdk/
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PluginUIProps,
  PluginTrackHandle,
  PluginMidiNote,
  MusicalContext,
  ShufflePresetResult,
} from '@signalsandsorcery/plugin-sdk';
import {
  TrackRow,
  useSceneState,
} from '@signalsandsorcery/plugin-sdk';

// ---------------------------------------------------------------------------
// Local per-track view state
// ---------------------------------------------------------------------------

/** The mixer state <TrackRow> renders for each track. */
type TrackMixerState = { muted: boolean; solo: boolean; volume: number; pan: number };

interface TrackEntry {
  handle: PluginTrackHandle;
  runtimeState: TrackMixerState; // muted / solo / volume / pan
  prompt: string;
  hasMidi: boolean;
  isGenerating: boolean;
  error: string | null;
  drawerOpen: boolean; // the row drawer (instrument picker, FX, history…)
  generationProgress: number;
}

const DEFAULT_RUNTIME: TrackMixerState = {
  muted: false,
  solo: false,
  volume: 0.8,
  pan: 0,
};

/** A C-major scale, used by the offline (no-LLM) fallback generator. */
const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HelloWorldPanel({
  host,
  activeSceneId,
  isAuthenticated,
  isConnected,
}: PluginUIProps): React.ReactElement {
  const [tracks, setTracks] = useState<TrackEntry[]>([]);

  // useSceneState keeps a value *per scene* — prompts survive scene switches.
  const [prompts, setPrompts] = useSceneState<Record<string, string>>(activeSceneId, {});
  const promptsRef = useRef(prompts);
  promptsRef.current = prompts;

  // -------------------------------------------------------------------------
  // Load this plugin's tracks for the active scene
  // -------------------------------------------------------------------------

  const loadTracks = useCallback(async (): Promise<void> => {
    if (!isConnected) return;
    try {
      // getPluginTracks() returns the tracks this plugin owns. Ownership is
      // enforced — you can only mutate tracks your plugin created.
      const handles = await host.getPluginTracks();

      const loaded: TrackEntry[] = await Promise.all(
        handles.map(async (handle): Promise<TrackEntry> => {
          // getTrackInfo() reports a track's live mixer state + whether it
          // already has MIDI. Wrap it — a track may not be ready right after
          // creation, in which case we fall back to sensible defaults.
          let runtimeState = DEFAULT_RUNTIME;
          let hasMidi = false;
          try {
            const info = await host.getTrackInfo(handle.id);
            runtimeState = {
              muted: info.muted,
              solo: info.soloed,
              volume: info.volume,
              pan: info.pan,
            };
            hasMidi = info.hasMidi;
          } catch {
            // Track not ready yet — keep defaults.
          }
          return {
            handle,
            runtimeState,
            prompt: promptsRef.current[handle.id] ?? handle.prompt ?? '',
            hasMidi,
            isGenerating: false,
            error: null,
            drawerOpen: false,
            generationProgress: 0,
          };
        }),
      );
      setTracks(loaded);
    } catch (err) {
      console.error('[HelloWorld] Failed to load tracks:', err);
    }
  }, [host, isConnected]);

  // Reload whenever the scene changes.
  useEffect(() => {
    void loadTracks();
  }, [loadTracks, activeSceneId]);

  // -------------------------------------------------------------------------
  // Generate MIDI for one track
  // -------------------------------------------------------------------------

  const handleGenerate = useCallback(
    async (trackId: string): Promise<void> => {
      const prompt = promptsRef.current[trackId] ?? '';
      setTracks((prev) =>
        prev.map((t) =>
          t.handle.id === trackId ? { ...t, isGenerating: true, error: null } : t,
        ),
      );

      try {
        // The musical context: key, mode, BPM, bars, time signature, chords.
        const ctx: MusicalContext = await host.getMusicalContext();
        const beatsPerBar = parseInt(ctx.timeSignature.split('/')[0], 10) || 4;
        const totalBeats = ctx.bars * beatsPerBar;

        let notes: PluginMidiNote[];
        if (isAuthenticated) {
          // ── AI path ──────────────────────────────────────────────────
          // generateWithLLM auto-prefixes the scene's musical context, so you
          // can keep the prompt focused on the part you want.
          const system = [
            'You are a MIDI composer for a music app.',
            `Scene: ${ctx.key} ${ctx.mode}, ${ctx.bpm} BPM, ${ctx.bars} bars in ${ctx.timeSignature}.`,
            ctx.chordProgression.length
              ? `Chords: ${ctx.chordProgression.map((c) => c.symbol).join(' ')}.`
              : '',
            'Return ONLY a JSON array of notes:',
            '[{"pitch":60,"startBeat":0,"durationBeats":1,"velocity":90}]',
            'pitch 0-127, startBeat/durationBeats in quarter notes, velocity 1-127.',
          ]
            .filter(Boolean)
            .join(' ');

          const result = await host.generateWithLLM({
            system,
            user: prompt || 'Compose a short phrase that fits the scene.',
            responseFormat: 'json',
          });

          const parsed: unknown = JSON.parse(result.content);
          notes = Array.isArray(parsed)
            ? (parsed as PluginMidiNote[])
            : (parsed as { notes: PluginMidiNote[] }).notes;
        } else {
          // ── Offline fallback ─────────────────────────────────────────
          // No sign-in required — write an ascending C-major scale so the
          // template does something out of the box. Delete this branch once
          // your LLM generation is wired up.
          notes = Array.from(
            { length: Math.min(totalBeats, C_MAJOR.length) },
            (_, i): PluginMidiNote => ({
              pitch: C_MAJOR[i],
              startBeat: i,
              durationBeats: 0.9,
              velocity: 96,
            }),
          );
        }

        // writeMidiClip replaces the track's clip. Times are in seconds;
        // tempo converts the beat-based notes for the engine.
        await host.writeMidiClip(trackId, {
          startTime: 0,
          endTime: (totalBeats * 60) / ctx.bpm,
          tempo: ctx.bpm,
          notes,
        });

        setTracks((prev) =>
          prev.map((t) =>
            t.handle.id === trackId
              ? { ...t, isGenerating: false, hasMidi: true, generationProgress: 100 }
              : t,
          ),
        );
        host.showToast('success', 'MIDI generated', `${notes.length} notes`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setTracks((prev) =>
          prev.map((t) =>
            t.handle.id === trackId ? { ...t, isGenerating: false, error: msg } : t,
          ),
        );
        host.showToast('error', 'Generation failed', msg);
      }
    },
    [host, isAuthenticated],
  );

  // -------------------------------------------------------------------------
  // Create / delete / shuffle
  // -------------------------------------------------------------------------

  const handleAddTrack = useCallback(async (): Promise<void> => {
    if (!activeSceneId) {
      host.showToast('warning', 'No scene', 'Select a scene first');
      return;
    }
    try {
      // role drives the auto-loaded Surge XT preset (loadSynth) and how the
      // host classifies the track. host.getValidRoles() lists the options.
      const handle = await host.createTrack({ name: 'Hello', role: 'lead', loadSynth: true });
      setTracks((prev) => [
        ...prev,
        {
          handle,
          runtimeState: DEFAULT_RUNTIME,
          prompt: '',
          hasMidi: false,
          isGenerating: false,
          error: null,
          drawerOpen: false,
          generationProgress: 0,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      host.showToast('error', 'Failed to add track', msg);
    }
  }, [host, activeSceneId]);

  const handleDelete = useCallback(
    async (trackId: string): Promise<void> => {
      try {
        await host.deleteTrack(trackId);
        setTracks((prev) => prev.filter((t) => t.handle.id !== trackId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        host.showToast('error', 'Failed to delete', msg);
      }
    },
    [host],
  );

  const handleShuffle = useCallback(
    async (trackId: string): Promise<void> => {
      try {
        const result: ShufflePresetResult = await host.shufflePreset(trackId);
        host.showToast('info', 'Preset shuffled', result.presetName ?? 'New preset');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        host.showToast('error', 'Shuffle failed', msg);
      }
    },
    [host],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!activeSceneId) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        Select a scene to start.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
      {!isAuthenticated && (
        <div style={{ fontSize: 11, color: '#f59e0b' }}>
          Sign in to enable AI generation — until then, “Create” writes a demo scale.
        </div>
      )}

      {/* <TrackRow> is the shared, host-styled track component the built-in
          plugins use. It needs the current runtime/FX state plus handlers for
          each control; we keep that in `tracks` above and update on callback. */}
      {tracks.map((track) => (
        <TrackRow
          key={track.handle.id}
          track={track.handle}
          prompt={track.prompt}
          runtimeState={track.runtimeState}
          drawerOpen={track.drawerOpen}
          drawerTab="pick"
          isGenerating={track.isGenerating}
          isAuthenticated={isAuthenticated}
          error={track.error}
          hasMidi={track.hasMidi}
          generationProgress={track.generationProgress}
          onPromptChange={(p: string) =>
            setPrompts((prev) => ({ ...prev, [track.handle.id]: p }))
          }
          onGenerate={() => void handleGenerate(track.handle.id)}
          onShuffle={() => void handleShuffle(track.handle.id)}
          onDelete={() => void handleDelete(track.handle.id)}
          onMuteToggle={() => void host.setTrackMute(track.handle.id, !track.runtimeState.muted)}
          onSoloToggle={() => void host.setTrackSolo(track.handle.id, !track.runtimeState.solo)}
          onVolumeChange={(v: number) => void host.setTrackVolume(track.handle.id, v)}
          onPanChange={(p: number) => void host.setTrackPan(track.handle.id, p)}
        />
      ))}

      <button
        onClick={() => void handleAddTrack()}
        disabled={!isConnected}
        style={{
          padding: 10,
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: isConnected ? 'pointer' : 'not-allowed',
          fontSize: 13,
          fontWeight: 600,
          opacity: isConnected ? 1 : 0.5,
        }}
      >
        + Add Track
      </button>

      {/* ── Going further ──────────────────────────────────────────────
          Prefer building your own UI? Skip <TrackRow> and call the host
          primitives directly:
            host.postProcessMidi(notes, { quantize: true, swing: 15 })
            host.loadTrackExternalFx?.(id, pluginId)   // a 3rd-party FX insert
            host.duplicateTrack(id)
          Persist data across restarts (not just scene switches):
            host.setSceneData(sceneId, key, value) / host.getSceneData(...)
            host.setProjectData(key, value)        / host.getProjectData(...)
          See the built-in plugins listed in the README for full examples.
      ──────────────────────────────────────────────────────────────────── */}
    </div>
  );
}
