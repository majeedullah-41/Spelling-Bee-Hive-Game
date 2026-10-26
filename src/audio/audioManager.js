/**
 * Spelling Bee Hive — Reusable Audio & Speech Manager
 *
 * Uses Web Speech API (speechSynthesis) for clear word & sentence pronunciation
 * and Web Audio API (AudioContext) for pleasant, child-friendly musical chimes.
 *
 * Designed to degrade gracefully in environments without Web Speech or Web Audio
 * (such as Node.js tests or restricted browsers) and never block gameplay.
 */

export class AudioManager {
  constructor(options = {}) {
    this.muted = Boolean(options.muted);
    this.speechRate = options.speechRate ?? 0.9;
    this.speechPitch = options.speechPitch ?? 1.05;
    this.onSpeechStatusChange = options.onSpeechStatusChange || null;
    this.audioCtx = null;
    this.activeSequenceTimers = [];
    this.isSpeaking = false;
  }

  /**
   * Lazily initializes Web Audio API context on user interaction.
   */
  getAudioContext() {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this.stopAll();
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  /**
   * Stops any active speech or queued prompt timers so prompts never overlap.
   */
  stopAll() {
    for (const timer of this.activeSequenceTimers) {
      clearTimeout(timer);
    }
    this.activeSequenceTimers = [];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech synthesis errors on restricted platforms
      }
    }
    this.setSpeakingState(false, '');
  }

  setSpeakingState(speaking, text = '') {
    this.isSpeaking = speaking;
    if (typeof this.onSpeechStatusChange === 'function') {
      this.onSpeechStatusChange({ speaking, text });
    }
  }

  /**
   * Speaks a single text phrase asynchronously without blocking gameplay.
   */
  speakText(text, options = {}) {
    if (!text) return false;
    this.stopAll();

    if (this.muted) {
      this.setSpeakingState(true, text);
      const timer = setTimeout(() => this.setSpeakingState(false, ''), 1200);
      this.activeSequenceTimers.push(timer);
      return false;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      // Graceful visual fallback when Web Speech API is unavailable
      this.setSpeakingState(true, text);
      const timer = setTimeout(() => this.setSpeakingState(false, ''), 1400);
      this.activeSequenceTimers.push(timer);
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? this.speechRate;
      utterance.pitch = options.pitch ?? this.speechPitch;
      utterance.lang = 'en-US';

      utterance.onstart = () => this.setSpeakingState(true, text);
      utterance.onend = () => this.setSpeakingState(false, '');
      utterance.onerror = () => this.setSpeakingState(false, '');

      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      this.setSpeakingState(false, '');
      return false;
    }
  }

  /**
   * Speaks only the target word clearly.
   */
  speakWord(wordEntry) {
    if (!wordEntry || !wordEntry.word) return false;
    const spokenWord = wordEntry.word.toLowerCase();
    return this.speakText(`The word is: ${spokenWord}.`, { rate: 0.85 });
  }

  /**
   * Speaks the contextual example sentence for the word.
   */
  speakSentence(wordEntry) {
    if (!wordEntry || !wordEntry.sentence) return false;
    return this.speakText(wordEntry.sentence, { rate: 0.92 });
  }

  /**
   * Speaks the full prompt sequence appropriate to the difficulty:
   * - Easy mode: Word -> Sentence -> Word (Section 8.1)
   * - Medium / Hard mode: Word -> Sentence (Section 8.2 / 8.3)
   */
  speakWordPromptSequence(wordEntry, sequence = ['word', 'sentence', 'word']) {
    if (!wordEntry || !wordEntry.word) return false;
    this.stopAll();

    const lowerWord = wordEntry.word.toLowerCase();
    const parts = sequence.map((item) => {
      if (item === 'word') return `Spell the word: ${lowerWord}.`;
      if (item === 'sentence') return wordEntry.sentence;
      return lowerWord;
    });

    const combinedPrompt = parts.join(' ');
    return this.speakText(combinedPrompt, { rate: 0.88 });
  }

  /**
   * Plays a short synthesized tone sequence using Web Audio API.
   */
  playTone(frequencies = [523.25], durationSec = 0.14, type = 'sine', volume = 0.12) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    frequencies.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + idx * (durationSec * 0.85));

        gain.gain.setValueAtTime(0.001, now + idx * (durationSec * 0.85));
        gain.gain.exponentialRampToValueAtTime(
          volume,
          now + idx * (durationSec * 0.85) + 0.02
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + (idx + 1) * durationSec
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * (durationSec * 0.85));
        osc.stop(now + (idx + 1) * durationSec + 0.02);
      } catch {
        // Ignore audio synthesis glitches
      }
    });
  }

  playCatchCorrect() {
    this.playTone([523.25, 659.25], 0.12, 'triangle', 0.15);
  }

  playCatchLaterOrWrong() {
    this.playTone([311.13, 277.18], 0.14, 'sine', 0.1);
  }

  playWaspBuzz() {
    this.playTone([165, 146.83], 0.16, 'sawtooth', 0.06);
  }

  playWordComplete() {
    this.playTone([523.25, 659.25, 783.99, 1046.5], 0.15, 'triangle', 0.16);
  }

  playButtonClick() {
    this.playTone([440], 0.06, 'sine', 0.08);
  }
}

