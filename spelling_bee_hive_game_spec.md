# Spelling Bee Hive
## Complete Game Development Specification for AI Coding Agent

**Project:** Spelling Bee Hive  
**Purpose:** Educational spelling game for Habit Builder School  
**Primary objective:** Help school-age students learn spelling patterns, recognize letters in sequence, understand word meanings, and remember correct spellings through interactive gameplay.

---

# 1. Project Mission

Build a complete, polished, child-friendly spelling game called **Spelling Bee Hive**.

The player controls a friendly bee flying through a garden and catching falling letter tiles to spell a target word. The game combines listening, spelling, visual recognition, word knowledge, and progressively challenging gameplay.

The game must be both enjoyable and educational.

Do not create a game that merely tests reaction speed. Every major mechanic must support the learning objective or remain an optional challenge.

If an existing project or prototype is available, inspect and improve it rather than rebuilding it unnecessarily. If the repository is empty, establish a simple architecture appropriate to the existing technology and project instructions.

# 2. Non-Negotiable Requirements

1. Preserve the bee, honeycomb, flowers, nectar, and garden theme.
2. Implement a complete playable game, not just UI mockups.
3. Include Easy, Medium, and Hard difficulty levels.
4. Use real word data and consistent spelling rules.
5. Include working bee movement, falling tiles, collision detection, scoring, feedback, audio controls, and level progression.
6. Ensure every level is solvable.
7. Do not increase difficulty solely by making everything faster.
8. Keep mistakes educational and recoverable.
9. Do not add accounts, a backend, advertisements, analytics services, or unnecessary dependencies.
10. Use the project's existing framework, conventions, and dependencies whenever possible.
11. Keep the game responsive and suitable for the intended age group.
12. Test the actual game logic, not only whether the interface renders.
13. Do not claim that a feature or test works unless it has been implemented or tested.
14. Do not add features outside this specification without a clear educational or technical reason.

# 3. Initial Repository Inspection

Before implementation, inspect:

- Project instructions and architecture.
- Framework, dependencies, and available scripts.
- Existing game screens and visual assets.
- Bee movement and keyboard/touch controls.
- Tile generation and collision detection.
- Word bank and difficulty configuration.
- Audio playback and replay controls.
- Scoring and progress tracking.
- Existing tests and build tools.

Prepare a short implementation plan based on the actual codebase.

If the repository already contains a working game, preserve its functional components and make incremental changes. Avoid replacing working systems simply because a new implementation would be easier to write.

# 4. Game Concept

## Story

The garden needs help collecting letters to build words and fill the hive with honey.

A friendly bee receives a target word. Letter tiles fall from the sky, and the player moves the bee to collect the letters in the correct spelling sequence.

Correct letters help the bee complete the word. Incorrect catches provide feedback and an opportunity to try again.

As students progress, they encounter more advanced spelling patterns, carefully introduced distractors, and optional challenge mechanics.

## Main gameplay loop

1. The player selects a difficulty.
2. The game presents a target word.
3. The player listens to the word and, where appropriate, its sentence.
4. Letter tiles begin falling.
5. The player moves the bee to catch the next required letter.
6. The game provides feedback for correct and incorrect actions.
7. Once the word is complete, the game displays the correct spelling and a short learning note.
8. The player continues to the next word or returns to the level selection screen.
9. At the end of a session, the player sees a summary of performance and learning progress.

# 5. Required Screens

## 5.1 Welcome screen

Create an attractive welcome screen featuring:

- Game title: **Spelling Bee Hive**.
- Friendly bee character.
- Honeycomb and garden-themed background.
- Play button.
- Difficulty selection.
- Optional How to Play button.
- Sound controls, if sound settings are implemented.

Keep the screen simple. Do not overload it with multiple menus or unrelated features.

## 5.2 Difficulty selection

Display three clearly differentiated options:

**Easy — The Nectar Gatherer**

For learning simple spelling patterns.

**Medium — The Worker Bee**

For practising blends, digraphs, and more complex words.

**Hard — The Queen's Challenge**

For advanced spelling patterns and longer words.

Each option should briefly describe the challenge. Do not describe Hard mode only as faster or more punishing.

