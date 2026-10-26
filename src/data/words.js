/**
 * Spelling Bee Hive — Word Bank & Difficulty Configuration
 *
 * Designed for Habit Builder School (recommended grade band: Grades 1–5 / Ages 6–11;
 * flagged as configurable if a specific school curriculum standard is confirmed).
 *
 * Keeps word content and difficulty rules completely separate from gameplay logic.
 */

export const CURRICULUM_METADATA = {
  targetAudience: 'Habit Builder School students (Grades 1–5 / Ages 6–11, configurable per class level)',
  note: 'Age/grade mapping uses general primary-school phonics progression (CVC -> blends/digraphs/silent-e -> multisyllabic/irregular/homophones). Confirm with school curriculum lead if aligning to a specific regional standard.'
};

export const DIFFICULTY_CONFIG = {
  easy: {
    id: 'easy',
    name: 'Easy',
    title: 'The Nectar Gatherer',
    subtitle: 'For learning simple spelling patterns',
    description:
      'Start with three-letter CVC words and gentle four-letter blends. Includes traced letter guides, spoken word + sentence + word audio, one required letter at a time, and zero penalties for missed tiles.',
    sessionLength: 5,
    fallSpeedPxPerSec: 88,
    spawnIntervalMs: 1650,
    maxSimultaneousTiles: 2,
    distractorRatio: 0, // No distractors initially; gentle introduction only on later words if enabled
    progressiveDistractorStartWordIndex: 3,
    progressiveDistractorRatio: 0.25,
    allowEarlyLaterLetters: false,
    showSlotWatermark: true,
    highlightNextSlot: true,
    autoSpeakSequence: ['word', 'sentence', 'word'],
    idleAutoReplayMs: 14000,
    missPenalty: 0,
    wrongCatchPenalty: 0,
    enableWaspsByDefault: false,
    allowWaspsToggle: false,
    waspSpawnChance: 0
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    title: 'The Worker Bee',
    subtitle: 'For practising blends, digraphs, and more complex words',
    description:
      'Practise consonant blends, digraphs (sh, ch, wh), silent-e words, and vowel teams. Blank slots encourage recall, with smart distractors and helpful hints when needed.',
    sessionLength: 6,
    fallSpeedPxPerSec: 120,
    spawnIntervalMs: 1300,
    maxSimultaneousTiles: 3,
    distractorRatio: 0.35,
    progressiveDistractorStartWordIndex: 2,
    progressiveDistractorRatio: 0.5,
    allowEarlyLaterLetters: true,
    showSlotWatermark: false,
    highlightNextSlot: true,
    autoSpeakSequence: ['word', 'sentence'],
    idleAutoReplayMs: 0,
    missPenalty: 0,
    wrongCatchPenalty: 5,
    enableWaspsByDefault: false,
    allowWaspsToggle: false,
    waspSpawnChance: 0
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    title: "The Queen's Challenge",
    subtitle: 'For advanced spelling patterns and longer words',
    description:
      'Master silent letters, multisyllabic words, and context-based homophones. Multiple letter tiles fall simultaneously with optional wasp obstacles that can be toggled on or off.',
    sessionLength: 6,
    fallSpeedPxPerSec: 142,
    spawnIntervalMs: 1050,
    maxSimultaneousTiles: 4,
    distractorRatio: 0.5,
    progressiveDistractorStartWordIndex: 1,
    progressiveDistractorRatio: 0.6,
    allowEarlyLaterLetters: true,
    showSlotWatermark: false,
    highlightNextSlot: true,
    autoSpeakSequence: ['word', 'sentence'],
    idleAutoReplayMs: 0,
    missPenalty: 0,
    wrongCatchPenalty: 10,
    enableWaspsByDefault: true,
    allowWaspsToggle: true,
    waspSpawnChance: 0.16
  }
};

/**
 * Structured word bank.
 * Notice that 3-letter CVC words are strictly consonant-vowel-consonant,
 * whereas 4-letter words like FROG or DRUM are classified accurately as 'consonant-blend'
 * and placed after simpler CVC words in progressionOrder.
 */
