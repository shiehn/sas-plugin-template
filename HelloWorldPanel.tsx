/**
 * HelloWorldPanel — The plugin's React UI component.
 *
 * This component renders inside an accordion section in the Loop Workstation.
 * It receives PluginUIProps from the host, including:
 *   - host:            The PluginHost API (tracks, MIDI, audio, LLM, etc.)
 *   - activeSceneId:   Current scene ID (null if none selected)
 *   - isAuthenticated: Whether the user is logged in (needed for LLM)
 *   - isConnected:     Whether the audio engine is connected
 *   - sceneContext:    Current scene info (chords, BPM, bars, etc.)
 *
 * This template demonstrates the most common plugin operations.
 * Uncomment sections to try them out!
 *
 * Full API reference: https://signalsandsorcery.com/plugin-sdk/api-reference.html
 */

import React, { useState, useCallback } from 'react';
import type {
  PluginUIProps,
  PluginTrackHandle,
} from '@signalsandsorcery/plugin-sdk';

// ---------------------------------------------------------------------------
// Types for your plugin's internal state
// ---------------------------------------------------------------------------

interface TrackState {
  handle: PluginTrackHandle;
  prompt: string;
}

// ---------------------------------------------------------------------------
// HelloWorldPanel Component
// ---------------------------------------------------------------------------