## 5.3 Gameplay screen

The gameplay screen should include:

- Target word area.
- Word progress slots.
- Bee character.
- Falling letter tiles.
- Optional distractor and obstacle tiles, depending on difficulty.
- Audio replay button.
- Current word progress.
- Session progress, such as word 3 of 10.
- Pause button.
- A clear feedback area.
- Optional hint control.

Use a clean layout that keeps the target word, bee, and falling tiles visually distinct.

Avoid unnecessary HUD elements, decorative icons that obscure gameplay, or lengthy instructions during an active round.

## 5.4 Word completion screen

When a word is completed, show:

- Positive completion message.
- Correctly spelled word.
- A short, relevant spelling explanation.
- The sentence used to establish the word's meaning, when applicable.
- A Continue button.

Example:

**Great spelling!**

**KNIGHT**

"The K at the beginning is silent. The letters K and N appear together in this word."

Only display explanations that are accurate for the actual word.

Use a brief celebration animation without delaying the student's ability to continue.

## 5.5 Session completion screen

At the end of a session, display:

- Number of words completed.
- Number of words spelled correctly on the first attempt.
- Number of words that required additional attempts.
- Relevant spelling patterns practised.
- Optional stars or achievement indicators.
- Play Again button.
- Choose Difficulty button.
- Return Home button.

Do not equate a fast session with mastery. Show spelling performance separately from reaction speed or obstacle collisions.

## 5.6 Pause screen

Include:

- Resume.
- Restart current word.
- Return to level selection.

If the game is paused, falling tiles, movement, timers, and collision processing must also pause.

# 6. Visual Design Direction

Use a polished, colourful, illustrated children's game aesthetic.

## Environment

- Bright garden with flowers, grass, and soft sky colours.
- Honeycomb motifs and honey-inspired interface accents.
- Warm yellow and amber highlights.
- Clear, high-contrast letter tiles.
- A friendly bee with expressive but restrained animations.

## Typography

- Use a playful but highly readable font.
- Keep letters large enough to identify quickly.
- Use consistent text hierarchy.
- Avoid decorative fonts for long instructional messages.

## Animation

Include subtle animations for:

- Bee movement.
- Falling tiles.
- Correct letter collection.
- Word completion.
- Honey or progress updates.
- Level transitions.

Animations should remain smooth and should never hide the target letters.

Respect reduced-motion preferences where the platform supports them.

## Visual clarity

- Correct letters and distractors must be distinguishable without relying only on colour.
- Wasp obstacles must have a recognisable shape and clear visual identity.
- Do not place important text behind tiles or animated objects.
- Ensure controls are large enough for children using touchscreens.

# 7. Core Game Mechanics

## 7.1 Bee movement

The bee must move horizontally through the playable area.

Support the input methods already appropriate to the project:

- Keyboard arrows or A/D.
- Touch controls or dragging, where suitable.
- Pointer input, if the existing architecture supports it.

Movement must be smooth and predictable.

Requirements:

- Keep the bee inside the playable boundaries.
- Prevent accidental movement outside the game area.
- Avoid sudden position jumps.
- Make collision areas match the visible character reasonably well.
- Prevent movement input from affecting menus while a game is active.
- Preserve accessible alternatives to fine pointer movement.

## 7.2 Falling letter tiles

Each tile contains a letter.

Tiles fall from the top of the play area towards the bottom.

Each tile should have data representing:

- Its letter.
- Its correct or distractor status.
- Its position.
- Its movement speed.
- Its current state.
- Its relationship to the active word, if relevant.

Do not rely on the tile's visual appearance alone to determine correctness.

Use the target word and current spelling position as the source of truth.

## 7.3 Letter sequence

The player must collect letters in the correct order.

For example, the target word is CAT.

The required sequence is:

1. C
2. A
3. T

After catching C, the next required letter becomes A. Catching T before A must not complete the word.

The game must handle repeated letters correctly. For example, a word such as LETTER contains two occurrences of T, and both must be collected in their correct positions.

If later letters appear before the current required letter, the player must be able to avoid them. The game must never force the player to collect letters out of order.

