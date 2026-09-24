const blueprints = [
  {
    category: "Logic",
    prompt:
      "A lock has four rotating dials. The first is odd, the second is one more than the first, the third is the number of letters in “four”, and the last is the sum of the first three digits. What code opens it?",
  },
  {
    category: "Math",
    prompt:
      "Four numbers are hiding in the vault. Add the first two, subtract the third, then multiply by the last. The result is 8. All four numbers are non-zero digits. Find the code.",
  },
  {
    category: "Riddle",
    prompt:
      "I have keys but never open a door. I can be made from metal, and I keep your secrets safe. I have four moving parts, but only one way to turn me. What four-digit combination is my signature?",
  },
  {
    category: "Science",
    prompt:
      "The code describes a tiny experiment. The first digit is a seed, the second is the number of legs on an insect, the third is the pH of pure water, and the fourth is the symbol count in H₂O. Assemble the digits.",
  },
  {
    category: "Trivia",
    prompt:
      "A museum displays a famous number. The first digit is the number of sides on a hexagon, the second is the year Julius Caesar was assassinated (last two digits), the third is 7, and the fourth is the number of continents. What is the code?",
  },
  {
    category: "Logic",
    prompt:
      "The four dials follow a pattern: each digit is the previous digit plus 1, except the final dial, which resets to the smallest even digit. Begin with the number of vowels in “Exotic”. What code do you see?",
  },
  {
    category: "Math",
    prompt:
      "A calculator has forgotten its four-digit PIN. The digits are in ascending order, their sum is 12, and the largest digit is twice the smallest. Solve the pattern.",
  },
  {
    category: "Riddle",
    prompt:
      "I can be short or long, sharp or soft, and I travel without moving. I live in a pocket and vanish when spoken. Count the letters in my name, then use the digits of its Scrabble value twice.",
  },
  {
    category: "Science",
    prompt:
      "Build a code from a water molecule: oxygen’s atomic number, hydrogen’s atomic number, the number of atoms in one molecule, and the number of letters in “water”.",
  },
  {
    category: "Trivia",
    prompt:
      "The vault is themed around speed. Think of the fastest land animal: take the number of letters in “cheetah”, the number of legs it uses to sprint, its rank clue (1), and the number of letters in “fast”.",
  },
  {
    category: "Logic",
    prompt:
      "Four clues are written in ink: my first digit is prime, my second is its opposite on a keypad, my third is 6, and my fourth is the number of sides of a cube. Solve the sequence.",
  },
  {
    category: "Math",
    prompt:
      "A four-digit number hides in plain sight. Its first and last digits are equal, its middle digits add to 10, and the number is divisible by 11. Find the smallest solution.",
  },
  {
    category: "Riddle",
    prompt:
      "I have a face but no eyes, hands but no arms, and a clock that never ticks. I am carried in a pocket and can tell time. Use the count of letters in “watch” for the first clue, then its two hands for the second, 12 for the third, and 1 for the last.",
  },
  {
    category: "Science",
    prompt:
      "A star is calling. Use the number of planets in our solar system, the number of legs on a spider, the boiling point of water at sea level, and the number of letters in “red”. Combine the answers.",
  },
  {
    category: "Trivia",
    prompt:
      "A curious code is hidden in a world atlas. Take the number of oceans, the number of letters in “Earth”, the number of days in a leap year, and the number of letters in “map”.",
  },
  {
    category: "Logic",
    prompt:
      "The dials are talking: “I am even, I am 4, I am the number of sides on a triangle doubled, and I am the number of letters in “four”. Who am I?” Enter the four clues in order.",
  },
  {
    category: "Math",
    prompt:
      "Start at 1 and apply four rules: double, add 2, subtract 1, then multiply by 3. The intermediate results are 2, 4, 3, and 9. These are not the code; instead, use the rule numbers 1, 2, 3, 4 to form a final check digit sequence.",
  },
  {
    category: "Riddle",
    prompt:
      "I have wings but cannot fly, eyes but cannot see, and a needle but no thread. I sit beside your bed and count the hours. Turn my name, its hands, its numbers, and its chime into four digits.",
  },
  {
    category: "Science",
    prompt:
      "A scientist leaves a recipe: one leap year, two atoms in hydrogen, three states of matter, and four seasons. The code is the sequence of those answers.",
  },
  {
    category: "Trivia",
    prompt:
      "A cinema ticket hides a code. Use the number of letters in “cinema”, the number of reels in a classic projector, the number of letters in “film”, and the number of sides on a ticket stub.",
  },
  {
    category: "Logic",
    prompt:
      "Four switches are labelled with the numbers 1, 2, 4, and 8. The lock wants the number of letters in “switch”, the number of switches, the number of vowels in “code”, and the number of directions you can turn a switch.",
  },
  {
    category: "Math",
    prompt:
      "A sequence grows by adding its digits: 7 → 14 → 55 → 131. The next step is formed by the number of steps, the sum of the first and last digits, the number of even terms, and the answer’s tens digit. What code is formed?",
  },
  {
    category: "Riddle",
    prompt:
      "I am a home for keys, I have a spine but no bones, and I am opened by a secret phrase. Count the letters in “keyring”, use its teeth count clue, the number of keys on a ring, and the number of letters in “open”. Assemble the code.",
  },
  {
    category: "Science",
    prompt:
      "A lab card reads: the SI unit of force, the number of legs on a crab, the number of bones in an adult human ear, and the number of letters in “atom”. Convert each answer to a digit.",
  },
  {
    category: "Trivia",
    prompt:
      "A music box is locked. Take the number of strings on a standard violin, the number of letters in “music”, the number of lines in a staff, and the number of beats in common time.",
  },
  {
    category: "Logic",
    prompt:
      "The code is a quiet rebellion. Its digits are the number of letters in “quiet”, the number of consonants in “rebels”, the number of letters in “secret”, and the number of words in this clue.",
  },
  {
    category: "Math",
    prompt:
      "A chessboard is the key. Use the number of squares on one edge, the number of pieces at the start, the number of letters in “check”, and the number of columns in a standard board.",
  },
  {
    category: "Riddle",
    prompt:
      "I have a spine, a cover, and thousands of stories. I can be opened, closed, and read, but I never move. Use the count of letters in “book”, the number of covers, the number of sides on a page, and the number of letters in “read”.",
  },
  {
    category: "Science",
    prompt:
      "A weather station requests four readings: the number of legs on a tripod, the boiling point of water in Celsius at sea level, the number of letters in “cloud”, and the number of directions in a compass rose.",
  },
  {
    category: "Trivia",
    prompt:
      "A board game is the final clue. Take the number of colors in a rainbow, the number of letters in “chess”, the number of squares in a chessboard’s home row, and the number of letters in “play”.",
  },
];

