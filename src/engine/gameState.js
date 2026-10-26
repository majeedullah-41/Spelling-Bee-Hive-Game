/**
 * Spelling Bee Hive — Core Game Engine & State Machine
 *
 * Pure, deterministic state logic separated from DOM/rendering.
 * Handles:
 * - Game screens & transitions (welcome, difficulty, playing, paused, word_complete, session_complete)
 * - Bee horizontal movement & boundary clamping
 * - Falling letter tiles & optional wasp obstacles
 * - Strict letter sequence enforcement (including repeated letters like LETTER / GREEN)
 * - Differentiated feedback (correct letter, later letter in word, wrong distractor, missed tile, wasp)
 * - Solvability guarantee (required letter always spawns regularly and respawns when missed)
 * - Separate Learning Metrics vs. Game Metrics
 * - In-session review of words that required extra spelling attempts
 */

import {
  DIFFICULTY_CONFIG,
  getWordsForDifficulty,
  getProgressiveHint
} from '../data/words.js';

export const PLAYFIELD = {
  width: 100, // Normalized percentage coordinates (0 to 100)
  height: 100,
  beeY: 80,
  beeWidth: 11,
  beeHeight: 11,
  tileWidth: 9,
  tileHeight: 9,
  missThresholdY: 94,
  spawnY: 4,
  lanes: [14, 28, 42, 56, 70, 84]
};

let nextTileUid = 1;

export function resetTileUidCounter() {
  nextTileUid = 1;
}

/**
 * Creates a fresh game state object.
 */
export function createInitialState(overrides = {}) {
  return {
    screen: 'welcome', // 'welcome' | 'difficulty' | 'playing' | 'paused' | 'word_complete' | 'session_complete'
    difficulty: 'easy',
    config: { ...DIFFICULTY_CONFIG.easy },
    waspsEnabled: false,
    reducedMotion: false,
    soundMuted: false,

    // Session word list & queue
    sessionWords: [],
    currentWordIndex: 0,
    currentWord: null,
    currentLetterIndex: 0,
    collectedLetters: [],
    reviewQueueIds: [],

    // Active word attempt tracking
    currentWordSpellingErrors: 0,
    currentWordMissedRequired: 0,
    currentWordWaspHits: 0,
    currentWordHintsStep: 0,
    currentWordElapsedMs: 0,
    lastAudioActivityMs: 0,

    // Bee state
    bee: {
      x: 50,
      y: PLAYFIELD.beeY,
      width: PLAYFIELD.beeWidth,
      height: PLAYFIELD.beeHeight,
      velocityX: 0,
      facing: 'right',
      stunRemainingMs: 0
    },

    // Falling tiles
    tiles: [],
    spawnTimerMs: 0,
    consecutiveNonRequiredSpawns: 0,
    lastSpawnLaneIndex: -1,

    // Contextual feedback banner
    feedback: {
      type: 'info', // 'info' | 'correct' | 'later_letter' | 'wrong_letter' | 'missed' | 'hint' | 'wasp' | 'complete'
      message: 'Move the bee to catch the first letter!',
      timestamp: 0
    },

    // Game score (honey points — separate from learning metrics)
    honeyScore: 0,

    // Learning metrics (strictly about spelling knowledge, never polluted by wasps/movement/hints)
    learningMetrics: {
      wordsCompleted: 0,
      firstAttemptCorrectCount: 0,
      wordsRequiringRetryCount: 0,
      totalSpellingErrors: 0,
      patternsPracticed: [],
      wordsForReview: [],
      completedWordRecords: []
    },

    // Game/action metrics (movement, catches, misses, obstacles, support tools)
    gameMetrics: {
      tilesCaught: 0,
      correctTilesCaught: 0,
      laterLettersCaught: 0,
      distractorsCaught: 0,
      tilesMissed: 0,
      obstacleCollisions: 0,
      hintsUsed: 0,
      audioReplays: 0,
      timeSpentMs: 0
    },

    ...overrides
  };
}

/**
 * Starts a new session at the selected difficulty.
 */