## 7.4 Collision detection

When the bee overlaps a tile, determine the result using the active game state.

Possible results:

- Correct next letter.
- Incorrect letter.
- Distractor.
- Wasp obstacle.
- Tile already collected or inactive.

Requirements:

- A single collision must not trigger duplicate events.
- A collected tile must become inactive.
- An incorrect collision must not accidentally advance the word.
- A paused or completed game must ignore gameplay collisions.
- Collision handling must be deterministic and testable.
- Resetting a word must clear or correctly deactivate old tiles.

## 7.5 Word progress

Show the target word as a row of slots.

Example:

Target: PLANT

Before any letters are collected:

_ _ _ _ _

After collecting P and L:

P L _ _ _

In Easy mode, the remaining slots may contain a lightly traced spelling guide. As students improve, remove this assistance.

The display must not accidentally reveal the entire answer in modes where spelling recall is being practised.

## 7.6 Missed tiles

If the bee fails to collect a required tile, handle the result according to the difficulty.

Easy mode should allow the letter to return or reappear without penalty.

Medium and Hard modes may introduce limited challenge pressure, but the player must always have a fair opportunity to continue.

Never create a situation in which missing one tile makes the word permanently impossible.

## 7.7 Feedback system

Display brief messages based on the actual game state.

Examples:

- Correct letter: "Nice catch!"
- Incorrect letter: "That letter comes later. Look for the next letter."
- Missed tile: "No problem. Try again when it falls."
- Completed word: "Great spelling!"
- Optional hint: "Listen to the word again and look at the empty slots."

The wording must be appropriate to the specific error.

Do not tell a student that a letter is wrong if it is actually correct but appears later in the word.

Avoid shaming messages such as "You failed" or "You are too slow."

# 8. Difficulty System

Difficulty should be controlled through configuration rather than scattered hard-coded conditions.

Keep the existing three difficulty names.

## 8.1 Easy — The Nectar Gatherer

### Word selection

Start with familiar, regular three-letter CVC words:

- CAT
- SUN
- MAP
- HEN
- DOG

A CVC word follows a consonant-vowel-consonant pattern.

FROG is a four-letter consonant-blend word, not a CVC word. Introduce it after simpler patterns.

Progress gradually to other appropriate word patterns.

### Tile behaviour

- Slow falling speed.
- One active required letter at a time.
- No distractor tiles initially.
- Clear, predictable letter order.
- Missing a tile does not reduce learning progress.
- Required letters reappear fairly.

### Visual support

- Display a lightly traced word guide inside the slots.
- Highlight the next required slot.
- Keep the guide subtle enough that it does not obscure the actual letters.

### Audio

- Speak the target word clearly.
- Give a short sentence using the word.
- Repeat the word.
- Provide a visible replay control.
- Automatic replay may be enabled gently when the player waits, provided it does not interrupt gameplay.

### Penalties

No penalty for missing a tile.

A wrong catch should produce a helpful cue and allow the student to continue.

## 8.2 Medium — The Worker Bee

### Word selection

Introduce grade-appropriate spelling patterns, such as:

- Blends: BRUSH, PLANT.
- Digraphs: SHIP, CHAIR.
- Silent-e: HOME, PLANE.
- Other taught vowel patterns.

Do not use word length as the only difficulty measure.

### Tile behaviour

- Moderate falling speed.
- A small number of distractors.
- Multiple tiles may appear, but the correct next letter must remain identifiable and catchable.
- Later letters may appear early, provided the player can avoid them.
- Gradually increase distractor complexity after successful practice.

### Visual support

Remove the target-word watermark, but keep blank slots visible.

Offer optional hints and audio replay.

### Audio

Play the word and a contextual sentence at the start.

Allow manual replay throughout the word.

### Penalties

An incorrect catch may reduce a small amount of game progress, but should not make the round futile.

Show a short explanation and allow recovery.

Do not treat a wasp collision or movement mistake as a spelling error.

## 8.3 Hard — The Queen's Challenge

### Word selection

Introduce longer words, multisyllabic words, and less predictable spelling patterns after foundational patterns have been taught.

Examples:

