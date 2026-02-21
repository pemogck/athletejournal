-- ============================================================
-- Seed Data — replace USER_UUID with an actual Supabase user id
-- ============================================================
-- After creating a test account via the app, find the user id in
-- Supabase Dashboard > Authentication > Users, then run this SQL.
-- Replace 'USER_UUID' with your actual user uuid.

do $$
declare
  uid uuid := 'USER_UUID'; -- ← REPLACE THIS
  today date := current_date;
begin

-- Profile
insert into public.athlete_profile (user_id, first_name, birth_year, favorite_sport)
values (uid, 'Alex', 2012, 'Basketball')
on conflict (user_id) do update set first_name = 'Alex', birth_year = 2012, favorite_sport = 'Basketball';

-- Last 14 days of entries
insert into public.journal_entries
  (user_id, entry_date, sport, activity_type, minutes, effort, confidence, body_feel, win_today, lesson_today, tomorrow_focus)
values
  (uid, today,      'Basketball', 'Practice',    75, 4, 4, 'Great', 'Hit 8/10 free throws', 'Need to work on left hand', 'Dribble drills'),
  (uid, today-1,   'Basketball', 'Game',         90, 5, 4, 'OK',   'Scored 12 points', 'Boxing out more consistently', 'Film review'),
  (uid, today-2,   'Soccer',     'Practice',     60, 3, 3, 'Sore', 'Good passing accuracy', 'Shooting needs work', 'Crossing practice'),
  (uid, today-3,   'Basketball', 'Skills',       45, 5, 5, 'Great', 'Nailed the step-back', 'Footwork on defense', 'Defensive slides'),
  (uid, today-5,   'Basketball', 'Strength',     40, 4, 4, 'Great', 'New PR on box jumps', 'Core needs more work', 'Planks and ab work'),
  (uid, today-6,   'Soccer',     'Game',         80, 5, 3, 'OK',   'Assisted 2 goals', 'Positioning in midfield', 'Watch tape'),
  (uid, today-7,   'Basketball', 'Conditioning', 30, 4, 4, 'Great', 'Finished all sprints', 'Pacing myself better', 'Sprint intervals'),
  (uid, today-8,   'Basketball', 'Practice',     70, 3, 4, 'OK',   'Team chemistry felt good', 'Ball handling under pressure', 'Pressure drills'),
  (uid, today-9,   'Swimming',   'Practice',     50, 4, 3, 'Sore', 'Improved flip turns', 'Breathing rhythm', 'Turns and kicks'),
  (uid, today-10,  'Basketball', 'Recovery',     20, 2, 4, 'Sore', 'Good stretch session', 'Foam roll every day', 'Morning stretch'),
  (uid, today-11,  'Basketball', 'Game',         85, 5, 5, 'Great', 'Hit game-winning shot', 'Stay calm under pressure', 'Free throws'),
  (uid, today-12,  'Soccer',     'Skills',       45, 4, 4, 'Great', 'Juggling personal best', 'First touch improvement', 'Juggling 100 times'),
  (uid, today-13,  'Basketball', 'Strength',     35, 4, 3, 'OK',   'Good lower body workout', 'Upper body balance needed', 'Pull-ups'),
  (uid, today-14,  'Basketball', 'Practice',     60, 3, 3, 'OK',   'Good team scrimmage', 'Communication on defense', 'Call out screens')
on conflict (user_id, entry_date) do nothing;

-- Monthly reflection for current month
insert into public.monthly_reflections (user_id, month, biggest_win_month, improve_next_month)
values (
  uid,
  to_char(current_date, 'YYYY-MM'),
  'Hitting the game-winning shot in the championship game!',
  'Improve my ball handling under pressure and defensive positioning.'
)
on conflict (user_id, month) do nothing;

end $$;