export function startSession(state, difficulty = 'easy', options = {}) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
  const words =
    options.customWords && options.customWords.length > 0
      ? options.customWords.map((w) => ({ ...w }))
      : getWordsForDifficulty(config.id, options.sessionLength ?? config.sessionLength);

  const waspsEnabled =
    typeof options.waspsEnabled === 'boolean'
      ? options.waspsEnabled && config.allowWaspsToggle
      : config.enableWaspsByDefault;

  const nextState = createInitialState({
    screen: 'playing',
    difficulty: config.id,
    config: { ...config },
    waspsEnabled,
    reducedMotion: state?.reducedMotion ?? false,
    soundMuted: state?.soundMuted ?? false,
    sessionWords: words,
    currentWordIndex: 0
  });

  return loadWordAtIndex(nextState, 0);
}

/**
 * Loads and initializes the word at `index` in `state.sessionWords`.
 * Clears all transient tiles and timers safely (Requirement 7.4 & 14).
 */
export function loadWordAtIndex(state, index) {
  const wordEntry = state.sessionWords[index] || null;
  if (!wordEntry) {
    return {
      ...state,
      screen: 'session_complete',
      tiles: []
    };
  }

  const isEasy = state.difficulty === 'easy';
  const initialMsg = isEasy
    ? `Spell "${wordEntry.word}"! Catch the letter "${wordEntry.word[0]}" first.`
    : `Listen to the word and catch the first letter in slot #1!`;

  return {
    ...state,
    screen: 'playing',
    currentWordIndex: index,
    currentWord: wordEntry,
    currentLetterIndex: 0,
    collectedLetters: [],
    currentWordSpellingErrors: 0,
    currentWordMissedRequired: 0,
    currentWordWaspHits: 0,
    currentWordHintsStep: 0,
    currentWordElapsedMs: 0,
    lastAudioActivityMs: 0,
    bee: {
      ...state.bee,
      x: 50,
      velocityX: 0,
      stunRemainingMs: 0
    },
    tiles: [],
    spawnTimerMs: state.config.spawnIntervalMs * 0.65, // Spawn first tile fairly soon
    consecutiveNonRequiredSpawns: 2, // Ensure the very first spawned tile is the required letter
    lastSpawnLaneIndex: -1,
    feedback: {
      type: 'info',
      message: initialMsg,
      timestamp: Date.now()
    }
  };
}

/**
 * Pauses an active game. While paused, movement, timers, and collisions are ignored.
 */
export function pauseGame(state) {
  if (state.screen !== 'playing') return state;
  return {
    ...state,
    screen: 'paused',
    bee: {
      ...state.bee,
      velocityX: 0
    }
  };
}

/**
 * Resumes from pause screen back to active gameplay.
 */
export function resumeGame(state) {
  if (state.screen !== 'paused') return state;
  return {
    ...state,
    screen: 'playing'
  };
}

/**
 * Restarts the current word, clearing old tiles and resetting transient word state safely.
 */
export function restartCurrentWord(state) {
  if (!state.currentWord) return state;
  const reloaded = loadWordAtIndex(state, state.currentWordIndex);
  return {
    ...reloaded,
    feedback: {
      type: 'info',
      message: 'Word restarted! Take your time and catch the first letter.',
      timestamp: Date.now()
    }
  };
}

/**
 * Moves the bee horizontally by `deltaX` (in playfield percentage units).
 * Ignored unless `state.screen === 'playing'`.
 */
export function moveBeeByDelta(state, deltaX) {
  if (state.screen !== 'playing') return state;
  const stunFactor = state.bee.stunRemainingMs > 0 ? 0.35 : 1;
  const effectiveDelta = deltaX * stunFactor;
  return moveBeeToX(state, state.bee.x + effectiveDelta);
}

/**
 * Moves the bee horizontally toward or to a target X position, clamped to playfield bounds.
 * Ignored unless `state.screen === 'playing'`.
 */
export function moveBeeToX(state, targetX) {
  if (state.screen !== 'playing') return state;
  const halfWidth = state.bee.width / 2;
  const minX = halfWidth + 2;
  const maxX = PLAYFIELD.width - halfWidth - 2;
  const clampedX = Math.max(minX, Math.min(maxX, targetX));
  const dx = clampedX - state.bee.x;
  const facing = Math.abs(dx) > 0.05 ? (dx > 0 ? 'right' : 'left') : state.bee.facing;

  return {
    ...state,
    bee: {
      ...state.bee,
      x: clampedX,
      facing
    }
  };
}

/**
 * Returns the next required letter for the active word, or null if complete.
 */
export function getNextRequiredLetter(state) {
  if (!state.currentWord || !state.currentWord.word) return null;
  return state.currentWord.word[state.currentLetterIndex] || null;
}