export const PUZZLE_PROMPTS = Object.fromEntries(
  blueprints.map((blueprint, index) => [
    String(index + 1).padStart(2, "0"),
    blueprint.prompt,
  ]),
);

export const WORD_PUZZLES = {
  3: {
    answer: "key",
    prompt:
      "I have keys but never open a door. I can be made from metal and keep your secrets safe. I have four moving parts but only one way to turn. What word am I?",
    promptKey: "puzzle.wordPrompt.03",
    answerKey: "puzzle.answer.key",
  },
  8: {
    answer: "pencil",
    prompt:
      "I can be short or long, sharp or soft, and I travel without moving. I live in a pocket and vanish when spoken. What is my name?",
    promptKey: "puzzle.wordPrompt.08",
    answerKey: "puzzle.answer.pencil",
  },
  10: {
    answer: "cheetah",
    prompt:
      "The vault is themed around speed. Think of the fastest land animal. What is its name?",
    promptKey: "puzzle.wordPrompt.10",
    answerKey: "puzzle.answer.cheetah",
  },
  13: {
    answer: "watch",
    prompt:
      "I have a face but no eyes, hands but no arms, and a clock that never ticks. I am carried in a pocket and can tell time. What am I?",
    promptKey: "puzzle.wordPrompt.13",
    answerKey: "puzzle.answer.watch",
  },
  18: {
    answer: "clock",
    prompt:
      "I have wings but cannot fly, eyes but cannot see, and a needle but no thread. I sit beside your bed and count the hours. What am I?",
    promptKey: "puzzle.wordPrompt.18",
    answerKey: "puzzle.answer.clock",
  },
  24: {
    answer: "keyring",
    prompt:
      "I am a home for keys, I have a spine but no bones, and I am opened by a secret phrase. What is my name?",
    promptKey: "puzzle.wordPrompt.24",
    answerKey: "puzzle.answer.keyring",
  },
  27: {
    answer: "book",
    prompt:
      "I have a spine, a cover, and thousands of stories. I can be opened, closed, and read, but I never move. What am I?",
    promptKey: "puzzle.wordPrompt.27",
    answerKey: "puzzle.answer.book",
  },
};