export function HelloWorldPanel({
  host,
  activeSceneId,
  isAuthenticated,
  isConnected,
}: PluginUIProps): React.ReactElement {

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [tracks, setTracks] = useState<TrackState[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Create a Track
  //
  // host.createTrack() creates a new track in the audio engine and registers
  // it as owned by this plugin. Only tracks you create can be modified.
  //
  // Options:
  //   name:      Display name for the track
  //   role:      Instrument role (bass, lead, pad, kick, snare, hihat, etc.)
  //   loadSynth: Auto-load Surge XT synth (requires requiresSurgeXT capability)
  //
  // Returns: PluginTrackHandle { id, dbId, name }
  // -------------------------------------------------------------------------

  const handleCreateTrack = useCallback(async (): Promise<void> => {
    if (!activeSceneId) {
      host.showToast('warning', 'No Scene', 'Select a scene first');
      return;
    }

    try {
      setLoading(true);

      const handle = await host.createTrack({
        name: `Track ${tracks.length + 1}`,
        role: 'lead',       // See VALID_INSTRUMENT_ROLES for all options
        loadSynth: true,    // Auto-load Surge XT with a preset matching the role
      });

      setTracks(prev => [...prev, { handle, prompt: '' }]);
      host.showToast('success', 'Track Created', handle.name);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      host.showToast('error', 'Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [host, activeSceneId, tracks.length]);

  // -------------------------------------------------------------------------
  // Write MIDI to a Track
  //
  // host.writeMidiClip() writes MIDI notes to a track. Each note has:
  //   pitch:         MIDI note number (60 = middle C)
  //   startBeat:     Start position in quarter-note beats
  //   durationBeats: Length in quarter-note beats
  //   velocity:      Volume (1-127)
  //
  // The clip also needs timing info:
  //   startTime:  Start position in seconds
  //   endTime:    End position in seconds
  //   tempo:      BPM (used to convert beats to seconds)
  // -------------------------------------------------------------------------

  const handleGenerateMidi = useCallback(async (trackId: string): Promise<void> => {
    try {
      setLoading(true);

      // Get the current musical context (key, BPM, chords, bars)
      const ctx = await host.getMusicalContext();
      const beatsPerBar = 4; // Assuming 4/4 time
      const totalBeats = ctx.bars * beatsPerBar;
      const clipDuration = (totalBeats * 60) / ctx.bpm;

      // Example: Generate a simple ascending scale
      const notes = [];
      const scaleNotes = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale

      for (let i = 0; i < totalBeats && i < scaleNotes.length; i++) {
        notes.push({
          pitch: scaleNotes[i],
          startBeat: i,
          durationBeats: 0.9,  // Slightly shorter than 1 beat for a staccato feel
          velocity: 90 + Math.floor(Math.random() * 20), // 90-110 velocity
        });
      }

      await host.writeMidiClip(trackId, {
        startTime: 0,
        endTime: clipDuration,
        tempo: ctx.bpm,
        notes,
      });

      host.showToast('success', 'MIDI Written', `${notes.length} notes`);

      // -----------------------------------------------------------------------
      // TIP: Use host.generateWithLLM() for AI-powered MIDI generation!
      //
      // const llmResult = await host.generateWithLLM({
      //   system: 'You are a MIDI composer. Return JSON array of notes.',
      //   user: `Generate a ${ctx.key} ${ctx.mode} melody at ${ctx.bpm} BPM`,
      // });
      // const aiNotes = JSON.parse(llmResult.content);
      // -----------------------------------------------------------------------

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      host.showToast('error', 'Generation Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [host]);

  // -------------------------------------------------------------------------
  // Delete a Track
  //
  // host.deleteTrack() removes a track you own from the engine.
  // You can only delete tracks your plugin created (ownership enforced).
  // -------------------------------------------------------------------------

  const handleDeleteTrack = useCallback(async (trackId: string): Promise<void> => {
    try {
      await host.deleteTrack(trackId);
      setTracks(prev => prev.filter(t => t.handle.id !== trackId));
      host.showToast('info', 'Track Deleted');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      host.showToast('error', 'Delete Failed', msg);
    }
  }, [host]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header with Add Track button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          {tracks.length} track{tracks.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={handleCreateTrack}
          disabled={loading || !isConnected || !activeSceneId}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !isConnected || !activeSceneId ? 0.5 : 1,
          }}
        >
          {loading ? 'Working...' : '+ Add Track'}
        </button>
      </div>

      {/* No scene selected message */}
      {!activeSceneId && (
        <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          Select a scene to get started
        </div>
      )}

      {/* Track list */}
      {tracks.map((track) => (
        <div
          key={track.handle.id}
          style={{
            padding: '10px',
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            border: '1px solid #374151',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>
              {track.handle.name}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleGenerateMidi(track.handle.id)}
                disabled={loading}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Generate
              </button>
              <button
                onClick={() => handleDeleteTrack(track.handle.id)}
                disabled={loading}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------
            MORE IDEAS — Uncomment to explore:

            // Mute/Solo controls:
            // <button onClick={() => host.setTrackMute(track.handle.id, true)}>Mute</button>
            // <button onClick={() => host.setTrackSolo(track.handle.id, true)}>Solo</button>

            // Volume/Pan:
            // import { VolumeSlider, PanSlider } from '@signalsandsorcery/plugin-sdk';
            // <VolumeSlider value={0.75} onChange={(v) => host.setTrackVolume(track.handle.id, v)} />
            // <PanSlider value={0} onChange={(v) => host.setTrackPan(track.handle.id, v)} />

            // FX controls:
            // import { FxToggleBar } from '@signalsandsorcery/plugin-sdk';
            // <FxToggleBar trackId={track.handle.id} host={host} fxState={...} />

            // Shuffle preset (randomize the synth sound):
            // <button onClick={() => host.shufflePreset(track.handle.id)}>Shuffle</button>

            // Use the full-featured TrackRow component:
            // import { TrackRow } from '@signalsandsorcery/plugin-sdk';
            // <TrackRow track={track} host={host} ... />

            // Scene-persistent state (survives scene switches):
            // import { useSceneState } from '@signalsandsorcery/plugin-sdk';
            // const [prompts, setPrompts] = useSceneState(activeSceneId, {});

            --------------------------------------------------------------- */}
        </div>
      ))}

      {/* Empty state */}
      {activeSceneId && tracks.length === 0 && (
        <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          Click &quot;+ Add Track&quot; to create your first track
        </div>
      )}
    </div>
  );
}
