-- Allow localized word answers in addition to four-digit numeric answers.
alter table public.content_puzzles
  add column if not exists answer_type text not null default 'digits',
  add column if not exists answer_key text;

alter table public.content_puzzles
  drop constraint if exists content_puzzles_answer_code_check;

alter table public.content_puzzles
  add constraint content_puzzles_answer_code_check
  check (char_length(answer_code) between 1 and 64);

alter table public.content_puzzles
  drop constraint if exists content_puzzles_answer_type_check;

alter table public.content_puzzles
  add constraint content_puzzles_answer_type_check
  check (answer_type in ('digits', 'letters'));

alter table public.multiplayer_answers
  drop constraint if exists multiplayer_answers_submitted_code_check;

alter table public.multiplayer_answers
  add constraint multiplayer_answers_submitted_code_check
  check (char_length(submitted_code) between 1 and 64);

update public.content_puzzles
set answer_type = 'letters',
    answer_key = case level
      when 3 then 'puzzle.answer.key'
      when 8 then 'puzzle.answer.pencil'
      when 10 then 'puzzle.answer.cheetah'
      when 13 then 'puzzle.answer.watch'
      when 18 then 'puzzle.answer.clock'
      when 24 then 'puzzle.answer.keyring'
      when 27 then 'puzzle.answer.book'
    end,
    answer_code = case level
      when 3 then 'key'
      when 8 then 'pencil'
      when 10 then 'cheetah'
      when 13 then 'watch'
      when 18 then 'clock'
      when 24 then 'keyring'
      when 27 then 'book'
    end
where level in (3, 8, 10, 13, 18, 24, 27);
