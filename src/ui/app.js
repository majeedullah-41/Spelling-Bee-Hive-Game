/**
 * Spelling Bee Hive — Interactive Browser UI & Controller
 *
 * Uses the studio-grade illustrated assets (`welcome-scene.png`, `gameplay-garden-bg.jpg`,
 * and transparent-keyed `bee-sprite.png`) combined with the deterministic game engine
 * (`src/engine/gameState.js`), validated word bank (`src/data/words.js`), and
 * reusable audio system (`src/audio/audioManager.js`).
 */

import {
  DIFFICULTY_CONFIG,
  CURRICULUM_METADATA
} from '../data/words.js';
import {
  createInitialState,
  startSession,
  pauseGame,
  resumeGame,
  restartCurrentWord,
  advanceToNextWord,
  moveBeeByDelta,
  moveBeeToX,
  getWordSlots,
  requestHint,
  recordAudioReplay,
  stepGame,
  getSessionSummaryReport
} from '../engine/gameState.js';
import { AudioManager } from '../audio/audioManager.js';

let cachedTransparentBeeDataUrl = null;

export function prepareTransparentBeeSprite(onReady) {
  if (onReady) onReady('./src/assets/bee-sprite.png');
}

/**
 * Returns the high-resolution illustrated bee character markup (using transparent PNG asset + inline SVG fallback).
 */
export function renderBeeSvg(className = 'bee-sprite-inner') {
  const src = cachedTransparentBeeDataUrl || './src/assets/bee-sprite.png';
  return `
    <div class="bee-sprite-wrapper ${className}">
      <img
        src="${src}"
        alt=""
        class="bee-character-img"
        data-bee-img
        draggable="false"
      />
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:none">
        <circle cx="70" cy="70" r="40" fill="#ffc419" />
      </svg>
    </div>
  `;
}

/**
 * Returns the SVG/asset wrapper for the golden hanging skep beehive.
 */
export function renderHiveSvg() {
  return `
    <svg class="welcome-skep-hive" viewBox="0 0 150 175" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="75" cy="84" rx="56" ry="40" fill="#ffc933" stroke="#6e370a" stroke-width="4" />
    </svg>
  `;
}

/**
 * Returns the backdrop markup (kept for module API compatibility).
 */
export function renderGardenBackdropSvg() {
  return `
    <div class="garden-scene" aria-hidden="true" style="display:none">
      <svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#76d343"/></svg>
    </div>
  `;
}

export class SpellingBeeHiveApp {
  constructor(rootElement) {
    this.root = rootElement;
    this.state = createInitialState();
    this.selectedWelcomeDifficulty = 'easy';
    this.hardWaspsPreference = true;
    this.activeModal = null; // null | 'how_to_play' | 'settings' | 'difficulty'
    this.keysHeld = { left: false, right: false };
    this.rafId = null;
    this.lastFrameTime = 0;

    this.audio = new AudioManager({
      muted: false,
      onSpeechStatusChange: ({ speaking }) => {
        const indicator = this.root?.querySelector('[data-speech-indicator]');
        if (indicator) {
          indicator.textContent = speaking ? 'Speaking...' : 'Hear Word';
        }
      }
    });

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.tick = this.tick.bind(this);
  }

  init() {
    if (!this.root) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    prepareTransparentBeeSprite((transparentUrl) => {
      const imgs = this.root?.querySelectorAll('[data-bee-img]');
      if (imgs) {
        imgs.forEach((img) => {
          img.src = transparentUrl;
        });
      }
    });

    this.render();
    this.startLoop();
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.audio.stopAll();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
  }

