// ASMR Audio Synthesizer using Web Audio API (Wind Chime Effect)

class ASMRSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private lastChimeTime = 0;
  
  // 五声音阶（Pentatonic scale），非常适合风铃，怎么敲都很和谐
  private chimeFrequencies = [
    523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00 // C6, D6, E6, G6, A6
  ];

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public startDrawing() {
    this.init();
    this.isPlaying = true;
  }

  // 触发一次风铃敲击
  private playChime(volume: number, freq: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // 正弦波最接近纯净的铃声
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    // 声音包络（Envelope）：极快的起音（Attack），悠长的衰减（Decay）
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02); // 敲击瞬间
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3); // 悠长的尾音
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 3);
  }

  public updateDrawing(speed: number, yRatio: number) {
    if (!this.isPlaying || !this.ctx) return;

    const now = this.ctx.currentTime;
    
    // 根据移动速度随机触发风铃声，限制触发频率防止声音重叠太吵（最小间隔 0.15 秒）
    if (speed > 1.5 && now - this.lastChimeTime > 0.15) {
      // 速度越快，触发风铃的概率越高
      if (Math.random() < Math.min(speed * 0.08, 0.6)) {
         // 根据手在屏幕的垂直位置，决定音调的基础区间（越靠上音调越高）
         const baseIndex = Math.floor((1 - yRatio) * (this.chimeFrequencies.length - 1));
         // 增加一点随机偏移，让声音更自然
         const randOffset = Math.floor(Math.random() * 3) - 1; 
         const freqIndex = Math.max(0, Math.min(this.chimeFrequencies.length - 1, baseIndex + randOffset));
         
         const freq = this.chimeFrequencies[freqIndex];
         // 音量控制：非常轻柔，最高不超过 0.1
         const volume = Math.min(speed * 0.003, 0.1); 
         
         this.playChime(volume, freq);
         this.lastChimeTime = now;
      }
    }
  }

  public stopDrawing() {
    this.isPlaying = false;
  }

  public destroy() {
    this.stopDrawing();
    if (this.ctx) {
      this.ctx.close();
    }
    this.ctx = null;
  }
}

export const asmrSynth = new ASMRSynth();

// 呼吸引导的自然放松背景音（环境底噪/和弦垫音）
class BreathingSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;

  public play() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    this.masterGain = this.ctx.createGain();
    // 初始音量为0，用2秒钟缓慢淡入，模拟深吸气
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(0.15, now + 2.5); 
    this.masterGain.connect(this.ctx.destination);

    // 构建一个温暖、放松的冥想和弦 (C Major 7: C3, E3, G3, B3)
    const frequencies = [130.81, 164.81, 196.00, 246.94];
    this.oscillators = [];

    frequencies.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine'; // 纯净的波形
      osc.frequency.value = freq;
      
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400; // 压暗声音，使其更像背景的嗡鸣/风声

      osc.connect(filter);
      filter.connect(this.masterGain!);
      
      osc.start(now);
      this.oscillators.push(osc);
    });

    this.isPlaying = true;
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    
    const now = this.ctx.currentTime;
    // 缓慢淡出，模拟呼气结束
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 3);
    
    this.oscillators.forEach(osc => {
      osc.stop(now + 3);
    });
    
    this.oscillators = [];
    this.isPlaying = false;
  }
}

export const breathingSynth = new BreathingSynth();

// 翻页/撕纸的悦耳音效（轻柔的摩擦声 + 竖琴般的提示音）
class PaperTearSynth {
  private ctx: AudioContext | null = null;

  public play() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // 1. 轻柔的纸张摩擦声 (Soft Noise)
    const noiseDuration = 0.5;
    const bufferSize = this.ctx.sampleRate * noiseDuration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000; // 更高频、更轻盈的沙沙声
    noiseFilter.Q.value = 1.5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.1); // 音量极小，不吓人
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noise.start(now);
    noise.stop(now + noiseDuration);

    // 2. 悦耳的旋律提示音 (Magical Chime / Harp)
    // 播放一个快速的琶音 (Arpeggio)，代表“保存成功”的喜悦感
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C Major)
    
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const oscGain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + (index * 0.08); // 每个音符错开一点点，形成琶音
      
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(0.1, startTime + 0.05); // 音量也很轻柔
      oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0); // 余音绕梁1秒
      
      osc.connect(oscGain);
      oscGain.connect(this.ctx!.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 1.0);
    });
  }
}

export const paperTearSynth = new PaperTearSynth();