export const WORD_PROMPTS = Object.fromEntries(
  Object.entries(WORD_PUZZLES).map(([level, puzzle]) => [level, puzzle.prompt]),
);

export const WORD_ANSWERS = Object.fromEntries(
  Object.entries(WORD_PUZZLES).map(([level, puzzle]) => [level, puzzle.answer]),
);

const difficultyMeta = {
  easy: { label: "Easy", offset: 113, rank: 1, accent: "lime" },
  medium: { label: "Medium", offset: 509, rank: 2, accent: "violet" },
  hard: { label: "Hard", offset: 947, rank: 3, accent: "coral" },
};

function codeFor(level, difficulty) {
  const meta = difficultyMeta[difficulty];
  const value = (level * 317 + level * level * 29 + meta.offset) % 9000;
  return String(1000 + value);
}

function digitClueKeys(code) {
  const digits = code.split("").map(Number);
  return [
    digits[0] % 2 === 0 ? "puzzle.clue.firstEven" : "puzzle.clue.firstOdd",
    digits[1] < 5 ? "puzzle.clue.secondLow" : "puzzle.clue.secondHigh",
    digits[2] === 0
      ? "puzzle.clue.thirdZero"
      : digits[2] < 4
        ? "puzzle.clue.thirdSmall"
        : "puzzle.clue.thirdLarge",
    digits[3] < 4
      ? "puzzle.clue.lastLow"
      : digits[3] < 7
        ? "puzzle.clue.lastMiddle"
        : "puzzle.clue.lastHigh",
  ];
}

function makePuzzle(level, difficulty) {
  const blueprint = blueprints[level - 1];
  const meta = difficultyMeta[difficulty];
  const wordPuzzle = WORD_PUZZLES[level];
  const answerType = wordPuzzle ? "letters" : "digits";
  const code = codeFor(level, difficulty);
  const answer = wordPuzzle?.answer || code;
  const clueKeys = answerType === "digits" ? digitClueKeys(code) : [];
  return {
    id: `${difficulty}-${level}`,
    level,
    difficulty,
    difficultyLabel: meta.label,
    difficultyRank: meta.rank,
    category: blueprint.category,
    prompt: wordPuzzle?.prompt || blueprint.prompt,
    promptKey:
      wordPuzzle?.promptKey ||
      `puzzle.prompt.${String(level).padStart(2, "0")}`,
    answer,
    answerType,
    answerKey: wordPuzzle?.answerKey || null,
    code: answerType === "digits" ? code : null,
    clueKeys,
    points: [40, 55, 70, 85][meta.rank - 1] + level,
  };
}

export const DIFFICULTIES = [
  { id: "easy", label: "Easy", description: "Warm-up signals", levels: 30 },
  {
    id: "medium",
    label: "Medium",
    description: "Sharper patterns",
    levels: 30,
  },
  { id: "hard", label: "Hard", description: "No easy answers", levels: 30 },
];

export const getPuzzle = (difficulty, level) =>
  makePuzzle(Math.min(30, Math.max(1, level)), difficulty);

export const getPuzzleList = (difficulty) =>
  Array.from({ length: 30 }, (_, index) => getPuzzle(difficulty, index + 1));

export const getCategory = (category) => category;

export const CATEGORY_LIST = [
  "All",
  "Math",
  "Logic",
  "Riddle",
  "Science",
  "Trivia",
];