/**
 * Returns the array of word slot descriptors for UI rendering.
 * Each slot has: { index, letter, status: 'collected'|'next'|'upcoming', watermark }
 */
export function getWordSlots(state) {
  if (!state.currentWord || !state.currentWord.word) return [];
  const chars = state.currentWord.word.split('');
  const showWatermark = Boolean(state.config.showSlotWatermark);

  return chars.map((char, index) => {
    const isCollected = index < state.currentLetterIndex;
    const isNext = index === state.currentLetterIndex;
    return {
      index,
      letter: isCollected ? char : '',
      targetLetter: char,
      status: isCollected ? 'collected' : isNext ? 'next' : 'upcoming',
      watermark: !isCollected && showWatermark ? char : ''
    };
  });
}

/**
 * Creates a tile object with complete metadata (Section 7.2).
 */
export function createTile({
  letter,
  kind = 'letter', // 'letter' | 'wasp'
  relation = 'required', // 'required' | 'later_in_word' | 'distractor' | 'obstacle'
  x = 50,
  y = PLAYFIELD.spawnY,
  speedPxPerSec = 100,
  wordId = null
}) {
  const id = `tile-${nextTileUid++}`;
  // Convert px/sec config speed to normalized percentage units per second (assuming ~550px playfield height)
  const speedPctPerSec = speedPxPerSec / 5.5;
  return {
    id,
    letter: kind === 'wasp' ? 'WASP' : String(letter).toUpperCase(),
    kind,
    relation,
    isCorrectNext: kind === 'letter' && relation === 'required',
    isDistractor: kind === 'letter' && relation === 'distractor',
    x,
    y,
    width: PLAYFIELD.tileWidth,
    height: PLAYFIELD.tileHeight,
    speedPctPerSec,
    state: 'falling', // 'falling' | 'collected' | 'missed' | 'inactive'
    active: true,
    wordId
  };
}

/**
 * Chooses a lane X coordinate that avoids overlapping recent tiles near the top of the screen,
 * and ensures wasps never spawn in the same lane or directly underneath a required letter.
 */
function pickSafeSpawnX(state, kind, randomFn = Math.random) {
  const topTiles = state.tiles.filter((t) => t.active && t.y < 32);
  const occupiedLanes = new Set(
    topTiles.map((t) =>
      PLAYFIELD.lanes.reduce((bestIdx, laneX, idx) =>
        Math.abs(laneX - t.x) < Math.abs(PLAYFIELD.lanes[bestIdx] - t.x) ? idx : bestIdx
      , 0)
    )
  );

  // If spawning a wasp, also avoid the lane of ANY active required letter tile so it never makes a letter impossible to catch
  if (kind === 'wasp') {
    for (const t of state.tiles) {
      if (t.active && t.relation === 'required') {
        const reqLane = PLAYFIELD.lanes.reduce((bestIdx, laneX, idx) =>
          Math.abs(laneX - t.x) < Math.abs(PLAYFIELD.lanes[bestIdx] - t.x) ? idx : bestIdx
        , 0);
        occupiedLanes.add(reqLane);
      }
    }
  }

  const availableLaneIndices = PLAYFIELD.lanes
    .map((_, idx) => idx)
    .filter((idx) => !occupiedLanes.has(idx) && idx !== state.lastSpawnLaneIndex);

  const pool =
    availableLaneIndices.length > 0
      ? availableLaneIndices
      : PLAYFIELD.lanes.map((_, idx) => idx);

  const chosenIndex = pool[Math.floor(randomFn() * pool.length)];
  return { laneIndex: chosenIndex, x: PLAYFIELD.lanes[chosenIndex] };
}

/**
 * Spawns the next tile according to difficulty rules while guaranteeing solvability:
 * - In Easy mode, only one required letter is active at a time (and no distractors on the initial CVC words).
 * - In all modes, the required next letter is guaranteed to spawn at least every 3rd tile or immediately if none is on screen and `consecutiveNonRequiredSpawns >= 2`.
 */
