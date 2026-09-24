-- Correct puzzle answers so every accepted answer actually solves its riddle.
--
-- The old seed generated procedural digit codes that matched no clue, and 005
-- attached the keyring word puzzle to level 24 and the book word puzzle to level
-- 27 even though their blueprints live at 23 ("I am a home for keys…") and 28
-- ("I have a spine, a cover…"). This migration:
--
--   1. Sets one canonical answer per level (identical on easy/medium/hard,
--      matching the client's per-level answer table).
--   2. Moves keyring to level 23 and book to level 28 (letters).
--   3. Converts levels 24 (lab card) and 27 (chessboard) to digit puzzles and
--      restores their blueprint prompts.
--
-- Prompts mirror seed.sql semantics: word levels carry the word prompt, digit
-- levels carry the blueprint prompt, so the live table matches a fresh seed.

update public.content_puzzles as live
set answer_code = corrected.answer_code,
    answer_type = corrected.answer_type,
    answer_key = corrected.answer_key,
    prompt = coalesce(corrected.prompt, live.prompt)
from (
  values
    (1, 'digits'::text, null::text, '1247'::text, null::text),
    (2, 'digits'::text, null::text, '1214'::text, null::text),
    (3, 'letters'::text, 'puzzle.answer.key'::text, 'key'::text, null::text),
    (4, 'digits'::text, null::text, '1673'::text, null::text),
    (5, 'digits'::text, null::text, '6447'::text, null::text),
    (6, 'digits'::text, null::text, '3452'::text, null::text),
    (7, 'digits'::text, null::text, '2244'::text, null::text),
    (8, 'letters'::text, 'puzzle.answer.pencil'::text, 'pencil'::text, null::text),
    (9, 'digits'::text, null::text, '8135'::text, null::text),
    (10, 'letters'::text, 'puzzle.answer.cheetah'::text, 'cheetah'::text, null::text),
    (11, 'digits'::text, null::text, '2866'::text, null::text),
    (12, 'digits'::text, null::text, '1551'::text, null::text),
    (13, 'letters'::text, 'puzzle.answer.watch'::text, 'watch'::text, null::text),
    (14, 'digits'::text, null::text, '8813'::text, null::text),
    (15, 'digits'::text, null::text, '5563'::text, null::text),
    (16, 'digits'::text, null::text, '2464'::text, null::text),
    (17, 'digits'::text, null::text, '1234'::text, null::text),
    (18, 'letters'::text, 'puzzle.answer.clock'::text, 'clock'::text, null::text),
    (19, 'digits'::text, null::text, '1234'::text, null::text),
    (20, 'digits'::text, null::text, '6244'::text, null::text),
    (21, 'digits'::text, null::text, '6422'::text, null::text),
    (22, 'digits'::text, null::text, '3813'::text, null::text),
    (23, 'letters'::text, 'puzzle.answer.keyring'::text, 'keyring'::text, 'I am a home for keys, I have a spine but no bones, and I am opened by a secret phrase. What is my name?'::text),
    (24, 'digits'::text, null::text, '6134'::text, 'A lab card reads: the SI unit of force, the number of legs on a crab, the number of bones in an adult human ear, and the number of letters in “atom”. Convert each answer to a digit.'::text),
    (25, 'digits'::text, null::text, '4554'::text, null::text),
    (26, 'digits'::text, null::text, '5466'::text, null::text),
    (27, 'digits'::text, null::text, '8558'::text, 'A chessboard is the key. Use the number of squares on one edge, the number of pieces at the start, the number of letters in “check”, and the number of columns in a standard board.'::text),
    (28, 'letters'::text, 'puzzle.answer.book'::text, 'book'::text, 'I have a spine, a cover, and thousands of stories. I can be opened, closed, and read, but I never move. What am I?'::text),
    (29, 'digits'::text, null::text, '3154'::text, null::text),
    (30, 'digits'::text, null::text, '7584'::text, null::text)
) as corrected(level, answer_type, answer_key, answer_code, prompt)
where live.level = corrected.level;