  startLoop() {
    this.lastFrameTime = performance.now();
    const loop = (now) => {
      const dt = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.tick(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  tick(deltaMs) {
    if (this.state.screen !== 'playing' || this.activeModal) {
      return;
    }

    const keySpeedPctPerSec = 58;
    let velocityX = 0;
    if (this.keysHeld.left && !this.keysHeld.right) velocityX = -keySpeedPctPerSec;
    if (this.keysHeld.right && !this.keysHeld.left) velocityX = keySpeedPctPerSec;

    this.state = {
      ...this.state,
      bee: {
        ...this.state.bee,
        velocityX
      }
    };

    const prevScreen = this.state.screen;
    const prevLetterIndex = this.state.currentLetterIndex;
    const prevFeedbackTime = this.state.feedback.timestamp;
    const prevTileCount = this.state.tiles.length;

    const { state: nextState, events } = stepGame(this.state, deltaMs);
    this.state = nextState;

    for (const ev of events) {
      if (ev.type === 'collision') {
        if (ev.outcome === 'correct_letter') {
          this.audio.playCatchCorrect();
        } else if (ev.outcome === 'word_complete') {
          this.audio.playWordComplete();
        } else if (ev.outcome === 'wasp') {
          this.audio.playWaspBuzz();
        } else if (ev.outcome === 'later_letter' || ev.outcome === 'wrong_letter') {
          this.audio.playCatchLaterOrWrong();
        }
      }
    }

    if (
      this.state.screen === 'playing' &&
      this.state.config.idleAutoReplayMs > 0 &&
      this.state.currentWordElapsedMs - this.state.lastAudioActivityMs >=
        this.state.config.idleAutoReplayMs
    ) {
      this.state = recordAudioReplay(this.state);
      this.audio.speakWord(this.state.currentWord);
    }

    if (
      this.state.screen !== prevScreen ||
      this.state.currentLetterIndex !== prevLetterIndex ||
      this.state.feedback.timestamp !== prevFeedbackTime ||
      this.state.tiles.length !== prevTileCount
    ) {
      this.render();
    } else {
      this.syncPlayfieldPositions();
    }
  }

  syncPlayfieldPositions() {
    const beeEl = this.root.querySelector('[data-bee-el]');
    if (beeEl) {
      beeEl.style.left = `${this.state.bee.x}%`;
      beeEl.style.top = `${this.state.bee.y}%`;
      beeEl.classList.toggle('facing-left', this.state.bee.facing === 'left');
      beeEl.classList.toggle('bee-stunned', this.state.bee.stunRemainingMs > 0);
    }

    for (const tile of this.state.tiles) {
      const tileEl = this.root.querySelector(`[data-tile-id="${tile.id}"]`);
      if (tileEl) {
        tileEl.style.left = `${tile.x}%`;
        tileEl.style.top = `${tile.y}%`;
      }
    }
  }

  handleKeyDown(e) {
    if (this.state.screen === 'playing' && !this.activeModal) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.keysHeld.left = true;
        this.state = moveBeeByDelta(this.state, -4.5);
        this.syncPlayfieldPositions();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.keysHeld.right = true;
        this.state = moveBeeByDelta(this.state, 4.5);
        this.syncPlayfieldPositions();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        this.keysHeld = { left: false, right: false };
        this.state = pauseGame(this.state);
        this.render();
      } else if (e.key === 'h' || e.key === 'H' || e.key === ' ') {
        e.preventDefault();
        this.triggerHint();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.triggerAudioReplay();
      }
    } else if (this.state.screen === 'paused' && e.key === 'Escape') {
      e.preventDefault();
      this.state = resumeGame(this.state);
      this.render();
    }
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keysHeld.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keysHeld.right = false;
    }
  }

  beginGameWithDifficulty(difficultyId) {
    this.selectedWelcomeDifficulty = difficultyId;
    this.activeModal = null;
    this.keysHeld = { left: false, right: false };
    this.state = startSession(this.state, difficultyId, {
      waspsEnabled: difficultyId === 'hard' ? this.hardWaspsPreference : false
    });
    this.render();
    if (this.state.currentWord) {
      this.audio.speakWordPromptSequence(
        this.state.currentWord,
        this.state.config.autoSpeakSequence
      );
    }
  }

  triggerAudioReplay(sentenceAlso = true) {
    if (!this.state.currentWord) return;
    this.state = recordAudioReplay(this.state);
    if (sentenceAlso) {
      this.audio.speakWordPromptSequence(this.state.currentWord, ['word', 'sentence']);
    } else {
      this.audio.speakWord(this.state.currentWord);
    }
    this.render();
  }

  triggerHint() {
    if (this.state.screen !== 'playing') return;
    this.audio.playButtonClick();
    this.state = requestHint(this.state);
    if (this.state.currentWordHintsStep === 1 && this.state.currentWord) {
      this.audio.speakWord(this.state.currentWord);
    }
    this.render();
  }

