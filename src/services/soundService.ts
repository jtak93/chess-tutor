class SoundService {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (err) {
        console.warn('AudioContext not supported or blocked:', err);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended' && !this.isUnlocked) {
      this.audioCtx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {
        // Ignored until next user gesture
      });
    }

    return this.audioCtx;
  }

  public play(type: 'move' | 'capture' | 'correct' | 'wrong', enabled: boolean = true) {
    if (!enabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx || ctx.state === 'closed') return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(196, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'capture') {
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else {
        // Move sound
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }

      // Cleanup nodes after playing
      setTimeout(() => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignore
        }
      }, 500);
    } catch {
      // Audio errors safely ignored
    }
  }
}

export const soundService = new SoundService();