export const WORD_BANK = [
  // ==========================================
  // EASY — The Nectar Gatherer
  // ==========================================
  {
    id: 'easy-cat',
    word: 'CAT',
    difficulty: 'easy',
    progressionOrder: 1,
    category: 'CVC',
    pattern: 'Short-a CVC pattern (C-A-T)',
    pronunciation: 'kat',
    sentence: 'The friendly cat slept in the warm garden sun.',
    meaning: 'A small furry pet that purrs and catches mice.',
    explanation: 'CAT is a three-letter CVC word: C (consonant), A (short vowel sound), and T (consonant).',
    distractorPool: ['B', 'M', 'P', 'O'],
    gradeBand: 'Grade 1'
  },
  {
    id: 'easy-sun',
    word: 'SUN',
    difficulty: 'easy',
    progressionOrder: 2,
    category: 'CVC',
    pattern: 'Short-u CVC pattern (S-U-N)',
    pronunciation: 'suhn',
    sentence: 'The bright sun helps the garden flowers grow.',
    meaning: 'The star that gives Earth light and warmth during the day.',
    explanation: 'SUN uses the short U sound in the middle between the consonants S and N.',
    distractorPool: ['M', 'R', 'A', 'T'],
    gradeBand: 'Grade 1'
  },
  {
    id: 'easy-map',
    word: 'MAP',
    difficulty: 'easy',
    progressionOrder: 3,
    category: 'CVC',
    pattern: 'Short-a CVC pattern (M-A-P)',
    pronunciation: 'map',
    sentence: 'The little bee used a map to find the flower patch.',
    meaning: 'A drawing that shows where places, roads, or paths are.',
    explanation: 'MAP follows the consonant-vowel-consonant pattern with a short A in the middle.',
    distractorPool: ['N', 'B', 'E', 'T'],
    gradeBand: 'Grade 1'
  },
  {
    id: 'easy-hen',
    word: 'HEN',
    difficulty: 'easy',
    progressionOrder: 4,
    category: 'CVC',
    pattern: 'Short-e CVC pattern (H-E-N)',
    pronunciation: 'hen',
    sentence: 'The brown hen walked past the wooden fence.',
    meaning: 'An adult female chicken that lays eggs.',
    explanation: 'HEN has a short E vowel sound between the consonant H and the consonant N.',
    distractorPool: ['P', 'M', 'I', 'D'],
    gradeBand: 'Grade 1'
  },
  {
    id: 'easy-dog',
    word: 'DOG',
    difficulty: 'easy',
    progressionOrder: 5,
    category: 'CVC',
    pattern: 'Short-o CVC pattern (D-O-G)',
    pronunciation: 'dawg',
    sentence: 'The happy dog wagged its tail near the meadow.',
    meaning: 'A loyal four-legged animal kept as a pet or helper.',
    explanation: 'DOG is a CVC word with the short O vowel between D and G.',
    distractorPool: ['B', 'L', 'U', 'T'],
    gradeBand: 'Grade 1'
  },
  {
    id: 'easy-cup',
    word: 'CUP',
    difficulty: 'easy',
    progressionOrder: 6,
    category: 'CVC',
    pattern: 'Short-u CVC pattern (C-U-P)',
    pronunciation: 'kuhp',
    sentence: 'She poured warm honey tea into a small cup.',
    meaning: 'A small open container used for drinking.',
    explanation: 'CUP starts with the hard C sound, followed by short U and P.',
    distractorPool: ['T', 'O', 'B', 'N'],
    gradeBand: 'Grade 1'
  },
  {
    id: 'easy-frog',
    word: 'FROG',
    difficulty: 'easy',
    progressionOrder: 7,
    category: 'consonant-blend',
    pattern: 'Initial consonant blend FR- with short O',
    pronunciation: 'frawg',
    sentence: 'A green frog hopped onto a lily pad by the pond.',
    meaning: 'A small smooth-skinned animal that lives near water and jumps with strong back legs.',
    explanation: 'FROG is a four-letter consonant-blend word starting with F and R blended together before O and G.',
    distractorPool: ['L', 'B', 'A', 'T'],
    gradeBand: 'Grade 1-2'
  },
  {
    id: 'easy-drum',
    word: 'DRUM',
    difficulty: 'easy',
    progressionOrder: 8,
    category: 'consonant-blend',
    pattern: 'Initial consonant blend DR- with short U',
    pronunciation: 'druhm',
    sentence: 'He tapped a steady beat on the wooden drum.',
    meaning: 'A musical instrument played by striking it with hands or sticks.',
    explanation: 'DRUM begins with the two-letter consonant blend D-R, followed by short U and M.',
    distractorPool: ['B', 'O', 'N', 'P'],
    gradeBand: 'Grade 1-2'
  },

  // ==========================================
  // MEDIUM — The Worker Bee
  // ==========================================
  {
    id: 'medium-ship',
    word: 'SHIP',
    difficulty: 'medium',
    progressionOrder: 1,
    category: 'digraph',
    pattern: 'Consonant digraph SH- (two letters making one sound)',
    pronunciation: 'ship',
    sentence: 'The tall wooden ship sailed across the calm blue sea.',
    meaning: 'A large boat that travels across the ocean.',
    explanation: 'The letters S and H work together as a digraph (SH) to make a single "shh" sound.',
    distractorPool: ['C', 'T', 'E', 'B', 'M'],
    gradeBand: 'Grade 2'
  },
  {
    id: 'medium-plant',
    word: 'PLANT',
    difficulty: 'medium',
    progressionOrder: 2,
    category: 'consonant-blend',
    pattern: 'Initial blend PL- and final blend -NT',
    pronunciation: 'plant',
    sentence: 'Bees visit every flowering plant in the school garden.',
    meaning: 'A living green thing that grows in soil with roots, stems, and leaves.',
    explanation: 'PLANT has a consonant blend at the beginning (PL) and another blend at the end (NT).',
    distractorPool: ['R', 'E', 'D', 'M', 'S'],
    gradeBand: 'Grade 2'
  },
  {
    id: 'medium-home',
    word: 'HOME',
    difficulty: 'medium',
    progressionOrder: 3,
    category: 'silent-e',
    pattern: 'Long O with silent final E (O_E)',
    pronunciation: 'hohm',
    sentence: 'The busy bee flew back home to the golden hive.',
    meaning: 'The place where a person, family, or animal lives.',
    explanation: 'The silent E at the end of HOME makes the vowel O say its long name ("oh").',
    distractorPool: ['A', 'N', 'U', 'R', 'P'],
    gradeBand: 'Grade 2'
  },
  {
    id: 'medium-brush',
    word: 'BRUSH',
    difficulty: 'medium',
    progressionOrder: 4,
    category: 'consonant-blend',
    pattern: 'Initial blend BR- and final digraph -SH',
    pronunciation: 'bruhsh',
    sentence: 'Use a clean brush to paint the garden sign yellow.',
    meaning: 'A tool with bristles used for painting, cleaning, or grooming hair.',
    explanation: 'BRUSH combines the starting consonant blend B-R with the ending digraph S-H.',
    distractorPool: ['C', 'O', 'T', 'L', 'A'],
    gradeBand: 'Grade 2-3'
  },
  {
    id: 'medium-chair',
    word: 'CHAIR',
    difficulty: 'medium',
    progressionOrder: 5,
    category: 'digraph',
    pattern: 'Initial digraph CH- with r-controlled vowel pattern -AIR',
    pronunciation: 'chair',
    sentence: 'She pulled up a wooden chair to read her spelling book.',
    meaning: 'A piece of furniture with a back and four legs for one person to sit on.',
    explanation: 'CHAIR starts with the digraph C-H and uses the three-letter vowel pattern A-I-R.',
    distractorPool: ['S', 'E', 'O', 'T', 'L'],
    gradeBand: 'Grade 2-3'
  },
  {
    id: 'medium-plane',
    word: 'PLANE',
    difficulty: 'medium',
    progressionOrder: 6,
    category: 'silent-e',
    pattern: 'Initial blend PL- and long A with silent E (A_E)',
    pronunciation: 'playn',
    sentence: 'We watched a silver plane soar high above the clouds.',
    meaning: 'A flying vehicle with wings; short for airplane.',
    explanation: 'PLANE starts with the P-L blend, and the silent E at the end gives the A a long vowel sound.',
    distractorPool: ['I', 'M', 'T', 'R', 'O'],
    gradeBand: 'Grade 2-3'
  },
  {
    id: 'medium-green',
    word: 'GREEN',
    difficulty: 'medium',
    progressionOrder: 7,
    category: 'vowel-team',
    pattern: 'Initial blend GR- and double-E long vowel team (EE)',
    pronunciation: 'green',
    sentence: 'Soft green grass covers the sunny hillside.',
    meaning: 'The colour of fresh grass and spring leaves.',
    explanation: 'GREEN has two E letters side by side (a vowel team) that work together to make the long E sound.',
    distractorPool: ['A', 'I', 'M', 'T', 'L'],
    gradeBand: 'Grade 2'
  },
  {
    id: 'medium-letter',
    word: 'LETTER',
    difficulty: 'medium',
    progressionOrder: 8,
    category: 'double-consonant',
    pattern: 'Double medial consonant TT and -ER ending',
    pronunciation: 'let-er',
    sentence: 'Catch each falling letter in the right order to build the word.',
    meaning: 'A written symbol of the alphabet, or a message sent to someone.',
    explanation: 'LETTER has two T consonants in the middle after the short E sound, and ends with E-R.',
    distractorPool: ['A', 'D', 'N', 'S', 'O'],
    gradeBand: 'Grade 2-3'
  },

  // ==========================================
  // HARD — The Queen's Challenge
  // ==========================================
  {
    id: 'hard-knight',
    word: 'KNIGHT',
    difficulty: 'hard',
    progressionOrder: 1,
    category: 'silent-letter',
    pattern: 'Silent K in KN- and long I trigraph -IGH-',
    pronunciation: 'nyt',
    sentence: 'The brave knight wore shining armour at the castle gate.',
    meaning: 'A medieval soldier in armour who served a king or queen.',
    explanation: 'The K at the beginning is silent when followed by N, and I-G-H work together to make the long I sound.',
    homophoneGroup: 'knight/night',
    distractorPool: ['E', 'C', 'A', 'R', 'S', 'L'],
    gradeBand: 'Grade 3-4'
  },
  {
    id: 'hard-their',
    word: 'THEIR',
    difficulty: 'hard',
    progressionOrder: 2,
    category: 'homophone',
    pattern: 'Possessive homophone THEIR (E before I)',
    pronunciation: 'thair',
    sentence: 'The worker bees stored golden honey inside their hive.',
    meaning: 'Belonging to them (shows ownership).',
    explanation: 'THEIR shows ownership ("belonging to them") and is spelled with T-H-E-I-R, unlike THERE (a place).',
    homophoneGroup: 'their/there/theyre',
    distractorPool: ['A', 'Y', 'O', 'S', 'L', 'N'],
    gradeBand: 'Grade 3-4'
  },
  {
    id: 'hard-there',
    word: 'THERE',
    difficulty: 'hard',
    progressionOrder: 3,
    category: 'homophone',
    pattern: 'Place/direction homophone THERE (contains HERE)',
    pronunciation: 'thair',
    sentence: 'Look over there by the tallest sunflower in the garden!',
    meaning: 'In or at that place or position.',
    explanation: 'THERE points to a place ("over there"). Remember that it has the word HERE inside it: T-H-E-R-E.',
    homophoneGroup: 'their/there/theyre',
    distractorPool: ['I', 'A', 'Y', 'O', 'S', 'N'],
    gradeBand: 'Grade 3-4'
  },
  {
    id: 'hard-island',
    word: 'ISLAND',
    difficulty: 'hard',
    progressionOrder: 4,
    category: 'silent-letter',
    pattern: 'Silent S after I (IS-LAND)',
    pronunciation: 'eye-lund',
    sentence: 'Sea birds nested on a quiet green island in the bay.',
    meaning: 'A piece of land completely surrounded by water.',
    explanation: 'ISLAND has a silent S right after the I. Think of an "is-land" surrounded by water.',
    distractorPool: ['E', 'T', 'R', 'O', 'M', 'C'],
    gradeBand: 'Grade 3-4'
  },
  {
    id: 'hard-rhythm',
    word: 'RHYTHM',
    difficulty: 'hard',
    progressionOrder: 5,
    category: 'irregular-pattern',
    pattern: 'Greek-origin RH- and Y as the only vowel letter',
    pronunciation: 'rith-uhm',
    sentence: 'The bee wings hummed with a steady musical rhythm.',
    meaning: 'A regular, repeated pattern of beats or sounds in music and poetry.',
    explanation: 'RHYTHM starts with R-H, uses Y for its vowel sound, and has T-H before the final M.',
    distractorPool: ['I', 'E', 'A', 'U', 'S', 'N'],
    gradeBand: 'Grade 4-5'
  },
  {
    id: 'hard-weather',
    word: 'WEATHER',
    difficulty: 'hard',
    progressionOrder: 6,
    category: 'homophone',
    pattern: 'Short-E vowel team EA in WEATHER (sun, rain, and wind)',
    pronunciation: 'weth-er',
    sentence: 'Warm sunny weather helps the bees gather nectar all afternoon.',
    meaning: 'The state of the sky and air outside, such as sunshine, wind, or rain.',
    explanation: 'WEATHER (sunshine or rain) uses E-A for the short E sound, followed by T-H-E-R.',
    homophoneGroup: 'weather/whether',
    distractorPool: ['I', 'O', 'U', 'S', 'N', 'L'],
    gradeBand: 'Grade 4'
  },
  {
    id: 'hard-beautiful',
    word: 'BEAUTIFUL',
    difficulty: 'hard',
    progressionOrder: 7,
    category: 'multisyllabic',
    pattern: 'Trigraph EAU (B-E-A-U) + TI + FUL suffix',
    pronunciation: 'byoo-tih-ful',
    sentence: 'Colorful wildflowers made a beautiful border along the garden path.',
    meaning: 'Very pleasing and delightful to see or hear.',
    explanation: 'BEAUTIFUL has three syllables: BEAU (spelled B-E-A-U), TI, and the suffix FUL (with one L).',
    distractorPool: ['O', 'Y', 'S', 'R', 'N', 'C'],
    gradeBand: 'Grade 4-5'
  },
  {
    id: 'hard-knowledge',
    word: 'KNOWLEDGE',
    difficulty: 'hard',
    progressionOrder: 8,
    category: 'multisyllabic',
    pattern: 'Silent K in KN- and -DGE trigraph for the /j/ sound',
    pronunciation: 'nawl-ij',
    sentence: 'Reading every day builds strong word knowledge.',
    meaning: 'Understanding and skills gained through learning and experience.',
    explanation: 'KNOWLEDGE starts with KNOW (silent K) and ends with L-E-D-G-E, where D-G-E makes the soft J sound.',
    distractorPool: ['A', 'T', 'R', 'S', 'I', 'C'],
    gradeBand: 'Grade 4-5'
  }
];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Checks whether a word strictly follows a 3-letter Consonant-Vowel-Consonant pattern.
 */
