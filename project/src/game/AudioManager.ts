export class AudioManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.7;
  private started = false;

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  resume(): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  startEngine(): void {
    this.ensure();
    if (!this.ctx || this.started) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    this.engineOsc = osc;
    this.engineGain = gain;
    this.started = true;
  }

  setEngine(speedRatio: number, accelerating: boolean): void {
    if (!this.engineOsc || !this.engineGain || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const baseFreq = 55 + speedRatio * 240;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.08);
    const target = accelerating ? 0.18 + speedRatio * 0.12 : 0.05 + speedRatio * 0.06;
    this.engineGain.gain.setTargetAtTime(target, t, 0.1);
  }

  stopEngine(): void {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
      } catch {
        /* already stopped */
      }
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
    this.started = false;
  }

  playCrash(intensity: number): void {
    this.ensure();
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dur = 0.35;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.value = Math.min(0.6, 0.2 + intensity * 0.4);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    src.onended = () => {
      filter.disconnect();
      gain.disconnect();
    };
  }

  playBeep(freq = 440, dur = 0.12, vol = 0.25): void {
    this.ensure();
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
    osc.onended = () => gain.disconnect();
  }

  private ensure(): void {
    if (this.ctx) return;
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }
}
