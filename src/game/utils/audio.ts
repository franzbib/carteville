export class AudioManager {
  private context?: AudioContext;
  private masterGain?: GainNode;
  private ambienceGain?: GainNode;
  private ambienceTimer?: number;
  private muted = false;

  syncFromPreference(soundEnabled: boolean): void {
    this.muted = !soundEnabled;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.context!.currentTime);
    }
    if (!this.muted && this.context && !this.ambienceTimer) {
      this.startAmbienceLoop();
    }
  }

  unlock(): void {
    if (!this.context) {
      const AudioCtor = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!AudioCtor) {
        return;
      }

      this.context = new AudioCtor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.7;
      this.masterGain.connect(this.context.destination);

      this.ambienceGain = this.context.createGain();
      this.ambienceGain.gain.value = 0.045;
      this.ambienceGain.connect(this.masterGain);
    }

    void this.context.resume();

    if (!this.muted && !this.ambienceTimer) {
      this.startAmbienceLoop();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;

    if (!this.context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(
      this.muted ? 0 : 0.7,
      this.context.currentTime + 0.12
    );

    if (this.muted && this.ambienceTimer) {
      window.clearInterval(this.ambienceTimer);
      this.ambienceTimer = undefined;
    } else if (!this.muted && !this.ambienceTimer) {
      this.startAmbienceLoop();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  playSuccess(): void {
    this.playTone([523.25, 659.25, 784], 0.11, 'triangle', 0.09);
  }

  playError(): void {
    this.playTone([220, 196], 0.15, 'sawtooth', 0.06);
  }

  playOpen(): void {
    this.playTone([392, 523.25], 0.08, 'sine', 0.05);
  }

  private playTone(
    frequencies: number[],
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.context || this.muted || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;

    frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015 + index * 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + index * 0.02);

      oscillator.connect(gain);
      gain.connect(this.masterGain!);
      oscillator.start(now + index * 0.01);
      oscillator.stop(now + duration + index * 0.03);
    });
  }

  private startAmbienceLoop(): void {
    if (!this.context || !this.ambienceGain || this.muted) {
      return;
    }

    const pulse = () => {
      if (!this.context || !this.ambienceGain || this.muted) {
        return;
      }

      const now = this.context.currentTime;
      const notes = [261.63, 329.63, 392];

      notes.forEach((frequency, index) => {
        const oscillator = this.context!.createOscillator();
        const gain = this.context!.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.018, now + 0.4 + index * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + index * 0.08);

        oscillator.connect(gain);
        gain.connect(this.ambienceGain!);
        oscillator.start(now + index * 0.06);
        oscillator.stop(now + 2.8 + index * 0.08);
      });
    };

    pulse();
    this.ambienceTimer = window.setInterval(pulse, 14000);
  }
}

export const audioManager = new AudioManager();