export function isStrictCvcWord(word) {
  if (typeof word !== 'string' || word.length !== 3) return false;
  const upper = word.toUpperCase();
  return !VOWELS.has(upper[0]) && VOWELS.has(upper[1]) && !VOWELS.has(upper[2]);
}

/**
 * Validates the word bank against all educational & technical rules in Section 9 & 16.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateWordBank(words = WORD_BANK) {
  const errors = [];
  const seenIds = new Set();

  if (!Array.isArray(words) || words.length === 0) {
    return { valid: false, errors: ['Word bank must be a non-empty array.'] };
  }

  for (const entry of words) {
    if (!entry.id || typeof entry.id !== 'string') {
      errors.push(`Missing valid id for word entry: ${JSON.stringify(entry)}`);
    } else if (seenIds.has(entry.id)) {
      errors.push(`Duplicate word id: ${entry.id}`);
    } else {
      seenIds.add(entry.id);
    }

    if (!entry.word || typeof entry.word !== 'string' || !/^[A-Z]+$/.test(entry.word)) {
      errors.push(`Word "${entry.word}" (${entry.id}) must be uppercase A-Z letters only.`);
    }

    if (!['easy', 'medium', 'hard'].includes(entry.difficulty)) {
      errors.push(`Word "${entry.word}" has invalid difficulty "${entry.difficulty}".`);
    }

    if (!entry.category || typeof entry.category !== 'string') {
      errors.push(`Word "${entry.word}" is missing a spelling category.`);
    }

    // Rule: Do not label a blend word (such as FROG) as CVC.
    if (entry.category === 'CVC' && !isStrictCvcWord(entry.word)) {
      errors.push(`Word "${entry.word}" is labeled CVC, but it is not a 3-letter consonant-vowel-consonant word.`);
    }

    if (!entry.pattern || typeof entry.pattern !== 'string' || entry.pattern.trim().length < 5) {
      errors.push(`Word "${entry.word}" is missing a valid spelling pattern description.`);
    }

    if (!entry.explanation || typeof entry.explanation !== 'string' || entry.explanation.trim().length < 15) {
      errors.push(`Word "${entry.word}" is missing a meaningful teaching explanation.`);
    }

    if (!entry.sentence || typeof entry.sentence !== 'string') {
      errors.push(`Word "${entry.word}" is missing an example sentence.`);
    } else {
      const regex = new RegExp(`\\b${entry.word}\\b`, 'i');
      if (!regex.test(entry.sentence)) {
        errors.push(`Sentence for "${entry.word}" does not contain the exact target word: "${entry.sentence}"`);
      }
    }

    // Homophones must establish intended meaning via sentence & meaning
    if (entry.category === 'homophone' || entry.homophoneGroup) {
      if (!entry.meaning || entry.meaning.trim().length < 8) {
        errors.push(`Homophone "${entry.word}" must include a clear meaning to disambiguate context.`);
      }
      if (!entry.homophoneGroup) {
        errors.push(`Homophone "${entry.word}" must specify a homophoneGroup.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Returns words for a given difficulty ordered by progressionOrder.
 * Ensures Easy mode starts with 3-letter CVC words before introducing 4-letter blends.
 */