export function spawnNextTile(state, randomFn = Math.random) {
  if (state.screen !== 'playing' || !state.currentWord) return state;

  const activeTiles = state.tiles.filter((t) => t.active);
  if (activeTiles.length >= state.config.maxSimultaneousTiles) {
    return state;
  }

  const requiredLetter = getNextRequiredLetter(state);
  if (!requiredLetter) return state;

  const hasActiveRequiredTile = activeTiles.some(
    (t) => t.kind === 'letter' && t.letter === requiredLetter
  );

  // Easy mode rule: strictly one active required letter at a time, and no distractors initially
  const isInitialEasyWord =
    state.difficulty === 'easy' &&
    state.currentWordIndex < state.config.progressiveDistractorStartWordIndex;

  if (state.difficulty === 'easy' && isInitialEasyWord && hasActiveRequiredTile) {
    return state;
  }

  const effectiveDistractorRatio =
    state.currentWordIndex >= state.config.progressiveDistractorStartWordIndex
      ? state.config.progressiveDistractorRatio
      : state.config.distractorRatio;

  // Guarantee solvability: force required letter if not on screen and we already spawned non-required tiles
  const mustSpawnRequired =
    !hasActiveRequiredTile &&
    (isInitialEasyWord || state.consecutiveNonRequiredSpawns >= 2);

  let chosenKind = 'letter';
  let chosenLetter = requiredLetter;
  let chosenRelation = 'required';

  if (!mustSpawnRequired) {
    // Check if an optional wasp should spawn in Hard mode (only after word 0 so mechanic is introduced gently)
    const canSpawnWasp =
      state.waspsEnabled &&
      state.config.waspSpawnChance > 0 &&
      state.currentWordIndex >= 1 &&
      !activeTiles.some((t) => t.kind === 'wasp') &&
      hasActiveRequiredTile;

    const roll = randomFn();
    if (canSpawnWasp && roll < state.config.waspSpawnChance) {
      chosenKind = 'wasp';
      chosenLetter = 'WASP';
      chosenRelation = 'obstacle';
    } else if (roll < effectiveDistractorRatio) {
      // Decide between a later letter in the word (if allowed and available) or an external distractor
      const remainingLaterLetters = state.currentWord.word
        .slice(state.currentLetterIndex + 1)
        .split('')
        .filter((ch) => ch !== requiredLetter);

      if (
        state.config.allowEarlyLaterLetters &&
        remainingLaterLetters.length > 0 &&
        randomFn() < 0.45
      ) {
        chosenLetter =
          remainingLaterLetters[Math.floor(randomFn() * remainingLaterLetters.length)];
        chosenRelation = 'later_in_word';
      } else {
        const pool = (
          state.currentWord.distractorPool || ['B', 'D', 'M', 'N', 'R', 'S', 'T']
        ).filter((ch) => ch !== requiredLetter);
        chosenLetter = pool[Math.floor(randomFn() * pool.length)] || 'Z';
        chosenRelation = !state.currentWord.word
          .slice(state.currentLetterIndex + 1)
          .includes(chosenLetter)
          ? 'distractor'
          : 'later_in_word';
      }
    }
  }

  const { laneIndex, x } = pickSafeSpawnX(state, chosenKind, randomFn);
  const speedMultiplier = chosenKind === 'wasp' ? 0.92 : 1;
  const newTile = createTile({
    letter: chosenLetter,
    kind: chosenKind,
    relation: chosenRelation,
    x,
    y: PLAYFIELD.spawnY,
    speedPxPerSec: state.config.fallSpeedPxPerSec * speedMultiplier,
    wordId: state.currentWord.id
  });

  return {
    ...state,
    tiles: [...state.tiles, newTile],
    lastSpawnLaneIndex: laneIndex,
    consecutiveNonRequiredSpawns:
      chosenRelation === 'required' ? 0 : state.consecutiveNonRequiredSpawns + 1
  };
}

/**
 * Checks axis-aligned bounding box collision between the bee and a tile.
 */
export function checkBeeTileOverlap(bee, tile) {
  if (!tile || !tile.active || tile.state !== 'falling') return false;
  const halfBeeW = (bee.width || PLAYFIELD.beeWidth) * 0.44;
  const halfBeeH = (bee.height || PLAYFIELD.beeHeight) * 0.44;
  const halfTileW = (tile.width || PLAYFIELD.tileWidth) * 0.46;
  const halfTileH = (tile.height || PLAYFIELD.tileHeight) * 0.46;

  return (
    Math.abs(bee.x - tile.x) <= halfBeeW + halfTileW &&
    Math.abs(bee.y - tile.y) <= halfBeeH + halfTileH
  );
}

