-- Canonical puzzle content only. No users, rooms, answers, wallets, or purchases are seeded.
with templates(prompt) as (
  values
    ('A lock has four rotating dials. The first is odd, the second is one more than the first, the third is the number of letters in “four”, and the last is the sum of the first three digits. What code opens it?'),
    ('Four numbers are hiding in the vault. Add the first two, subtract the third, then multiply by the last. The result is 8. All four numbers are non-zero digits. Find the code.'),
    ('I have keys but never open a door. I can be made from metal, and I keep your secrets safe. I have four moving parts, but only one way to turn me. What four-digit combination is my signature?'),
    ('The code describes a tiny experiment. The first digit is a seed, the second is the number of legs on an insect, the third is the pH of pure water, and the fourth is the symbol count in H₂O. Assemble the digits.'),
    ('A museum displays a famous number. The first digit is the number of sides on a hexagon, the second is the year Julius Caesar was assassinated (last two digits), the third is 7, and the fourth is the number of continents. What is the code?'),
    ('The four dials follow a pattern: each digit is the previous digit plus 1, except the final dial, which resets to the smallest even digit. Begin with the number of vowels in “Exotic”. What code do you see?'),
    ('A calculator has forgotten its four-digit PIN. The digits are in ascending order, their sum is 12, and the largest digit is twice the smallest. Solve the pattern.'),
    ('I can be short or long, sharp or soft, and I travel without moving. I live in a pocket and vanish when spoken. Count the letters in my name, then use the digits of its Scrabble value twice.'),
    ('Build a code from a water molecule: oxygen’s atomic number, hydrogen’s atomic number, the number of atoms in one molecule, and the number of letters in “water”.'),
    ('The vault is themed around speed. Think of the fastest land animal: take the number of letters in “cheetah”, the number of legs it uses to sprint, its rank clue (1), and the number of letters in “fast”.'),
    ('Four clues are written in ink: my first digit is prime, my second is its opposite on a keypad, my third is 6, and my fourth is the number of sides of a cube. Solve the sequence.'),
    ('A four-digit number hides in plain sight. Its first and last digits are equal, its middle digits add to 10, and the number is divisible by 11. Find the smallest solution.'),
    ('I have a face but no eyes, hands but no arms, and a clock that never ticks. I am carried in a pocket and can tell time. Use the count of letters in “watch” for the first clue, then its two hands for the second, 12 for the third, and 1 for the last.'),
    ('A star is calling. Use the number of planets in our solar system, the number of legs on a spider, the boiling point of water at sea level, and the number of letters in “red”. Combine the answers.'),
    ('A curious code is hidden in a world atlas. Take the number of oceans, the number of letters in “Earth”, the number of days in a leap year, and the number of letters in “map”.'),
    ('The dials are talking: “I am even, I am 4, I am the number of sides on a triangle doubled, and I am the number of letters in ‘four’.” Who am I? Enter the four clues in order.'),
    ('Start at 1 and apply four rules: double, add 2, subtract 1, then multiply by 3. The intermediate results are 2, 4, 3, and 9. Use the rule numbers 1, 2, 3, 4 to form a final check digit sequence.'),
    ('I have wings but cannot fly, eyes but cannot see, and a needle but no thread. I sit beside your bed and count the hours. Turn my name, its hands, its numbers, and its chime into four digits.'),
    ('A scientist leaves a recipe: one leap year, two atoms in hydrogen, three states of matter, and four seasons. The code is the sequence of those answers.'),
    ('A cinema ticket hides a code. Use the number of letters in “cinema”, the number of reels in a classic projector, the number of letters in “film”, and the number of sides on a ticket stub.'),
    ('Four switches are labelled with the numbers 1, 2, 4, and 8. The lock wants the number of letters in “switch”, the number of switches, the number of vowels in “code”, and the number of directions you can turn a switch.'),
    ('A sequence grows by adding its digits: 7 → 14 → 55 → 131. The next step is formed by the number of steps, the sum of the first and last digits, the number of even terms, and the answer’s tens digit. What code is formed?'),
    ('I am a home for keys, I have a spine but no bones, and I am opened by a secret phrase. Count the letters in “keyring”, use its teeth count clue, the number of keys on a ring, and the number of letters in “open”.'),
    ('A lab card reads: the SI unit of force, the number of legs on a crab, the number of bones in an adult human ear, and the number of letters in “atom”. Convert each answer to a digit.'),
    ('A music box is locked. Take the number of strings on a standard violin, the number of letters in “music”, the number of lines in a staff, and the number of beats in common time.'),
    ('The code is a quiet rebellion. Its digits are the number of letters in “quiet”, the number of consonants in “rebels”, the number of letters in “secret”, and the number of words in this clue.'),
    ('A chessboard is the key. Use the number of squares on one edge, the number of pieces at the start, the number of letters in “check”, and the number of columns in a standard board.'),
    ('I have a spine, a cover, and thousands of stories. I can be opened, closed, and read, but I never move. Use the count of letters in “book”, the number of covers, the number of sides on a page, and the number of letters in “read”.'),
    ('A weather station requests four readings: the number of legs on a tripod, the boiling point of water in Celsius at sea level, the number of letters in “cloud”, and the number of directions in a compass rose.'),
    ('A board game is the final clue. Take the number of colors in a rainbow, the number of letters in “chess”, the number of squares in a chessboard’s home row, and the number of letters in “play”.')
), expanded as (
  select prompt, row_number() over ()::smallint as level from templates
), word_answers(level, answer_type, answer_key, answer_code, prompt) as (
  values
    (3, 'letters'::text, 'puzzle.answer.key'::text, 'key'::text, 'I have keys but never open a door. I can be made from metal and keep your secrets safe. I have four moving parts but only one way to turn. What word am I?'::text),
    (8, 'letters'::text, 'puzzle.answer.pencil'::text, 'pencil'::text, 'I can be short or long, sharp or soft, and I travel without moving. I live in a pocket and vanish when spoken. What is my name?'::text),
    (10, 'letters'::text, 'puzzle.answer.cheetah'::text, 'cheetah'::text, 'The vault is themed around speed. Think of the fastest land animal. What is its name?'::text),
    (13, 'letters'::text, 'puzzle.answer.watch'::text, 'watch'::text, 'I have a face but no eyes, hands but no arms, and a clock that never ticks. I am carried in a pocket and can tell time. What am I?'::text),
    (18, 'letters'::text, 'puzzle.answer.clock'::text, 'clock'::text, 'I have wings but cannot fly, eyes but cannot see, and a needle but no thread. I sit beside your bed and count the hours. What am I?'::text),
    (24, 'letters'::text, 'puzzle.answer.keyring'::text, 'keyring'::text, 'I am a home for keys, I have a spine but no bones, and I am opened by a secret phrase. What is my name?'::text),
    (27, 'letters'::text, 'puzzle.answer.book'::text, 'book'::text, 'I have a spine, a cover, and thousands of stories. I can be opened, closed, and read, but I never move. What am I?'::text)
), generated as (
  select
    d.difficulty,
    e.level,
    (array['Math','Logic','Riddle','Science','Trivia'])[1 + ((e.level - 1) % 5)] as category,
    coalesce(w.prompt, e.prompt) as prompt,
    coalesce(w.answer_type, 'digits'::text) as answer_type,
    w.answer_key,
    w.answer_code,
    case d.difficulty when 'easy' then 40 when 'medium' then 55 else 70 end + e.level as points,
    case d.difficulty when 'easy' then 113 when 'medium' then 509 else 947 end as difficulty_offset
  from expanded e
  cross join (values ('easy'::public.difficulty), ('medium'::public.difficulty), ('hard'::public.difficulty)) as d(difficulty)
  left join word_answers w on w.level = e.level
)
insert into public.content_puzzles(difficulty, level, category, prompt, clue_lines, answer_code, answer_type, answer_key, points)
select
  difficulty,
  level,
  category,
  prompt,
  jsonb_build_array('Use the first clue to establish parity.', 'Use the second clue to narrow the range.', 'Use the third clue to test the relationship.', 'Use the final clue to select the last digit.'),
  coalesce(answer_code, lpad((((level * 317 + level * level * 29 + difficulty_offset) % 9000) + 1000)::text, 4, '0')),
  answer_type,
  answer_key,
  points
from generated
on conflict (difficulty, level) do update set category = excluded.category, prompt = excluded.prompt, clue_lines = excluded.clue_lines, answer_code = excluded.answer_code, answer_type = excluded.answer_type, answer_key = excluded.answer_key, points = excluded.points, active = true;
