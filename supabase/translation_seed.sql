-- Locale catalog rows only. The app's reviewed UI dictionaries live in src/i18n/translations.js.
insert into public.translation_catalogs(locale, label, direction, is_enabled)
values
  ('en', 'English', 'ltr', true), ('ar', 'العربية', 'rtl', true), ('fr', 'Français', 'ltr', true), ('es', 'Español', 'ltr', true),
  ('de', 'Deutsch', 'ltr', true), ('pt', 'Português', 'ltr', true), ('it', 'Italiano', 'ltr', true), ('nl', 'Nederlands', 'ltr', true),
  ('ru', 'Русский', 'ltr', true), ('tr', 'Türkçe', 'ltr', true), ('ja', '日本語', 'ltr', true), ('ko', '한국어', 'ltr', true),
  ('zh', '简体中文', 'ltr', true), ('hi', 'हिन्दी', 'ltr', true), ('id', 'Bahasa Indonesia', 'ltr', true), ('ur', 'اردو', 'rtl', true)
on conflict (locale) do update set label = excluded.label, direction = excluded.direction, is_enabled = excluded.is_enabled;