/**
 * Processes a collision between the bee and a specific tile (by tile id or reference).
 * Deterministic and idempotent: an already-collected or inactive tile is ignored.
 */
export function handleTileCollision(state, tileId) {
  if (state.screen !== 'playing' || !state.currentWord) {
    return { state, outcome: 'ignored' };
  }

  const tileIndex = state.tiles.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) {
    return { state, outcome: 'ignored' };
  }

  const tile = state.tiles[tileIndex];
  if (!tile.active || tile.state !== 'falling') {
    return { state, outcome: 'already_processed' };
  }

  // Mark tile as collected/inactive immediately so it can never trigger duplicate events
  const updatedTiles = state.tiles.map((t, idx) =>
    idx === tileIndex ? { ...t, active: false, state: 'collected' } : t
  );

  const requiredLetter = getNextRequiredLetter(state);
  const remainingSlice = state.currentWord.word.slice(state.currentLetterIndex + 1);

  // Case 1: Wasp obstacle
  if (tile.kind === 'wasp') {
    const nextState = {
      ...state,
      tiles: updatedTiles,
      currentWordWaspHits: state.currentWordWaspHits + 1,
      bee: {
        ...state.bee,
        stunRemainingMs: 1100
      },
      feedback: {
        type: 'wasp',
        message: 'Bzz! A wasp slowed your wings for a moment. Keep going—no spelling penalty!',
        timestamp: Date.now()
      },
      gameMetrics: {
        ...state.gameMetrics,
        obstacleCollisions: state.gameMetrics.obstacleCollisions + 1
      }
    };
    return { state: nextState, outcome: 'wasp' };
  }

  // Case 2: Correct next required letter!
  if (tile.letter === requiredLetter) {
    const nextLetterIndex = state.currentLetterIndex + 1;
    const nextCollected = [...state.collectedLetters, tile.letter];
    const isWordComplete = nextLetterIndex >= state.currentWord.word.length;

    // Refresh remaining falling tiles' relation statuses relative to the new letter index
    const newRequired = state.currentWord.word[nextLetterIndex] || null;
    const newLaterSlice = state.currentWord.word.slice(nextLetterIndex + 1);
    const refreshedTiles = updatedTiles.map((t) => {
      if (!t.active || t.kind === 'wasp') return t;
      const rel =
        t.letter === newRequired
          ? 'required'
          : newLaterSlice.includes(t.letter)
          ? 'later_in_word'
          : 'distractor';
      return {
        ...t,
        relation: rel,
        isCorrectNext: rel === 'required',
        isDistractor: rel === 'distractor'
      };
    });

    if (isWordComplete) {
      return {
        state: finalizeCompletedWord({
          ...state,
          tiles: [],
          currentLetterIndex: nextLetterIndex,
          collectedLetters: nextCollected,
          honeyScore: state.honeyScore + 25,
          gameMetrics: {
            ...state.gameMetrics,
            tilesCaught: state.gameMetrics.tilesCaught + 1,
            correctTilesCaught: state.gameMetrics.correctTilesCaught + 1
          }
        }),
        outcome: 'word_complete'
      };
    }

    const nextState = {
      ...state,
      tiles: refreshedTiles,
      currentLetterIndex: nextLetterIndex,
      collectedLetters: nextCollected,
      currentWordHintsStep: 0, // Reset progressive hint step for the new slot
      honeyScore: state.honeyScore + 10,
      feedback: {
        type: 'correct',
        message: `Nice catch! "${tile.letter}" is in place. Now look for letter #${nextLetterIndex + 1}.`,
        timestamp: Date.now()
      },
      gameMetrics: {
        ...state.gameMetrics,
        tilesCaught: state.gameMetrics.tilesCaught + 1,
        correctTilesCaught: state.gameMetrics.correctTilesCaught + 1
      }
    };
    return { state: nextState, outcome: 'correct_letter' };
  }

  // Case 3: Letter appears LATER in the active word (Requirement 7.3 & 7.7: specific message!)
  if (remainingSlice.includes(tile.letter)) {
    const penalty = state.config.wrongCatchPenalty || 0;
    const nextState = {
      ...state,
      tiles: updatedTiles,
      currentWordSpellingErrors: state.currentWordSpellingErrors + 1,
      consecutiveNonRequiredSpawns: 2, // Ensure required letter spawns next
      honeyScore: Math.max(0, state.honeyScore - penalty),
      feedback: {
        type: 'later_letter',
        message: `"${tile.letter}" comes later in the word! Look for slot #${state.currentLetterIndex + 1} first.`,
        timestamp: Date.now()
      },
      learningMetrics: {
        ...state.learningMetrics,
        totalSpellingErrors: state.learningMetrics.totalSpellingErrors + 1
      },
      gameMetrics: {
        ...state.gameMetrics,
        tilesCaught: state.gameMetrics.tilesCaught + 1,
        laterLettersCaught: state.gameMetrics.laterLettersCaught + 1
      }
    };
    return { state: nextState, outcome: 'later_letter' };
  }

  // Case 4: Distractor letter (not needed in the remaining slots)
  const penalty = state.config.wrongCatchPenalty || 0;
  const nextState = {
    ...state,
    tiles: updatedTiles,
    currentWordSpellingErrors: state.currentWordSpellingErrors + 1,
    consecutiveNonRequiredSpawns: 2, // Ensure required letter spawns next
    honeyScore: Math.max(0, state.honeyScore - penalty),
    feedback: {
      type: 'wrong_letter',
      message: `"${tile.letter}" isn't the next letter we need. Listen to the word and try again!`,
      timestamp: Date.now()
    },
    learningMetrics: {
      ...state.learningMetrics,
      totalSpellingErrors: state.learningMetrics.totalSpellingErrors + 1
    },
    gameMetrics: {
      ...state.gameMetrics,
      tilesCaught: state.gameMetrics.tilesCaught + 1,
      distractorsCaught: state.gameMetrics.distractorsCaught + 1
    }
  };
  return { state: nextState, outcome: 'wrong_letter' };
}

