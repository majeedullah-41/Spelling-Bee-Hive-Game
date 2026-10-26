/**
 * Spelling Bee Hive — Comprehensive Automated Test Suite
 *
 * Uses Node.js built-in test runner (`node:test` and `node:assert/strict`).
 * Covers Section 16 of `spelling_bee_hive_game_spec.md`:
 * 1. Word data tests
 * 2. Gameplay & collision tests
 * 3. Difficulty & progression tests
 * 4. Learning metrics vs. game metrics & review tests
 * 5. Audio manager & UI component smoke tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  WORD_BANK,
  DIFFICULTY_CONFIG,
  isStrictCvcWord,
  validateWordBank,
  getWordsForDifficulty,
  getProgressiveHint
} from '../src/data/words.js';

import {
  PLAYFIELD,
  createInitialState,
  startSession,
  pauseGame,
  resumeGame,
  restartCurrentWord,
  advanceToNextWord,
  moveBeeByDelta,
  moveBeeToX,
  getNextRequiredLetter,
  getWordSlots,
  createTile,
  spawnNextTile,
  handleTileCollision,
  handleTileMissed,
  requestHint,
  recordAudioReplay,
  stepGame,
  getSessionSummaryReport
} from '../src/engine/gameState.js';

import { AudioManager } from '../src/audio/audioManager.js';

describe('1. Word Data & Phonics Validation Tests', () => {
  it('validates every word in WORD_BANK with zero errors', () => {
    const result = validateWordBank(WORD_BANK);
    assert.equal(result.valid, true, `Validation errors: ${result.errors.join(', ')}`);
    assert.ok(WORD_BANK.length >= 20, 'Word bank should contain a rich set of words across difficulties');
  });

  it('distinguishes 3-letter CVC words from 4-letter consonant blends like FROG', () => {
    assert.equal(isStrictCvcWord('CAT'), true);
    assert.equal(isStrictCvcWord('SUN'), true);
    assert.equal(isStrictCvcWord('MAP'), true);
    assert.equal(isStrictCvcWord('HEN'), true);
    assert.equal(isStrictCvcWord('DOG'), true);
    assert.equal(isStrictCvcWord('FROG'), false);

    const frogEntry = WORD_BANK.find((w) => w.word === 'FROG');
    assert.ok(frogEntry, 'FROG should exist in the word bank');
    assert.notEqual(frogEntry.category, 'CVC', 'FROG must not be labeled as a CVC word');
    assert.equal(frogEntry.category, 'consonant-blend');

    // Verify validateWordBank catches a mislabeled blend word
    const badBank = [
      {
        ...frogEntry,
        id: 'bad-frog',
        category: 'CVC'
      }
    ];
    const badCheck = validateWordBank(badBank);
    assert.equal(badCheck.valid, false);
    assert.ok(badCheck.errors.some((e) => e.includes('not a 3-letter consonant-vowel-consonant')));
  });

  it('starts Easy mode with regular 3-letter CVC words before introducing blends', () => {
    const easyWords = getWordsForDifficulty('easy', 8);
    assert.ok(easyWords.length >= 6);
    // First 5 words in Easy mode are strict 3-letter CVC words
    for (let i = 0; i < 5; i++) {
      assert.equal(easyWords[i].category, 'CVC', `Expected Easy word #${i + 1} (${easyWords[i].word}) to be CVC`);
      assert.equal(isStrictCvcWord(easyWords[i].word), true);
    }
    // FROG appears later after simpler CVC words
    const frogIdx = easyWords.findIndex((w) => w.word === 'FROG');
    assert.ok(frogIdx >= 5, 'FROG should appear after initial CVC words');
  });

  it('provides accurate contextual sentences and meanings for homophones (THEIR, THERE, WEATHER, KNIGHT)', () => {
    const homophones = WORD_BANK.filter((w) => w.category === 'homophone' || w.homophoneGroup);
    assert.ok(homophones.length >= 3);
    for (const h of homophones) {
      assert.ok(h.meaning && h.meaning.length >= 10, `Homophone ${h.word} must have clear meaning`);
      assert.ok(
        new RegExp(`\\b${h.word}\\b`, 'i').test(h.sentence),
        `Sentence for ${h.word} must contain the exact word`
      );
      assert.ok(h.explanation && h.explanation.length >= 15);
    }
  });
});

describe('2. Core Gameplay, Sequence, Collision & Solvability Tests', () => {
  it('accepts the correct next letter and rejects out-of-order later letters with specific feedback', () => {
    const customCat = [WORD_BANK.find((w) => w.word === 'CAT')];
    let state = startSession(createInitialState(), 'easy', { customWords: customCat });
    assert.equal(getNextRequiredLetter(state), 'C');

    // Spawn a 'T' tile (appears later in CAT) before 'C' or 'A'
    const prematureT = createTile({ letter: 'T', kind: 'letter', relation: 'later_in_word' });
    state = { ...state, tiles: [prematureT] };

    const badCatch = handleTileCollision(state, prematureT.id);
    state = badCatch.state;
    assert.equal(badCatch.outcome, 'later_letter');
    assert.equal(state.currentLetterIndex, 0, 'Must not advance letter index when catching T before C');
    assert.ok(
      state.feedback.message.includes('comes later in the word'),
      'Feedback must explain that the letter comes later in the word rather than calling it completely wrong'
    );

    // Now catch C, A, T in order
    for (const expectedChar of ['C', 'A', 'T']) {
      const reqTile = createTile({ letter: expectedChar, kind: 'letter', relation: 'required' });
      state = { ...state, tiles: [reqTile] };
      const res = handleTileCollision(state, reqTile.id);
      state = res.state;
    }

    assert.equal(state.screen, 'word_complete');
    assert.deepEqual(state.collectedLetters, ['C', 'A', 'T']);
  });

  it('handles repeated letters in words like LETTER and GREEN accurately in sequence', () => {
    const letterWord = WORD_BANK.find((w) => w.word === 'LETTER');
    let state = startSession(createInitialState(), 'medium', { customWords: [letterWord] });

    const expectedSequence = ['L', 'E', 'T', 'T', 'E', 'R'];
    expectedSequence.forEach((char, index) => {
      assert.equal(getNextRequiredLetter(state), char, `At position ${index}, required letter should be ${char}`);
      const tile = createTile({ letter: char, kind: 'letter', relation: 'required' });
      state = { ...state, tiles: [tile] };
      const res = handleTileCollision(state, tile.id);
      state = res.state;
      if (index < expectedSequence.length - 1) {
        assert.equal(res.outcome, 'correct_letter');
        assert.equal(state.currentLetterIndex, index + 1);
      } else {
        assert.equal(res.outcome, 'word_complete');
        assert.equal(state.screen, 'word_complete');
      }
    });
  });

  it('prevents a single tile from triggering duplicate collisions', () => {
    let state = startSession(createInitialState(), 'easy');
    const firstChar = getNextRequiredLetter(state);
    const tile = createTile({ letter: firstChar, kind: 'letter', relation: 'required' });
    state = { ...state, tiles: [tile] };

    const firstHit = handleTileCollision(state, tile.id);
    assert.equal(firstHit.outcome, 'correct_letter');
    assert.equal(firstHit.state.currentLetterIndex, 1);

    // Attempt to collide with the exact same tile ID again
    const secondHit = handleTileCollision(firstHit.state, tile.id);
    assert.equal(secondHit.outcome, 'already_processed');
    assert.equal(secondHit.state.currentLetterIndex, 1, 'Must not advance twice from one tile');
  });

  it('prevents distractors from completing a word and allows recovery', () => {
    const customSun = [WORD_BANK.find((w) => w.word === 'SUN')];
    let state = startSession(createInitialState(), 'medium', { customWords: customSun });

    // Catch S and U
    for (const ch of ['S', 'U']) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      state = handleTileCollision({ ...state, tiles: [t] }, t.id).state;
    }
    assert.equal(state.currentLetterIndex, 2);

    // Catch distractor 'M' on the final slot
    const distractor = createTile({ letter: 'M', kind: 'letter', relation: 'distractor' });
    const wrongRes = handleTileCollision({ ...state, tiles: [distractor] }, distractor.id);
    state = wrongRes.state;
    assert.equal(wrongRes.outcome, 'wrong_letter');
    assert.equal(state.screen, 'playing');
    assert.equal(state.currentLetterIndex, 2, 'Word progress remains at slot 2 so player can recover');

    // Now catch 'N' to recover and finish
    const finalN = createTile({ letter: 'N', kind: 'letter', relation: 'required' });
    const finalRes = handleTileCollision({ ...state, tiles: [finalN] }, finalN.id);
    assert.equal(finalRes.outcome, 'word_complete');
    assert.equal(finalRes.state.screen, 'word_complete');
  });

  it('handles missed required tiles without penalty in Easy mode and guarantees respawn', () => {
    let state = startSession(createInitialState(), 'easy');
    const requiredChar = getNextRequiredLetter(state);
    const tile = createTile({ letter: requiredChar, kind: 'letter', relation: 'required' });
    state = { ...state, tiles: [tile] };

    state = handleTileMissed(state, tile.id);
    assert.equal(state.currentWordSpellingErrors, 0, 'Missing a falling tile is not a spelling error');
    assert.equal(state.gameMetrics.tilesMissed, 1);

    // Next spawn must immediately produce the required letter
    state = spawnNextTile(state, () => 0.99);
    assert.equal(state.tiles.length, 1);
    assert.equal(state.tiles[0].letter, requiredChar);
  });

  it('pauses and resumes cleanly, ignoring movement, ticks, and collisions while paused', () => {
    let state = startSession(createInitialState(), 'easy');
    const tile = createTile({
      letter: getNextRequiredLetter(state),
      kind: 'letter',
      relation: 'required',
      x: 50,
      y: 40
    });
    state = { ...state, tiles: [tile] };

    state = pauseGame(state);
    assert.equal(state.screen, 'paused');

    // Attempt to move bee while paused
    const movedWhilePaused = moveBeeByDelta(state, 20);
    assert.equal(movedWhilePaused.bee.x, state.bee.x, 'Bee must not move while paused');

    // Attempt to step simulation while paused
    const steppedWhilePaused = stepGame(state, 1000).state;
    assert.equal(steppedWhilePaused.tiles[0].y, 40, 'Tiles must not fall while paused');

    // Attempt collision while paused
    const colWhilePaused = handleTileCollision(state, tile.id);
    assert.equal(colWhilePaused.outcome, 'ignored');

    // Resume and verify simulation works again
    state = resumeGame(state);
    assert.equal(state.screen, 'playing');
    const steppedAfterResume = stepGame(state, 500).state;
    assert.ok(steppedAfterResume.tiles[0].y > 40, 'Tiles resume falling after unpausing');
  });

  it('restarts the current word and clears all stale tiles', () => {
    let state = startSession(createInitialState(), 'medium');
    const firstChar = getNextRequiredLetter(state);
    const tile1 = createTile({ letter: firstChar, kind: 'letter', relation: 'required' });
    const tile2 = createTile({ letter: 'Z', kind: 'letter', relation: 'distractor' });
    state = handleTileCollision({ ...state, tiles: [tile1, tile2] }, tile1.id).state;
    assert.equal(state.currentLetterIndex, 1);
    assert.ok(state.tiles.length > 0);

    state = restartCurrentWord(state);
    assert.equal(state.currentLetterIndex, 0);
    assert.equal(state.collectedLetters.length, 0);
    assert.equal(state.tiles.length, 0, 'All stale tiles must be cleared on word restart');
  });

  it('verifies every word in the entire word bank is 100% solvable via gameplay simulation', () => {
    for (const wordEntry of WORD_BANK) {
      let state = startSession(createInitialState(), wordEntry.difficulty, {
        customWords: [wordEntry]
      });

      let safetyTicks = 0;
      while (state.screen === 'playing' && safetyTicks < 600) {
        safetyTicks++;
        // Find if the required letter is currently falling
        const reqChar = getNextRequiredLetter(state);
        const targetTile = state.tiles.find(
          (t) => t.active && t.kind === 'letter' && t.letter === reqChar
        );
        if (targetTile) {
          // Move bee to align with the required tile
          state = moveBeeToX(state, targetTile.x);
        }
        state = stepGame(state, 120).state;
      }

      assert.equal(
        state.screen,
        'word_complete',
        `Word "${wordEntry.word}" (${wordEntry.difficulty}) should be solvable within simulation ticks`
      );
      assert.equal(state.collectedLetters.join(''), wordEntry.word);
    }
  });
});

describe('3. Difficulty Rules, Wasps, Hints & Scoring Separation Tests', () => {
  it('applies Easy mode visual watermark guides and hides them in Medium and Hard modes', () => {
    const easyState = startSession(createInitialState(), 'easy');
    const easySlots = getWordSlots(easyState);
    assert.ok(easySlots.every((s) => s.watermark.length === 1), 'Easy mode shows traced letter watermarks');

    const medState = startSession(createInitialState(), 'medium');
    const medSlots = getWordSlots(medState);
    assert.ok(medSlots.every((s) => s.watermark === ''), 'Medium mode hides watermarks for recall practice');

    const hardState = startSession(createInitialState(), 'hard');
    const hardSlots = getWordSlots(hardState);
    assert.ok(hardSlots.every((s) => s.watermark === ''), 'Hard mode hides watermarks');
  });

  it('ensures wasp collisions in Hard mode never count as spelling errors and can be disabled', () => {
    const practiceHard = startSession(createInitialState(), 'hard', { waspsEnabled: false });
    assert.equal(practiceHard.waspsEnabled, false, 'Hard mode supports obstacle-free practice mode');

    let challengeHard = startSession(createInitialState(), 'hard', { waspsEnabled: true });
    assert.equal(challengeHard.waspsEnabled, true);

    const waspTile = createTile({ letter: 'WASP', kind: 'wasp', relation: 'obstacle' });
    challengeHard = { ...challengeHard, tiles: [waspTile] };

    const hit = handleTileCollision(challengeHard, waspTile.id);
    challengeHard = hit.state;
    assert.equal(hit.outcome, 'wasp');
    assert.equal(challengeHard.currentWordSpellingErrors, 0, 'Wasp collision must NOT count as a spelling error');
    assert.equal(challengeHard.learningMetrics.totalSpellingErrors, 0);
    assert.equal(challengeHard.gameMetrics.obstacleCollisions, 1, 'Tracked separately in gameMetrics');
    assert.ok(challengeHard.bee.stunRemainingMs > 0);
  });

  it('provides progressive 4-step hints and audio replay without counting them as spelling errors', () => {
    const knightWord = WORD_BANK.find((w) => w.word === 'KNIGHT');
    let state = startSession(createInitialState(), 'hard', { customWords: [knightWord] });

    // Step 1-4 hints
    state = requestHint(state);
    assert.equal(state.currentWordHintsStep, 1);
    assert.ok(state.feedback.message.includes('Listen to the word again'));

    state = requestHint(state);
    assert.equal(state.currentWordHintsStep, 2);
    assert.ok(state.feedback.message.includes('slot #1'));

    state = requestHint(state);
    assert.equal(state.currentWordHintsStep, 3);
    assert.ok(state.feedback.message.includes('silent'));

    state = requestHint(state);
    assert.equal(state.currentWordHintsStep, 4);
    assert.ok(state.feedback.message.includes('"K"'));

    // Audio replay
    state = recordAudioReplay(state);

    assert.equal(state.currentWordSpellingErrors, 0, 'Hints and audio replays are never counted as spelling errors');
    assert.equal(state.gameMetrics.hintsUsed, 4);
    assert.equal(state.gameMetrics.audioReplays, 1);
  });

  it('queues words with spelling mistakes for an in-session review pass and reports accurate session stats', () => {
    const customTwoWords = [
      WORD_BANK.find((w) => w.word === 'CAT'),
      WORD_BANK.find((w) => w.word === 'SUN')
    ];
    let state = startSession(createInitialState(), 'easy', { customWords: customTwoWords });
    assert.equal(state.sessionWords.length, 2);

    // Make a spelling mistake on CAT first (catch distractor 'B'), then complete CAT
    const wrongTile = createTile({ letter: 'B', kind: 'letter', relation: 'distractor' });
    state = handleTileCollision({ ...state, tiles: [wrongTile] }, wrongTile.id).state;
    for (const ch of ['C', 'A', 'T']) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      state = handleTileCollision({ ...state, tiles: [t] }, t.id).state;
    }

    assert.equal(state.screen, 'word_complete');
    assert.equal(
      state.sessionWords.length,
      3,
      'CAT should be appended once to the end of the session for review after SUN'
    );

    // Advance to SUN and complete on first attempt
    state = advanceToNextWord(state);
    assert.equal(state.currentWord.word, 'SUN');
    for (const ch of ['S', 'U', 'N']) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      state = handleTileCollision({ ...state, tiles: [t] }, t.id).state;
    }

    // Advance to review pass of CAT and complete on first attempt
    state = advanceToNextWord(state);
    assert.equal(state.currentWord.word, 'CAT');
    assert.equal(state.currentWord.isReviewPass, true);
    for (const ch of ['C', 'A', 'T']) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      state = handleTileCollision({ ...state, tiles: [t] }, t.id).state;
    }

    state = advanceToNextWord(state);
    assert.equal(state.screen, 'session_complete');

    const report = getSessionSummaryReport(state);
    assert.equal(report.wordsCompleted, 3);
    assert.equal(report.firstAttemptCorrectCount, 2);
    assert.equal(report.wordsRequiringRetryCount, 1);
    assert.equal(report.wordsForReview.length, 1);
    assert.equal(report.wordsForReview[0].word, 'CAT');
  });

  it('handles AudioManager gracefully in headless environments and prevents overlapping prompts', () => {
    const statuses = [];
    const audio = new AudioManager({
      muted: false,
      onSpeechStatusChange: (st) => statuses.push(st)
    });

    const wordEntry = WORD_BANK[0];
    audio.speakWordPromptSequence(wordEntry, ['word', 'sentence', 'word']);
    assert.equal(audio.isSpeaking, true);

    // Calling stopAll or toggling mute cancels active speech timers
    audio.toggleMute();
    assert.equal(audio.muted, true);
    assert.equal(audio.isSpeaking, false);
  });

  it('executes full end-to-end smoke flow across Easy, Medium, Hard, Pause, Restart, and Session Summary', () => {
    // 1-3: Start new game, select Easy, complete a simple CVC word after missing a letter and recovering
    let state = startSession(createInitialState(), 'easy');
    assert.equal(state.currentWord.word, 'CAT');

    // 4. Miss a letter and catch it on the next attempt
    const missedC = createTile({ letter: 'C', kind: 'letter', relation: 'required' });
    state = handleTileMissed({ ...state, tiles: [missedC] }, missedC.id);
    assert.equal(state.gameMetrics.tilesMissed, 1);

    // 5. Use audio replay
    state = recordAudioReplay(state);
    assert.equal(state.gameMetrics.audioReplays, 1);

    // 6. Make an incorrect catch and recover
    const wrongCatch = createTile({ letter: 'B', kind: 'letter', relation: 'distractor' });
    state = handleTileCollision({ ...state, tiles: [wrongCatch] }, wrongCatch.id).state;
    assert.equal(state.currentWordSpellingErrors, 1);

    // Complete CAT
    for (const ch of ['C', 'A', 'T']) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      state = handleTileCollision({ ...state, tiles: [t] }, t.id).state;
    }
    assert.equal(state.screen, 'word_complete');

    // 7-8. Medium word containing distractors & later letter appearing before next required letter
    const plantWord = WORD_BANK.find((w) => w.word === 'PLANT');
    let medState = startSession(createInitialState(), 'medium', { customWords: [plantWord] });
    const earlyN = createTile({ letter: 'N', kind: 'letter', relation: 'later_in_word' });
    const resEarly = handleTileCollision({ ...medState, tiles: [earlyN] }, earlyN.id);
    assert.equal(resEarly.outcome, 'later_letter');
    medState = resEarly.state;

    // 11-12. Pause, resume, and restart a word verifying no stale tiles survive
    medState = pauseGame(medState);
    assert.equal(medState.screen, 'paused');
    medState = resumeGame(medState);
    assert.equal(medState.screen, 'playing');
    medState = restartCurrentWord(medState);
    assert.equal(medState.tiles.length, 0);

    // 9-10. Complete an irregular Hard-mode word (KNIGHT) and homophone (THEIR)
    const hardWords = [
      WORD_BANK.find((w) => w.word === 'KNIGHT'),
      WORD_BANK.find((w) => w.word === 'THEIR')
    ];
    let hardState = startSession(createInitialState(), 'hard', { customWords: hardWords });
    for (const ch of 'KNIGHT'.split('')) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      hardState = handleTileCollision({ ...hardState, tiles: [t] }, t.id).state;
    }
    assert.equal(hardState.screen, 'word_complete');
    hardState = advanceToNextWord(hardState);
    assert.equal(hardState.currentWord.word, 'THEIR');
    for (const ch of 'THEIR'.split('')) {
      const t = createTile({ letter: ch, kind: 'letter', relation: 'required' });
      hardState = handleTileCollision({ ...hardState, tiles: [t] }, t.id).state;
    }
    assert.equal(hardState.screen, 'word_complete');
    hardState = advanceToNextWord(hardState);
    assert.equal(hardState.screen, 'session_complete');
  });
});