- KNIGHT
- RHYTHM
- BEAUTIFUL

Each word requires a specific, accurate teaching note.

For homophones such as THEIR and THERE, provide a sentence that clearly establishes the intended meaning.

### Tile behaviour

- Faster falling speed only after the student can manage the word complexity.
- Multiple simultaneous letters.
- Carefully selected distractors.
- Later letters may appear early but must not be required before their correct position.
- The next required letter must always be obtainable.

### Wasps

Wasps may be introduced as an optional advanced challenge.

Requirements:

- Clearly distinguish wasps from letters.
- Introduce the mechanic before using it in a demanding round.
- Never let a wasp make a required letter impossible to catch.
- If a collision temporarily freezes movement, do not classify the resulting missed letter as a spelling mistake.
- Provide a normal practice alternative without obstacles.

### Penalties

Avoid resetting the entire word immediately for every mistake in the standard learning mode.

Allow students to recover, receive a useful clue, and continue.

A stricter timed challenge may be implemented as an optional mode, but its score must remain separate from spelling-learning results.

# 9. Word Bank and Content Data

Keep word content separate from gameplay logic.

Use the existing data format if the project already has a suitable word bank. Otherwise, create a structured word-data module.

Each word record should support the following fields where applicable:

- Unique identifier.
- Correct spelling.
- Difficulty category.
- Spelling pattern.
- Pronunciation or audio reference.
- Example sentence.
- Meaning or child-friendly definition, when appropriate.
- Short spelling explanation.
- Optional homophone group.
- Optional grade or curriculum classification.

Do not require every field if it is irrelevant to a particular word.

## Word validation

Before adding a word, verify:

- The spelling is correct.
- Its category accurately describes the word.
- Its sentence uses the intended word and meaning.
- Its audio matches the target word.
- Its teaching note is accurate.
- Its difficulty is appropriate for the intended learner.

Do not label a blend word as CVC.

Do not assume that every written letter corresponds to one spoken sound.

Do not use a homophone without contextualising the intended meaning.

If the intended age or grade range is not specified in project documentation, flag it for confirmation rather than inventing a curriculum standard.

# 10. Audio System

Implement a reusable audio system that supports:

- Playing the target word.
- Playing the example sentence.
- Replaying the target word.
- Muting or adjusting audio if supported by the existing platform.
- Handling missing or failed audio gracefully.

Requirements:

- Audio playback must not freeze the game.
- Avoid overlapping multiple copies of the same prompt.
- Keep audio controls accessible.
- Do not automatically replay so often that it becomes distracting.
- Do not rely on audio alone to communicate essential gameplay information.
- Ensure recorded or synthesized pronunciation matches the intended word.

If audio assets already exist, reuse them.

If no audio assets exist, inspect the project's current technology before selecting a solution. Prefer a simple, maintainable approach and document any limitations in pronunciation quality.

Do not add an external speech service without a clear need and explicit project approval.

# 11. Learning and Scoring

Keep spelling performance separate from game performance.

## Learning metrics

Where the existing architecture supports tracking, record:

- Words completed correctly.
- Words requiring additional attempts.
- First-attempt spelling accuracy.
- Spelling patterns practised.
- Words that may benefit from later review.

## Game metrics

These may include:

- Tiles caught.
- Tiles missed.
- Distractors caught.
- Time spent.
- Optional obstacle collisions.

Do not mix movement errors with spelling errors.

Do not treat audio replay or hint usage as proof of poor learning.

Do not claim that a student has mastered a word merely because they caught its letters quickly.

## Stars and rewards

Use positive rewards for completion and progress.

If stars are implemented:

- Explain their purpose simply.
- Do not make speed the only criterion.
- Do not shame mistakes.
- Do not remove learning progress because a student requested help.

Avoid elaborate reward systems unless the existing design already requires them.

# 12. Hints and Teaching Feedback

Hints should help the student think rather than immediately revealing the whole word.

Use progressive guidance where suitable:

1. Ask the student to listen to the word again.
2. Direct attention to the next empty slot.
3. Offer a clue about the relevant spelling pattern.
4. Provide a more direct clue if the student remains stuck.

For an irregular word, use a specific explanation.