/**
 * Handles when a tile falls past the bottom of the playfield without being caught.
 * Never makes a word unsolvable, and never counts a missed tile as a spelling error.
 */
export function handleTileMissed(state, tileId) {
  const tileIndex = state.tiles.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) return state;

  const tile = state.tiles[tileIndex];
  if (!tile.active) return state;

  const updatedTiles = state.tiles.map((t, idx) =>
    idx === tileIndex ? { ...t, active: false, state: 'missed' } : t
  );

  const requiredLetter = getNextRequiredLetter(state);
  const wasRequired = tile.kind === 'letter' && tile.letter === requiredLetter;

  if (!wasRequired) {
    return {
      ...state,
      tiles: updatedTiles.filter((t) => t.active)
    };
  }

  // If the bee was stunned by a wasp, note that it's no problem at all
  const stunnedNote =
    state.bee.stunRemainingMs > 0
      ? 'No problem! The letter will fall again right away.'
      : 'No problem. Try again when the letter falls again!';

  return {
    ...state,
    tiles: updatedTiles.filter((t) => t.active),
    currentWordMissedRequired: state.currentWordMissedRequired + 1,
    consecutiveNonRequiredSpawns: 3, // Guarantee immediate respawn of the required letter
    spawnTimerMs: Math.min(state.spawnTimerMs, 350),
    feedback: {
      type: 'missed',
      message: stunnedNote,
      timestamp: Date.now()
    },
    gameMetrics: {
      ...state.gameMetrics,
      tilesMissed: state.gameMetrics.tilesMissed + 1
    }
  };
}

/**
 * Transitions the state when all letters of the active word have been collected in order.
 * Records learning metrics separately from game metrics, and queues words with spelling errors
 * for a supportive review pass if not already reviewed.
 */
