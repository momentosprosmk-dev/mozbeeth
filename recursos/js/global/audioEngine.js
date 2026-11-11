// audioEngine.js | Motor de Audio Híbrido + Reproductor Global - Mozbeeth

class MozbeethAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isPlaying = false;
    this.currentTrack = null;
    this.stepTimer = null;
    this.progressTimer = null;
    this.stepIndex = 0;
    this.elapsedSeconds = 0;
    this.totalSeconds = 180;
    this.volume = 0.8;

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.usingRealAudio = false;

    this.onStateChange = null;
    this.onProgress = null;
    this.onTrackEnded = null;

    this._setupRealAudioEvents();
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  _setupRealAudioEvents() {
    this.audioElement.addEventListener("timeupdate", () => {
      if (!this.usingRealAudio) return;
      this.elapsedSeconds = this.audioElement.currentTime;
      this.totalSeconds = this.audioElement.duration || 180;
      if (this.onProgress) this.onProgress(this.elapsedSeconds, this.totalSeconds);
    });
    this.audioElement.addEventListener("ended", () => {
      if (!this.usingRealAudio) return;
      this.stop();
      if (this.onTrackEnded) this.onTrackEnded();
    });
  }

  parseDuration(str) {
    if (!str) return 180;
    const parts = str.split(":").map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : 180;
  }

  loadAndPlay(track) {
    this._initContext();
    const isSame = this.currentTrack && this.currentTrack.id === track.id;
    if (isSame) {
      this.togglePlay();
      return;
    }

    this.stop();
    this.currentTrack = track;
    this.totalSeconds = this.parseDuration(track.duration);
    this.elapsedSeconds = 0;

    if (track.audioUrl && track.audioUrl.trim() !== "") {
      this.usingRealAudio = true;
      this.audioElement.src = track.audioUrl;
      this.audioElement.volume = this.volume;
      this.audioElement.play().catch(() => {
        this.usingRealAudio = false;
        this._startSynthLoop(track);
      });
      this.isPlaying = true;
    } else {
      this.usingRealAudio = false;
      this._startSynthLoop(track);
      this.isPlaying = true;
    }

    this._notifyState();
  }

  togglePlay() {
    if (!this.currentTrack) return;
    this._initContext();
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.usingRealAudio) {
        this.audioElement.play();
      } else {
        this._startSynthLoop(this.currentTrack, false);
      }
      this.isPlaying = true;
      this._notifyState();
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.usingRealAudio) {
      this.audioElement.pause();
    } else {
      this._clearTimers();
    }
    this._notifyState();
  }

  stop() {
    this.isPlaying = false;
    this._clearTimers();
    if (this.usingRealAudio) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.stepIndex = 0;
    this._notifyState();
  }

  seekToRatio(ratio) {
    if (!this.currentTrack) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    this.elapsedSeconds = clamped * this.totalSeconds;
    if (this.usingRealAudio && this.audioElement.duration) {
      this.audioElement.currentTime = this.elapsedSeconds;
    }
    if (this.onProgress) this.onProgress(this.elapsedSeconds, this.totalSeconds);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.audioElement.volume = this.volume;
  }

  _clearTimers() {
    if (this.stepTimer) clearInterval(this.stepTimer);
    if (this.progressTimer) clearInterval(this.progressTimer);
    this.stepTimer = null;
    this.progressTimer = null;
  }

  _notifyState() {
    if (this.onStateChange) {
      this.onStateChange({ isPlaying: this.isPlaying, track: this.currentTrack });
    }
  }

  _startSynthLoop(track, resetStep = true) {
    this._clearTimers();
    if (resetStep) this.stepIndex = 0;
    const bpm = track.bpm || 100;
    const stepMs = (60 / bpm / 4) * 1000;

    const playStep = () => {
      if (!this.isPlaying) return;
      const s = this.stepIndex % 16;
      const preset = track.synthPreset || "reggaeton";
      const now = this.ctx.currentTime;

      if (preset === "reggaeton" || preset === "reggaeton2") {
        if (s % 4 === 0) this._triggerKick(now, 58);
        if (s === 3 || s === 6 || s === 11 || s === 14) {
          this._triggerSnare(now, preset === "reggaeton2" ? 255 : 210);
        }
        if (s % 2 === 0) this._triggerHat(now, 0.04);
        const bassNotes = preset === "reggaeton2" ? [73.4, 87.3, 65.4, 82.4] : [92.5, 110, 82.4, 73.4];
        if (s === 0 || s === 6 || s === 10) {
          this._triggerBass(now, bassNotes[Math.floor(this.stepIndex / 16) % bassNotes.length], 0.35);
        }
        if (s === 0 || s === 3 || s === 8 || s === 14) {
          const pluckNotes = [370, 440, 330, 293.66, 493.88];
          this._triggerPluck(now, pluckNotes[(s + Math.floor(this.stepIndex / 8)) % pluckNotes.length], 0.22);
        }
      } else if (preset === "trap") {
        if (s === 0 || s === 7 || s === 10) this._triggerKick(now, 50);
        if (s === 4 || s === 12) this._triggerSnare(now, 240);
        this._triggerHat(now, s % 2 === 0 ? 0.05 : 0.03);
        if (s === 0 || s === 7 || s === 10) {
          const trapBass = [65.41, 61.74, 77.78, 58.27];
          this._triggerBass(now, trapBass[Math.floor(this.stepIndex / 16) % trapBass.length], 0.45);
        }
        if (s === 0 || s === 6 || s === 12) {
          const bellNotes = [523.25, 493.88, 392.0, 466.16];
          this._triggerPluck(now, bellNotes[(s / 2) % bellNotes.length], 0.3);
        }
      } else {
        if (s === 0 || s === 8 || s === 10) this._triggerKick(now, 62);
        if (s === 4 || s === 12) this._triggerSnare(now, 195);
        if (s % 2 === 0) this._triggerHat(now, 0.04);
        if (s === 0 || s === 8) {
          const synthBass = [82.41, 98.0, 110.0, 73.42];
          this._triggerBass(now, synthBass[Math.floor(this.stepIndex / 16) % synthBass.length], 0.4);
        }
        if (s % 4 === 0 || s === 14) {
          const chordNotes = [329.63, 392.0, 440.0, 493.88, 587.33];
          this._triggerPluck(now, chordNotes[s % chordNotes.length], 0.35);
        }
      }
      this.stepIndex++;
    };

    playStep();
    this.stepTimer = setInterval(playStep, stepMs);
    this.progressTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.elapsedSeconds += 0.25;
      if (this.elapsedSeconds >= this.totalSeconds) {
        this.elapsedSeconds = 0;
        if (this.onTrackEnded) {
          this.onTrackEnded();
          return;
        }
      }
      if (this.onProgress) this.onProgress(this.elapsedSeconds, this.totalSeconds);
    }, 250);
  }

  _triggerKick(time, freqStart = 55) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(freqStart, time + 0.07);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.28);
    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.31);
  }

  _triggerSnare(time, toneFreq = 200) {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(900, time);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(toneFreq, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);
    oscGain.gain.setValueAtTime(0.32, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  _triggerHat(time, duration = 0.04) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6500, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.13, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  _triggerBass(time, freq, duration = 0.35) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, time);
    filter.frequency.exponentialRampToValueAtTime(85, time + duration);
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  _triggerPluck(time, freq, duration = 0.25) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + duration);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  getFrequencyData() {
    if (!this.analyser || !this.isPlaying) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

window.mozbeethAudio = new MozbeethAudioEngine();