export function getWordsForDifficulty(difficulty, count) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
  const limit = count ?? config.sessionLength;
  const filtered = WORD_BANK.filter((w) => w.difficulty === config.id).sort(
    (a, b) => (a.progressionOrder ?? 99) - (b.progressionOrder ?? 99)
  );
  return filtered.slice(0, limit);
}

/**
 * Generates progressive, word-specific hints based on the active word and current letter index (0-based).
 * Follows Section 12:
 * Level 1: Listen to the word again + meaning clue.
 * Level 2: Direct attention to the next empty slot position.
 * Level 3: Clue about the relevant spelling pattern or homophone meaning.
 * Level 4: Direct letter clue for the exact current slot so the student never stays stuck.
 */
export function getProgressiveHint(wordEntry, currentLetterIndex, hintStep = 1) {
  if (!wordEntry || !wordEntry.word) {
    return 'Listen to the word again and look at the next empty slot.';
  }
  const slotNumber = Math.min(currentLetterIndex + 1, wordEntry.word.length);
  const nextLetter = wordEntry.word[currentLetterIndex] || wordEntry.word[0];
  const step = Math.max(1, Math.min(4, hintStep));

  if (step === 1) {
    return `Listen to the word again. Meaning clue: ${wordEntry.meaning || wordEntry.sentence}`;
  }

  if (step === 2) {
    const positionDesc =
      slotNumber === 1
        ? 'the very first slot (slot #1)'
        : slotNumber === wordEntry.word.length
        ? `the final slot (slot #${slotNumber})`
        : `slot #${slotNumber} of ${wordEntry.word.length}`;
    return `Look at ${positionDesc} in the word bar. Sound out the word up to that spot.`;
  }

  if (step === 3) {
    if (wordEntry.word === 'KNIGHT') {
      return 'Pattern clue: The K at the beginning is silent, and I-G-H makes the long I sound.';
    }
    if (wordEntry.category === 'homophone') {
      return `Homophone clue: "${wordEntry.sentence}" — ${wordEntry.explanation}`;
    }
    return `Pattern clue (${wordEntry.pattern}): ${wordEntry.explanation}`;
  }

  return `Direct clue: The next letter you need for slot #${slotNumber} is "${nextLetter}". Catch the "${nextLetter}" tile!`;
}