function finalizeCompletedWord(state) {
  const wordEntry = state.currentWord;
  const firstAttempt = state.currentWordSpellingErrors === 0;

  const patternsPracticed = state.learningMetrics.patternsPracticed.includes(
    wordEntry.pattern
  )
    ? state.learningMetrics.patternsPracticed
    : [...state.learningMetrics.patternsPracticed, wordEntry.pattern];

  const wordsForReview =
    !firstAttempt &&
    !state.learningMetrics.wordsForReview.some((w) => w.id === wordEntry.id)
      ? [...state.learningMetrics.wordsForReview, wordEntry]
      : state.learningMetrics.wordsForReview;

  // Section 13: Revisit previously missed words later in the session (once per word, not immediately back-to-back if another word follows)
  let updatedSessionWords = state.sessionWords;
  let updatedReviewQueueIds = state.reviewQueueIds;

  if (
    !firstAttempt &&
    !wordEntry.isReviewPass &&
    !state.reviewQueueIds.includes(wordEntry.id)
  ) {
    updatedReviewQueueIds = [...state.reviewQueueIds, wordEntry.id];
    updatedSessionWords = [
      ...state.sessionWords,
      {
        ...wordEntry,
        isReviewPass: true
      }
    ];
  }

  const record = {
    id: wordEntry.id,
    word: wordEntry.word,
    category: wordEntry.category,
    pattern: wordEntry.pattern,
    explanation: wordEntry.explanation,
    sentence: wordEntry.sentence,
    firstAttempt,
    spellingErrors: state.currentWordSpellingErrors,
    missedTiles: state.currentWordMissedRequired,
    waspHits: state.currentWordWaspHits,
    isReviewPass: Boolean(wordEntry.isReviewPass)
  };

  return {
    ...state,
    screen: 'word_complete',
    sessionWords: updatedSessionWords,
    reviewQueueIds: updatedReviewQueueIds,
    feedback: {
      type: 'complete',
      message: `Great spelling! You completed ${wordEntry.word}!`,
      timestamp: Date.now()
    },
    learningMetrics: {
      ...state.learningMetrics,
      wordsCompleted: state.learningMetrics.wordsCompleted + 1,
      firstAttemptCorrectCount:
        state.learningMetrics.firstAttemptCorrectCount + (firstAttempt ? 1 : 0),
      wordsRequiringRetryCount:
        state.learningMetrics.wordsRequiringRetryCount + (firstAttempt ? 0 : 1),
      patternsPracticed,
      wordsForReview,
      completedWordRecords: [...state.learningMetrics.completedWordRecords, record]
    }
  };
}

/**
 * Advances from the Word Completion screen to the next word, or to the Session Summary screen.
 */
export function advanceToNextWord(state) {
  const nextIndex = state.currentWordIndex + 1;
  if (nextIndex >= state.sessionWords.length) {
    return {
      ...state,
      screen: 'session_complete',
      tiles: []
    };
  }
  return loadWordAtIndex(state, nextIndex);
}

/**
 * Requests a progressive hint for the active word and slot (Section 12).
 * Never penalized or counted as a spelling mistake.
 */
export function requestHint(state) {
  if (!state.currentWord || state.screen !== 'playing') return state;
  const nextStep = Math.min(4, state.currentWordHintsStep + 1);
  const hintMessage = getProgressiveHint(
    state.currentWord,
    state.currentLetterIndex,
    nextStep
  );

  return {
    ...state,
    currentWordHintsStep: nextStep,
    feedback: {
      type: 'hint',
      message: hintMessage,
      timestamp: Date.now()
    },
    gameMetrics: {
      ...state.gameMetrics,
      hintsUsed: state.gameMetrics.hintsUsed + 1
    }
  };
}

/**
 * Records that the student replayed the word/sentence audio.
 * Never counted as a spelling error.
 */
export function recordAudioReplay(state) {
  return {
    ...state,
    lastAudioActivityMs: state.currentWordElapsedMs,
    gameMetrics: {
      ...state.gameMetrics,
      audioReplays: state.gameMetrics.audioReplays + 1
    }
  };
}

/**
 * Advances the active game simulation by `deltaMs` milliseconds.
 * Completely no-ops if the game is paused or on any non-playing screen.
 */