  renderWelcomeScreen() {
    const isMuted = this.audio.muted;
    const difficulties = [
      DIFFICULTY_CONFIG.easy,
      DIFFICULTY_CONFIG.medium,
      DIFFICULTY_CONFIG.hard
    ];

    return `
      <main class="welcome-viewport" data-testid="welcome-screen">
        <div class="welcome-stage" role="region" aria-label="Spelling Bee Hive Welcome Menu">
          <h1 class="sr-only">Spelling Bee Hive — Habit Builder School — Catch, Spell, Grow</h1>

          <!-- Top-Right Audio Mute/Unmute Button -->
          <button
            type="button"
            class="welcome-hotspot hotspot-mute ${isMuted ? 'is-muted' : ''}"
            data-action="toggle-mute"
            aria-label="${isMuted ? 'Unmute game audio' : 'Mute game audio'}"
            title="${isMuted ? 'Unmute Audio' : 'Mute Audio'}"
          >
            <span class="sr-only">${isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>

          <!-- Top-Right Settings Button -->
          <button
            type="button"
            class="welcome-hotspot hotspot-settings"
            data-action="open-settings"
            aria-label="Open game settings and accessibility options"
            title="Settings & Accessibility"
          >
            <span class="sr-only">Settings & Accessibility</span>
          </button>

          <!-- Center Golden Play Button -->
          <button
            type="button"
            class="welcome-hotspot hotspot-play"
            data-action="start-selected-difficulty"
            data-testid="play-button"
            aria-label="Play Spelling Bee Hive (${DIFFICULTY_CONFIG[this.selectedWelcomeDifficulty].name})"
            title="Start Game (${DIFFICULTY_CONFIG[this.selectedWelcomeDifficulty].name})"
          >
            <span class="sr-only">Play</span>
          </button>

          <!-- Difficulty Selection Cards (Easy, Medium, Hard) -->
          ${difficulties
            .map((diff) => {
              const isSelected = this.selectedWelcomeDifficulty === diff.id;
              return `
                <button
                  type="button"
                  class="welcome-hotspot hotspot-diff hotspot-diff-${diff.id} ${
                    isSelected ? 'selected' : ''
                  }"
                  data-action="select-difficulty-card"
                  data-difficulty="${diff.id}"
                  data-testid="difficulty-card-${diff.id}"
                  aria-pressed="${isSelected}"
                  aria-label="${diff.name} — ${diff.title}: ${diff.subtitle}"
                  title="${diff.name} — ${diff.title} (${
                    isSelected ? 'Click again or press Play to start!' : 'Click to select'
                  })"
                >
                  ${
                    isSelected
                      ? `<span class="selected-diff-pill">Selected: ${diff.name}</span>`
                      : ''
                  }
                  <span class="sr-only">${diff.name} — ${diff.title} — ${diff.subtitle}</span>
                </button>
              `;
            })
            .join('')}

          <!-- Bottom How to Play Button -->
          <button
            type="button"
            class="welcome-hotspot hotspot-how-to-play"
            data-action="open-how-to-play"
            data-testid="how-to-play-button"
            aria-label="How to Play"
            title="How to Play"
          >
            <span class="sr-only">How to Play</span>
          </button>

          <!-- Level Guide & Difficulty Details Pill -->
          <button
            type="button"
            class="hotspot-level-guide"
            data-action="open-difficulty-modal"
            data-testid="difficulty-details-button"
          >
            <span>Level Guide</span>
          </button>
        </div>
      </main>
    `;
  }

  renderGameplayScreen() {
    const { currentWord, currentWordIndex, sessionWords, honeyScore, feedback, bee, tiles } =
      this.state;
    const slots = getWordSlots(this.state);
    const reviewBadge = currentWord?.isReviewPass
      ? ' • Review Practice'
      : '';

    return `
      <main class="gameplay-viewport" data-testid="gameplay-screen">
        <!-- Top Carved Wood & Honeycomb HUD -->
        <section class="gameplay-hud" aria-label="Word Progress and Controls">
          <div class="hud-session-info">
            <span class="session-pill" data-testid="session-progress">
              ${this.state.config.name}: Word ${currentWordIndex + 1} of ${sessionWords.length}${reviewBadge}
            </span>
            <span class="honey-score-pill" data-testid="honey-score">
              Honey Nectar: ${honeyScore}
            </span>
          </div>

          <div class="hud-word-center">
            <div class="word-sentence-clue" data-testid="word-sentence-clue">
              "${currentWord?.sentence || ''}"
            </div>
            <div class="word-slots-row" role="group" aria-label="Target Word Letter Slots" data-testid="word-slots">
              ${slots
                .map(
                  (slot) => `
                  <div
                    class="word-slot ${
                      slot.status === 'collected'
                        ? 'slot-collected'
                        : slot.status === 'next'
                        ? 'slot-next'
                        : ''
                    }"
                    data-slot-index="${slot.index}"
                    data-slot-status="${slot.status}"
                    aria-label="Slot ${slot.index + 1}: ${
                      slot.letter
                        ? `Collected ${slot.letter}`
                        : slot.status === 'next'
                        ? 'Next required letter'
                        : 'Empty'
                    }"
                  >
                    <span class="slot-index-badge">${slot.index + 1}</span>
                    ${
                      slot.letter
                        ? `<span>${slot.letter}</span>`
                        : slot.watermark
                        ? `<span class="slot-watermark" data-testid="slot-watermark">${slot.watermark}</span>`
                        : `<span aria-hidden="true">_</span>`
                    }
                  </div>
                `
                )
                .join('')}
            </div>
          </div>

          <div class="hud-controls">
            <button
              type="button"
              class="hud-btn hud-btn-audio"
              data-action="replay-audio"
              data-testid="replay-audio-button"
              title="Listen to the word and sentence again (Shortcut: R)"
            >
              <span data-speech-indicator>Hear Word</span>
            </button>
            <button
              type="button"
              class="hud-btn hud-btn-hint"
              data-action="request-hint"
              data-testid="hint-button"
              title="Get a helpful spelling clue (Shortcut: Space or H)"
            >
              Hint
            </button>
            <button
              type="button"
              class="hud-btn hud-btn-pause"
              data-action="pause-game"
              data-testid="pause-button"
              title="Pause Game (Shortcut: P or Esc)"
            >
              Pause
            </button>
          </div>
        </section>

        <!-- Contextual Feedback Area -->
        <div
          class="feedback-banner feedback-${feedback.type}"
          role="status"
          aria-live="polite"
          data-testid="feedback-banner"
        >
          <span>${feedback.message}</span>
        </div>

        <!-- Interactive Garden Playfield -->
        <div
          class="playfield-container"
          data-playfield
          data-testid="playfield"
          aria-label="Garden play area. Move the bee left or right to catch falling letter tiles in order."
        >
          ${tiles
            .map((tile) => {
              if (!tile.active) return '';
              if (tile.kind === 'wasp') {
                return `
                  <div
                    class="falling-tile tile-wasp"
                    data-tile-id="${tile.id}"
                    data-tile-kind="wasp"
                    style="left: ${tile.x}%; top: ${tile.y}%;"
                  >
                    <div class="tile-hex-body" style="font-size: 1.05rem;" aria-label="Wasp obstacle">WASP</div>
                    <span class="wasp-badge">OBSTACLE</span>
                  </div>
                `;
              }
              return `
                <div
                  class="falling-tile tile-letter"
                  data-tile-id="${tile.id}"
                  data-tile-letter="${tile.letter}"
                  style="left: ${tile.x}%; top: ${tile.y}%;"
                >
                  <div class="tile-hex-body">${tile.letter}</div>
                </div>
              `;
            })
            .join('')}

          <div
            class="player-bee ${bee.facing === 'left' ? 'facing-left' : ''} ${
              bee.stunRemainingMs > 0 ? 'bee-stunned' : ''
            }"
            data-bee-el
            data-testid="player-bee"
            style="left: ${bee.x}%; top: ${bee.y}%;"
          >
            ${renderBeeSvg()}
          </div>
        </div>

        <!-- Accessible Touch & Button Controls Bar -->
        <div class="touch-controls-bar">
          <button
            type="button"
            class="btn-move-arrow"
            data-action="move-left"
            data-testid="move-left-button"
            aria-label="Move Bee Left"
          >
            Fly Left
          </button>
          <div class="controls-help-hint">
            Use <strong>Left / Right Arrow Keys</strong>, <strong>A / D</strong>, drag in the garden, or tap the flight buttons!
          </div>
          <button
            type="button"
            class="btn-move-arrow"
            data-action="move-right"
            data-testid="move-right-button"
            aria-label="Move Bee Right"
          >
            Fly Right
          </button>
        </div>
      </main>
    `;
  }

  renderPauseOverlay() {
    if (this.state.screen !== 'paused') return '';
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pause-title" data-testid="pause-modal">
        <div class="modal-card">
          <h2 id="pause-title" class="modal-title">Game Paused</h2>
          <p style="margin-bottom: 14px; font-family: var(--font-body); font-weight: 700;">
            The garden is resting! Falling letters and timers are paused until you are ready.
          </p>
          <div class="modal-actions">
            <button type="button" class="btn-primary-gold" data-action="resume-game" data-testid="resume-button">
              Resume Game
            </button>
            <button type="button" class="btn-secondary-cream" data-action="restart-word" data-testid="restart-word-button">
              Restart Current Word
            </button>
            <button type="button" class="btn-secondary-cream" data-action="open-difficulty-modal" data-testid="pause-change-difficulty">
              Return to Level Selection
            </button>
            <button type="button" class="btn-secondary-cream" data-action="return-home" data-testid="pause-return-home">
              Return Home
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderWordCompleteOverlay() {
    if (this.state.screen !== 'word_complete' || !this.state.currentWord) return '';
    const wordEntry = this.state.currentWord;
    const isLastWord = this.state.currentWordIndex + 1 >= this.state.sessionWords.length;

    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="word-complete-title" data-testid="word-complete-modal">
        <div class="modal-card">
          <h2 id="word-complete-title" class="modal-title">Great spelling!</h2>
          <div class="completed-word-display" data-testid="completed-word-spelling">
            ${wordEntry.word
              .split('')
              .map((ch) => `<span class="completed-letter-tile">${ch}</span>`)
              .join('')}
          </div>

          <div class="teaching-note-box">
            <h4>Spelling Pattern: ${wordEntry.pattern}</h4>
            <p data-testid="completed-word-explanation"><strong>Why it's spelled this way:</strong> ${wordEntry.explanation}</p>
            <p data-testid="completed-word-sentence"><strong>Example sentence:</strong> "${wordEntry.sentence}"</p>
            ${
              wordEntry.meaning
                ? `<p><strong>Meaning:</strong> ${wordEntry.meaning}</p>`
                : ''
            }
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary-cream" data-action="speak-completed-word">
              Listen to Word & Sentence
            </button>
            <button type="button" class="btn-primary-gold" data-action="next-word" data-testid="continue-next-word-button">
              ${isLastWord ? 'View Session Summary' : 'Continue to Next Word'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderSessionCompleteOverlay() {
    if (this.state.screen !== 'session_complete') return '';
    const summary = getSessionSummaryReport(this.state);

    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="session-complete-title" data-testid="session-complete-modal">
        <div class="modal-card">
          <div class="honey-score-pill" style="margin-bottom: 10px;">
            Honeycomb Rating: ${summary.stars} / 3
          </div>
          <h2 id="session-complete-title" class="modal-title">Hive Filled with Honey!</h2>
          <p style="font-family: var(--font-body); font-weight: 800; color: #5c3100; margin-bottom: 8px;">
            ${summary.starReason}
          </p>

          <div class="summary-grid">
            <div class="summary-panel" data-testid="learning-metrics-panel">
              <h3>Spelling & Learning Progress</h3>
              <div class="summary-stat-line">
                <span>Difficulty Level:</span>
                <strong>${summary.difficultyName} (${summary.difficultyTitle})</strong>
              </div>
              <div class="summary-stat-line">
                <span>Words Completed:</span>
                <strong data-testid="summary-words-completed">${summary.wordsCompleted}</strong>
              </div>
              <div class="summary-stat-line">
                <span>Spelled Correctly on 1st Try:</span>
                <strong data-testid="summary-first-attempt">${summary.firstAttemptCorrectCount}</strong>
              </div>
              <div class="summary-stat-line">
                <span>Words Using Extra Practice:</span>
                <strong data-testid="summary-extra-attempts">${summary.wordsRequiringRetryCount}</strong>
              </div>
              <div style="margin-top: 8px;">
                <span style="font-size: 0.85rem; font-weight: 800;">Patterns Practised:</span>
                <div class="pattern-chips">
                  ${summary.patternsPracticed
                    .map((p) => `<span class="pattern-chip">${p}</span>`)
                    .join('')}
                </div>
              </div>
            </div>

            <div class="summary-panel" data-testid="game-metrics-panel">
              <h3>Garden Flight & Helper Tools</h3>
              <div class="summary-stat-line">
                <span>Honey Nectar Score:</span>
                <strong>${summary.gameStats.honeyScore}</strong>
              </div>
              <div class="summary-stat-line">
                <span>Correct Letter Tiles Caught:</span>
                <strong>${summary.gameStats.correctTilesCaught}</strong>
              </div>
              <div class="summary-stat-line">
                <span>Tiles Missed (Fell Past Bee):</span>
                <strong>${summary.gameStats.tilesMissed}</strong>
              </div>
              <div class="summary-stat-line">
                <span>Audio Replays & Hints Used:</span>
                <strong>${summary.gameStats.audioReplays + summary.gameStats.hintsUsed} (Great habit!)</strong>
              </div>
              ${
                summary.gameStats.obstacleCollisions > 0
                  ? `<div class="summary-stat-line">
                      <span>Wasp Bumps (Not a spelling error):</span>
                      <strong>${summary.gameStats.obstacleCollisions}</strong>
                    </div>`
                  : ''
              }
            </div>
          </div>

          ${
            summary.wordsForReview.length > 0
              ? `
              <div class="teaching-note-box">
                <h4>Words Practised with Extra Care</h4>
                ${summary.wordsForReview
                  .map(
                    (w) =>
                      `<p><strong>${w.word}</strong> (${w.pattern}): ${w.explanation}</p>`
                  )
                  .join('')}
              </div>
            `
              : ''
          }

          <div class="modal-actions">
            <button type="button" class="btn-primary-gold" data-action="play-again" data-testid="play-again-button">
              Play Again (${summary.difficultyName})
            </button>
            <button type="button" class="btn-secondary-cream" data-action="open-difficulty-modal" data-testid="choose-difficulty-button">
              Choose Difficulty
            </button>
            <button type="button" class="btn-secondary-cream" data-action="return-home" data-testid="return-home-button">
              Return Home
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderActiveModal() {
    if (!this.activeModal) return '';

    if (this.activeModal === 'how_to_play') {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title" data-testid="how-to-play-modal">
          <div class="modal-card">
            <h2 id="how-to-play-title" class="modal-title">How to Play Spelling Bee Hive</h2>
            <div class="teaching-note-box">
              <h4>1. Listen & Look at the Word Slots</h4>
              <p>Each round presents a target word and an example sentence. Tap <strong>Hear Word</strong> anytime to listen again!</p>
            </div>
            <div class="teaching-note-box">
              <h4>2. Catch Letters in Exact Spelling Order</h4>
              <p>Move your bee left and right using the <strong>Arrow Keys</strong>, <strong>A / D</strong>, dragging in the garden, or the on-screen flight buttons. Collect letters in order from the first slot to the last!</p>
            </div>
            <div class="teaching-note-box">
              <h4>3. Learn from Clues & Hints</h4>
              <p>If a letter comes later in the word, let it pass and wait for the next required letter. Tap <strong>Hint</strong> anytime for progressive spelling clues—using hints or audio replay never lowers your spelling score!</p>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-primary-gold" data-action="close-modal" data-testid="close-modal-button">
                Got It! Let's Spell
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeModal === 'difficulty') {
      const diffs = [
        DIFFICULTY_CONFIG.easy,
        DIFFICULTY_CONFIG.medium,
        DIFFICULTY_CONFIG.hard
      ];
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="diff-modal-title" data-testid="difficulty-modal">
          <div class="modal-card">
            <h2 id="diff-modal-title" class="modal-title">Choose Your Spelling Challenge</h2>
            <p style="font-family: var(--font-body); font-weight: 700; margin-bottom: 12px;">
              Every difficulty teaches real phonics and spelling patterns at a comfortable pace.
            </p>
            ${diffs
              .map(
                (d) => `
                <div class="teaching-note-box" style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <strong style="font-size: 1.1rem;">${d.name} — ${d.title}</strong>
                    <button
                      type="button"
                      class="btn-primary-gold"
                      style="padding: 8px 18px; font-size: 0.95rem;"
                      data-action="launch-difficulty"
                      data-difficulty="${d.id}"
                      data-testid="start-difficulty-${d.id}"
                    >
                      Play ${d.name}
                    </button>
                  </div>
                  <p>${d.description}</p>
                  ${
                    d.id === 'hard'
                      ? `
                      <label style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; cursor: pointer;">
                        <input
                          type="checkbox"
                          data-action="toggle-hard-wasps"
                          ${this.hardWaspsPreference ? 'checked' : ''}
                        />
                        Include optional Wasp obstacles in Hard mode (uncheck for obstacle-free practice)
                      </label>
                    `
                      : ''
                  }
                </div>
              `
              )
              .join('')}
            <div class="modal-actions">
              <button type="button" class="btn-secondary-cream" data-action="close-modal">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeModal === 'settings') {
      return `
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settings-title" data-testid="settings-modal">
          <div class="modal-card">
            <h2 id="settings-title" class="modal-title">Settings & Accessibility</h2>
            <div class="setting-row">
              <div>
                <strong>Game Audio & Speech</strong>
                <div style="font-size: 0.85rem;">Spoken words, example sentences, and musical chimes</div>
              </div>
              <button type="button" class="btn-secondary-cream" data-action="toggle-mute">
                ${this.audio.muted ? 'Muted (Tap to Unmute)' : 'Sound On'}
              </button>
            </div>

            <div class="setting-row">
              <div>
                <strong>Reduced Motion Mode</strong>
                <div style="font-size: 0.85rem;">Minimizes decorative floating and bounce animations</div>
              </div>
              <button type="button" class="btn-secondary-cream" data-action="toggle-reduced-motion" data-testid="toggle-reduced-motion">
                ${this.state.reducedMotion ? 'Reduced Motion On' : 'Off'}
              </button>
            </div>

            <div class="setting-row">
              <div>
                <strong>Hard Mode Wasp Obstacles</strong>
                <div style="font-size: 0.85rem;">Optional flight challenge in Queen's Challenge mode</div>
              </div>
              <button type="button" class="btn-secondary-cream" data-action="toggle-hard-wasps">
                ${this.hardWaspsPreference ? 'Enabled' : 'Off (Practice Mode)'}
              </button>
            </div>

            <div class="teaching-note-box" style="margin-top: 14px; font-size: 0.85rem;">
              <h4>Curriculum Note</h4>
              <p>${CURRICULUM_METADATA.targetAudience}. ${CURRICULUM_METADATA.note}</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-primary-gold" data-action="close-modal">
                Done
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  render() {
    if (!this.root) return;
    this.root.classList.toggle('reduced-motion', Boolean(this.state.reducedMotion));

    const isWelcome = this.state.screen === 'welcome';
    this.root.innerHTML = `
      ${isWelcome ? this.renderWelcomeScreen() : this.renderGameplayScreen()}
      ${this.renderPauseOverlay()}
      ${this.renderWordCompleteOverlay()}
      ${this.renderSessionCompleteOverlay()}
      ${this.renderActiveModal()}
    `;

    this.bindEvents();
  }

  bindEvents() {
    const actionElements = this.root.querySelectorAll('[data-action]');
    actionElements.forEach((el) => {
      const action = el.getAttribute('data-action');
      if (el.tagName === 'INPUT' && action === 'toggle-hard-wasps') {
        el.addEventListener('change', (e) => {
          this.hardWaspsPreference = Boolean(e.target.checked);
        });
        return;
      }

      el.addEventListener('click', () => {
        switch (action) {
          case 'toggle-mute':
            this.audio.toggleMute();
            this.render();
            break;
          case 'open-settings':
            this.audio.playButtonClick();
            this.activeModal = 'settings';
            this.render();
            break;
          case 'open-how-to-play':
            this.audio.playButtonClick();
            this.activeModal = 'how_to_play';
            this.render();
            break;
          case 'open-difficulty-modal':
            this.audio.playButtonClick();
            this.activeModal = 'difficulty';
            this.render();
            break;
          case 'close-modal':
            this.audio.playButtonClick();
            this.activeModal = null;
            this.render();
            break;
          case 'toggle-reduced-motion':
            this.state = {
              ...this.state,
              reducedMotion: !this.state.reducedMotion
            };
            this.render();
            break;
          case 'toggle-hard-wasps':
            this.hardWaspsPreference = !this.hardWaspsPreference;
            this.render();
            break;
          case 'select-difficulty-card': {
            const diff = el.getAttribute('data-difficulty') || 'easy';
            this.audio.playButtonClick();
            if (this.selectedWelcomeDifficulty === diff) {
              this.beginGameWithDifficulty(diff);
            } else {
              this.selectedWelcomeDifficulty = diff;
              this.render();
            }
            break;
          }
          case 'start-selected-difficulty':
            this.audio.playButtonClick();
            this.beginGameWithDifficulty(this.selectedWelcomeDifficulty);
            break;
          case 'launch-difficulty': {
            const diff = el.getAttribute('data-difficulty') || 'easy';
            this.audio.playButtonClick();
            this.beginGameWithDifficulty(diff);
            break;
          }
          case 'replay-audio':
            this.triggerAudioReplay(true);
            break;
          case 'request-hint':
            this.triggerHint();
            break;
          case 'pause-game':
            this.audio.playButtonClick();
            this.keysHeld = { left: false, right: false };
            this.state = pauseGame(this.state);
            this.render();
            break;
          case 'resume-game':
            this.audio.playButtonClick();
            this.state = resumeGame(this.state);
            this.render();
            break;
          case 'restart-word':
            this.audio.playButtonClick();
            this.state = restartCurrentWord(this.state);
            this.render();
            if (this.state.currentWord) {
              this.audio.speakWord(this.state.currentWord);
            }
            break;
          case 'speak-completed-word':
            if (this.state.currentWord) {
              this.audio.speakWordPromptSequence(this.state.currentWord, [
                'word',
                'sentence'
              ]);
            }
            break;
          case 'next-word':
            this.audio.playButtonClick();
            this.state = advanceToNextWord(this.state);
            this.render();
            if (this.state.screen === 'playing' && this.state.currentWord) {
              this.audio.speakWordPromptSequence(
                this.state.currentWord,
                this.state.config.autoSpeakSequence
              );
            }
            break;
          case 'play-again':
            this.audio.playButtonClick();
            this.beginGameWithDifficulty(this.state.difficulty);
            break;
          case 'return-home':
            this.audio.stopAll();
            this.audio.playButtonClick();
            this.activeModal = null;
            this.keysHeld = { left: false, right: false };
            this.state = createInitialState({
              reducedMotion: this.state.reducedMotion
            });
            this.render();
            break;
          case 'move-left':
            this.state = moveBeeByDelta(this.state, -8);
            this.syncPlayfieldPositions();
            break;
          case 'move-right':
            this.state = moveBeeByDelta(this.state, 8);
            this.syncPlayfieldPositions();
            break;
          default:
            break;
        }
      });
    });

    const playfield = this.root.querySelector('[data-playfield]');
    if (playfield) {
      let dragging = false;
      const updateFromPointer = (clientX) => {
        if (this.state.screen !== 'playing') return;
        const rect = playfield.getBoundingClientRect();
        if (rect.width <= 0) return;
        const pctX = ((clientX - rect.left) / rect.width) * 100;
        this.state = moveBeeToX(this.state, pctX);
        this.syncPlayfieldPositions();
      };

      playfield.addEventListener('pointerdown', (e) => {
        dragging = true;
        updateFromPointer(e.clientX);
      });
      playfield.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        updateFromPointer(e.clientX);
      });
      window.addEventListener(
        'pointerup',
        () => {
          dragging = false;
        },
        { once: true }
      );
    }
  }
}

if (typeof document !== 'undefined') {
  const rootEl = document.getElementById('app');
  if (rootEl) {
    const app = new SpellingBeeHiveApp(rootEl);
    app.init();
    window.__SPELLING_BEE_HIVE__ = app;
  }
}