Example:

For KNIGHT:

"The K at the beginning is silent. Look carefully at the first two letters."

For a homophone, use the sentence meaning to guide the choice.

The hint system must be based on the active word and current spelling position.

Do not display a generic clue that contradicts the actual word.

# 13. Word Review and Retention

After a word is completed, briefly show:

- The correct spelling.
- The sentence or meaning where appropriate.
- One relevant spelling pattern.

If practical within the existing architecture, revisit previously missed words later in the session.

Do not repeatedly force the same difficult word immediately without feedback or a learning opportunity.

A future improvement may include spaced review across sessions, but do not add persistence, accounts, or a backend just to support this unless explicitly required.

# 14. Accessibility and Responsive Behaviour

The game must be usable on supported desktop and mobile viewports.

Requirements:

- Responsive gameplay layout.
- Readable letter tiles.
- Large, clear buttons.
- Keyboard controls if supported by the current platform.
- Touch controls if supported.
- Clear pause and resume behaviour.
- Reduced-motion support where available.
- Adequate contrast.
- No reliance on colour alone.
- No excessive flashing or distracting animation.
- Feedback that remains visible long enough to read.
- No interface overlap that hides letters or controls.

When paused, stop relevant movement, timers, and collision processing.

When restarting a word, clear its transient state safely.

When leaving a game, clean up active timers, animation loops, and audio playback according to the project's framework.

# 15. Technical Architecture

Follow the existing stack and repository conventions.

Separate concerns where appropriate:

- **Word data:** spelling content, categories, sentences, and learning notes.
- **Game state:** current word, collected letters, progress, and difficulty.
- **Tile system:** generation, movement, collision, and cleanup.
- **Bee controller:** movement and input.
- **Audio manager:** word and sentence playback.
- **Feedback system:** contextual messages and hints.
- **Scoring:** learning metrics and optional game metrics.
- **UI components:** welcome, selection, gameplay, pause, completion, and session summary.
- **Tests:** word validation, state transitions, tile ordering, and scoring.

These are conceptual responsibilities, not instructions to create an unnecessarily large number of files. Use the simplest architecture that fits the existing project.

Avoid duplicating state between components when one reliable source of truth is sufficient.

Do not let rendering code determine the mathematical or spelling correctness of a collision.

# 16. Testing Requirements

Use the project's existing test framework.

Do not add a new testing framework unless there is a clear technical reason.

## Word data tests

- Every word has valid spelling data.
- Difficulty labels are consistent.
- Spelling categories are accurate.
- Sentences match the intended word and meaning.
- Homophone examples establish the intended meaning.
- Teaching notes are present where required and accurate.

## Gameplay tests

- The correct next letter is accepted.
- Incorrect letters do not advance the word.
- Repeated letters are handled correctly.
- Later letters cannot be collected out of order.
- A missed tile can be retried according to the difficulty rules.
- A tile cannot trigger multiple collisions.
- Distractors cannot accidentally complete a word.
- Every valid word remains solvable.
- Pausing stops gameplay updates.
- Restarting resets the correct state.
- Completing a word advances correctly.
- Audio replay remains available.
- A wasp collision cannot create an unavoidable failure state.

## Difficulty tests

- Easy mode uses the intended visual and penalty rules.
- Medium mode introduces distractors gradually.
- Hard mode increases challenge without breaking letter order.
- Optional obstacle mechanics do not alter spelling correctness.
- Difficulty settings are applied consistently.

## Learning and scoring tests

- Spelling mistakes and movement mistakes are tracked separately.
- Hint and audio replay usage are not counted as spelling errors.
- Completed-word explanations match the actual word.
- Session statistics match the recorded results.
- Retry and progression work after both successful and unsuccessful attempts.

## Manual smoke tests

1. Start a new game.
2. Select Easy.
3. Complete a simple CVC word.
4. Miss a letter and catch it on the next attempt.
5. Use audio replay.
6. Make an incorrect catch and recover.
7. Complete a Medium word containing distractors.
8. See a later letter before the next required letter.
9. Complete an irregular Hard-mode word.
10. Test a homophone in sentence context.
11. Pause and resume.
12. Restart a word.
13. Finish a session.
14. Navigate back to difficulty selection.
15. Test supported keyboard and touch controls.
16. Test a narrow viewport.
17. Verify that no stale tiles or timers survive a reset.