export function stepGame(state, deltaMs, randomFn = Math.random) {
  if (state.screen !== 'playing' || !state.currentWord || deltaMs <= 0) {
    return { state, events: [] };
  }

  const clampedDeltaMs = Math.min(deltaMs, 100); // Prevent giant jump after tab switch
  const dtSec = clampedDeltaMs / 1000;
  const events = [];

  // 1. Update timers and bee stun
  let nextState = {
    ...state,
    currentWordElapsedMs: state.currentWordElapsedMs + clampedDeltaMs,
    spawnTimerMs: state.spawnTimerMs + clampedDeltaMs,
    bee: {
      ...state.bee,
      stunRemainingMs: Math.max(0, state.bee.stunRemainingMs - clampedDeltaMs)
    },
    gameMetrics: {
      ...state.gameMetrics,
      timeSpentMs: state.gameMetrics.timeSpentMs + clampedDeltaMs
    }
  };

  // Apply continuous bee velocity if set (e.g. held keyboard keys)
  if (nextState.bee.velocityX !== 0) {
    nextState = moveBeeByDelta(nextState, nextState.bee.velocityX * dtSec);
  }

  // 2. Move active falling tiles downward
  nextState = {
    ...nextState,
    tiles: nextState.tiles.map((t) =>
      t.active && t.state === 'falling'
        ? { ...t, y: t.y + t.speedPctPerSec * dtSec }
        : t
    )
  };

  // 3. Check collisions between bee and falling tiles
  for (const tile of nextState.tiles) {
    if (!tile.active || nextState.screen !== 'playing') continue;
    if (checkBeeTileOverlap(nextState.bee, tile)) {
      const result = handleTileCollision(nextState, tile.id);
      nextState = result.state;
      events.push({ type: 'collision', outcome: result.outcome, tile });
      if (nextState.screen !== 'playing') {
        break;
      }
    }
  }

  // 4. Check for missed tiles that passed the bottom boundary
  if (nextState.screen === 'playing') {
    const missedTiles = nextState.tiles.filter(
      (t) => t.active && t.y >= PLAYFIELD.missThresholdY
    );
    for (const missed of missedTiles) {
      nextState = handleTileMissed(nextState, missed.id);
      events.push({ type: 'missed', tile: missed });
    }
  }

  // 5. Spawn new tile if spawn interval elapsed (or if playfield is empty and required letter needed)
  if (nextState.screen === 'playing') {
    const activeCount = nextState.tiles.filter((t) => t.active).length;
    const effectiveInterval =
      activeCount === 0
        ? Math.min(nextState.config.spawnIntervalMs, 500)
        : nextState.config.spawnIntervalMs;

    if (nextState.spawnTimerMs >= effectiveInterval) {
      nextState = {
        ... spawnNextTile(nextState, randomFn),
        spawnTimerMs: 0
      };
      events.push({ type: 'spawn' });
    }
  }

  // 6. Clean up inactive tiles to prevent memory growth
  if (nextState.tiles.some((t) => !t.active)) {
    nextState = {
      ...nextState,
      tiles: nextState.tiles.filter((t) => t.active)
    };
  }

  return { state: nextState, events };
}

/**
 * Calculates supportive, mastery-focused session stars (1 to 3 stars) and summary message.
 * Speed and obstacle hits never reduce stars (Section 11).
 */
export function getSessionSummaryReport(state) {
  const { learningMetrics, gameMetrics, difficulty, config } = state;
  const totalCompleted = learningMetrics.wordsCompleted;
  const firstAttemptCount = learningMetrics.firstAttemptCorrectCount;
  const accuracyPct =
    totalCompleted > 0 ? Math.round((firstAttemptCount / totalCompleted) * 100) : 0;

  // Supportive star calculation based on completion and spelling persistence, never speed!
  let stars = 1;
  let starReason = 'You practised your spelling patterns and helped the hive!';
  if (totalCompleted >= config.sessionLength && accuracyPct >= 80) {
    stars = 3;
    starReason =
      '3 Honeycomb Stars! You completed the full session with strong spelling accuracy!';
  } else if (totalCompleted >= Math.ceil(config.sessionLength * 0.6)) {
    stars = 2;
    starReason =
      '2 Honeycomb Stars! Great persistence completing words and learning tricky patterns!';
  }

  return {
    difficultyId: difficulty,
    difficultyName: config.name,
    difficultyTitle: config.title,
    wordsCompleted: totalCompleted,
    firstAttemptCorrectCount: firstAttemptCount,
    wordsRequiringRetryCount: learningMetrics.wordsRequiringRetryCount,
    firstAttemptAccuracyPct: accuracyPct,
    patternsPracticed: learningMetrics.patternsPracticed,
    wordsForReview: learningMetrics.wordsForReview,
    completedWordRecords: learningMetrics.completedWordRecords,
    stars,
    starReason,
    gameStats: {
      honeyScore: state.honeyScore,
      tilesCaught: gameMetrics.tilesCaught,
      correctTilesCaught: gameMetrics.correctTilesCaught,
      distractorsCaught: gameMetrics.distractorsCaught,
      laterLettersCaught: gameMetrics.laterLettersCaught,
      tilesMissed: gameMetrics.tilesMissed,
      obstacleCollisions: gameMetrics.obstacleCollisions,
      hintsUsed: gameMetrics.hintsUsed,
      audioReplays: gameMetrics.audioReplays,
      timeSpentSeconds: Math.round(gameMetrics.timeSpentMs / 1000)
    }
  };
}