# 17. Implementation Roadmap

Implement the game in the following phases.

## Phase 1 — Inspect and plan

- Read project instructions.
- Inspect existing code, assets, dependencies, and tests.
- Identify what already works.
- Determine the actual entry point and application architecture.
- Identify missing systems and risks.
- Report the planned changes briefly.

Do not replace existing functionality without a clear reason.

## Phase 2 — Core playable game

Implement or verify:

- Welcome screen.
- Difficulty selection.
- Gameplay screen.
- Bee movement.
- Falling tiles.
- Collision detection.
- Correct letter sequence.
- Word progress.
- Pause and resume.
- Word completion.
- Next-word progression.
- Restart behaviour.

At the end of this phase, the game must be genuinely playable with a small, validated word set.

## Phase 3 — Word bank and audio

- Create or validate the word data.
- Add difficulty-specific words.
- Add sentence context.
- Implement audio playback and replay.
- Add word completion explanations.
- Validate spelling patterns and content.

## Phase 4 — Difficulty and feedback

- Implement Easy-mode visual assistance.
- Introduce Medium distractors.
- Implement Hard-mode simultaneous tiles where appropriate.
- Add progressive hints.
- Add contextual feedback.
- Add optional wasps only if the core game is stable and the mechanic remains fair.

## Phase 5 — Progress and session summary

- Implement session progress.
- Add completion statistics.
- Add simple, supportive rewards.
- Separate spelling results from reaction and obstacle metrics.
- Ensure replay and progression reset the appropriate state.

## Phase 6 — Polish and accessibility

- Refine visual hierarchy.
- Verify responsive layout.
- Improve movement and collision feel.
- Check audio controls.
- Add or preserve reduced-motion behaviour.
- Remove distracting or unnecessary elements.

## Phase 7 — Testing and final verification

- Run unit tests.
- Run relevant integration tests.
- Run lint and build checks.
- Test the main game flow manually.
- Fix regressions.
- Document remaining issues accurately.

Do not stop after writing a roadmap. Implement the game in the existing repository unless a blocking ambiguity or risk makes implementation unsafe.

# 18. Definition of Done

The game is complete when:

- [ ] The welcome screen and difficulty selection work.
- [ ] The core spelling loop is playable.
- [ ] Bee movement is reliable.
- [ ] Tiles fall and collide correctly.
- [ ] Letter sequence is enforced.
- [ ] Every active word is solvable.
- [ ] Easy, Medium, and Hard have distinct, coherent rules.
- [ ] Word data and spelling categories are validated.
- [ ] Audio playback and replay work.
- [ ] Feedback is accurate and supportive.
- [ ] Word completion teaches a relevant spelling concept.
- [ ] Session progress and summary work.
- [ ] Pause, resume, restart, and progression work.
- [ ] Accessibility and responsive requirements are checked.
- [ ] Tests cover important spelling and game-state logic.
- [ ] Build and lint checks pass, or existing failures are documented.
- [ ] No unnecessary dependencies or unrelated features were added.
- [ ] The final report accurately lists changes and test results.

# 19. Final Instructions to the AI Coding Agent

Build a complete, polished, educational game using the existing project's technology and architecture.

First inspect the repository. Then implement the core game before adding optional complexity.

Prioritize:

1. Correct spelling.
2. Solvable and predictable gameplay.
3. Clear feedback and useful learning.
4. Accessible controls.
5. Gradual difficulty.
6. Visual polish.
7. Reliable testing.

Do not turn every mistake into a failure. Do not make reaction speed the main measure of spelling ability. Preserve the existing game identity and avoid unnecessary redesigns.

At completion, provide:

- A concise summary of implemented features.
- The files created or modified.
- Tests and build checks actually run.
- Actual results of those checks.
- Any important design decisions.
- Remaining bugs or deferred features.

**Never report a feature as complete unless it has been implemented and verified. Never claim a test passed unless it was actually run.**