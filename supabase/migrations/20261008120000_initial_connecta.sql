-- ============================================================
-- UNIVERSIDADE CORPORATIVA CONNECTA - Initial Supabase Migration
-- Creates a clean, independent database based on the original
-- Universidade Corporativa structure, without business seed data.
-- ============================================================

-- Extensions required by UUID defaults and certificate code generation.
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'manager', 'employee');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'content_type') then
    create type public.content_type as enum ('video', 'text', 'pdf', 'link', 'quiz');
  end if;

  if not exists (select 1 from pg_type where typname = 'target_type') then
    create type public.target_type as enum ('department', 'position', 'manual');
  end if;

  if not exists (select 1 from pg_type where typname = 'track_status') then
    create type public.track_status as enum ('not_started', 'in_progress', 'completed', 'overdue');
  end if;

  if not exists (select 1 from pg_type where typname = 'course_status') then
    create type public.course_status as enum ('not_started', 'in_progress', 'completed', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_status') then
    create type public.lesson_status as enum ('not_started', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type public.question_type as enum ('single', 'multiple');
  end if;
end;
$$;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.positions (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  department_id uuid references public.departments(id) on delete cascade,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          public.user_role not null default 'employee',
  department_id uuid references public.departments(id),
  position_id   uuid references public.positions(id),
  manager_id    uuid references public.users(id),
  hire_date     date,
  status        public.user_status not null default 'active',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_users_department on public.users(department_id);
create index if not exists idx_users_position   on public.users(position_id);
create index if not exists idx_users_manager    on public.users(manager_id);
create index if not exists idx_users_role       on public.users(role);
create index if not exists idx_users_status     on public.users(status);

create table if not exists public.courses (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  category        text,
  thumbnail_url   text,
  workload_hours  numeric(6,2) not null default 1,
  is_active       boolean not null default true,
  has_certificate boolean not null default false,
  requires_exam   boolean not null default false,
  minimum_grade   numeric(5,2),
  version         integer not null default 1,
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_courses_active   on public.courses(is_active);
create index if not exists idx_courses_category on public.courses(category);

create table if not exists public.course_modules (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_modules_course on public.course_modules(course_id);

create table if not exists public.lessons (
  id               uuid primary key default uuid_generate_v4(),
  module_id        uuid not null references public.course_modules(id) on delete cascade,
  title            text not null,
  description      text,
  content_type     public.content_type not null,
  content_url      text,
  content_html     text,
  duration_minutes integer,
  sort_order       integer not null default 0,
  is_required      boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_lessons_module on public.lessons(module_id);

create table if not exists public.quizzes (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid references public.lessons(id) on delete cascade,
  title         text not null,
  minimum_grade numeric(5,2) not null default 70,
  attempt_limit integer not null default 3,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  course_id     uuid references public.courses(id)
);

create index if not exists idx_quizzes_course on public.quizzes(course_id);

create table if not exists public.quiz_questions (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type public.question_type not null default 'single',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id           uuid primary key default uuid_generate_v4(),
  question_id  uuid not null references public.quiz_questions(id) on delete cascade,
  answer_text  text not null,
  is_correct   boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.tracks (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  target_type   public.target_type not null default 'manual',
  deadline_days integer,
  is_mandatory  boolean not null default false,
  is_blocking   boolean not null default false,
  is_active     boolean not null default true,
  created_by    uuid references public.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.track_courses (
  id          uuid primary key default uuid_generate_v4(),
  track_id    uuid not null references public.tracks(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  sort_order  integer not null default 0,
  is_required boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(track_id, course_id)
);

create index if not exists idx_track_courses_track  on public.track_courses(track_id);
create index if not exists idx_track_courses_course on public.track_courses(course_id);

create table if not exists public.track_rules (
  id            uuid primary key default uuid_generate_v4(),
  track_id      uuid not null references public.tracks(id) on delete cascade,
  department_id uuid references public.departments(id),
  position_id   uuid references public.positions(id),
  role_target   public.user_role,
  auto_assign   boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_track_rules_track      on public.track_rules(track_id);
create index if not exists idx_track_rules_department on public.track_rules(department_id);
create index if not exists idx_track_rules_position   on public.track_rules(position_id);

create table if not exists public.user_tracks (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  track_id         uuid not null references public.tracks(id) on delete cascade,
  assigned_by      uuid references public.users(id),
  assigned_reason  text,
  assigned_at      timestamptz not null default now(),
  deadline_at      timestamptz,
  status           public.track_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, track_id)
);

create index if not exists idx_user_tracks_user   on public.user_tracks(user_id);
create index if not exists idx_user_tracks_track  on public.user_tracks(track_id);
create index if not exists idx_user_tracks_status on public.user_tracks(status);

create table if not exists public.user_course_progress (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  status           public.course_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  started_at       timestamptz,
  completed_at     timestamptz,
  grade            numeric(5,2),
  last_access_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, course_id)
);

create index if not exists idx_ucp_user   on public.user_course_progress(user_id);
create index if not exists idx_ucp_course on public.user_course_progress(course_id);
create index if not exists idx_ucp_status on public.user_course_progress(status);

create table if not exists public.user_lesson_progress (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  status          public.lesson_status not null default 'not_started',
  watched_seconds integer not null default 0,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists idx_ulp_user   on public.user_lesson_progress(user_id);
create index if not exists idx_ulp_lesson on public.user_lesson_progress(lesson_id);

create table if not exists public.user_quiz_attempts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  quiz_id        uuid not null references public.quizzes(id) on delete cascade,
  score          numeric(5,2),
  passed         boolean,
  attempt_number integer not null default 1,
  started_at     timestamptz,
  finished_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_attempts_user on public.user_quiz_attempts(user_id);
create index if not exists idx_attempts_quiz on public.user_quiz_attempts(quiz_id);

create table if not exists public.certificates (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  certificate_code text not null unique,
  pdf_url          text,
  issued_at        timestamptz not null default now(),
  course_version   integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint certificates_user_course_unique unique (user_id, course_id)
);

create index if not exists idx_certs_user   on public.certificates(user_id);
create index if not exists idx_certs_course on public.certificates(course_id);
create index if not exists idx_certs_code   on public.certificates(certificate_code);

create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id),
  action      text not null,
  entity_type text,
  entity_id   text,
  payload     jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_user    on public.audit_logs(user_id);
create index if not exists idx_audit_action  on public.audit_logs(action);
create index if not exists idx_audit_entity  on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ============================================================
-- FUNCTIONS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_track_progress(p_user_id uuid, p_track_id uuid)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
  v_total    integer;
  v_done     integer;
  v_progress numeric;
begin
  select count(*) into v_total
  from public.track_courses
  where track_id = p_track_id
    and is_required = true;

  if v_total = 0 then
    return 0;
  end if;

  select count(*) into v_done
  from public.track_courses tc
  join public.user_course_progress ucp on ucp.course_id = tc.course_id
  where tc.track_id = p_track_id
    and tc.is_required = true
    and ucp.user_id = p_user_id
    and ucp.status = 'completed';

  v_progress := (v_done::numeric / v_total::numeric) * 100;
  return round(v_progress, 2);
end;
$$;

create or replace function public.sync_track_progress()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  r record;
begin
  for r in (
    select distinct tc.track_id
    from public.track_courses tc
    where tc.course_id = new.course_id
  ) loop
    update public.user_tracks
    set
      progress_percent = public.calculate_track_progress(new.user_id, r.track_id),
      status = case
        when public.calculate_track_progress(new.user_id, r.track_id) >= 100 then 'completed'::public.track_status
        when public.calculate_track_progress(new.user_id, r.track_id) > 0 then 'in_progress'::public.track_status
        when deadline_at < now() and status != 'completed' then 'overdue'::public.track_status
        else status
      end,
      completed_at = case
        when public.calculate_track_progress(new.user_id, r.track_id) >= 100 then now()
        else completed_at
      end,
      updated_at = now()
    where user_id = new.user_id
      and track_id = r.track_id;
  end loop;

  return new;
end;
$$;

create or replace function public.auto_issue_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses%rowtype;
  v_code text;
  v_inserted_code text;
begin
  select * into v_course
  from public.courses
  where id = new.course_id;

  if not found then
    return new;
  end if;

  if v_course.has_certificate is not true then
    return new;
  end if;

  if v_course.requires_exam is true
     and (new.grade is null or new.grade < coalesce(v_course.minimum_grade, 0)) then
    return new;
  end if;

  if exists (
    select 1
    from public.certificates
    where user_id = new.user_id
      and course_id = new.course_id
  ) then
    return new;
  end if;

  loop
    v_code := 'CONNECTA-' || upper(encode(gen_random_bytes(6), 'hex'));

    begin
      insert into public.certificates (user_id, course_id, certificate_code, course_version)
      values (new.user_id, new.course_id, v_code, v_course.version)
      on conflict (user_id, course_id) do nothing
      returning certificate_code into v_inserted_code;

      exit;
    exception
      when unique_violation then
        -- Retry only if the random certificate code collided.
        v_inserted_code := null;
    end;
  end loop;

  if v_inserted_code is not null then
    insert into public.audit_logs (user_id, action, entity_type, entity_id, payload)
    values (
      new.user_id,
      'ISSUE_CERTIFICATE',
      'certificate',
      new.course_id::text,
      jsonb_build_object('course_id', new.course_id, 'code', v_inserted_code)
    );
  end if;

  return new;
end;
$$;

create or replace function public.auto_assign_tracks()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  r record;
begin
  for r in (
    select distinct tr.track_id
    from public.track_rules tr
    where tr.auto_assign = true
      and (tr.department_id is null or tr.department_id = new.department_id)
      and (tr.position_id is null or tr.position_id = new.position_id)
  ) loop
    insert into public.user_tracks (user_id, track_id, assigned_reason, deadline_at)
    select
      new.id,
      r.track_id,
      'auto_assigned',
      case
        when t.deadline_days is not null then now() + (t.deadline_days || ' days')::interval
        else null
      end
    from public.tracks t
    where t.id = r.track_id
      and t.is_active = true
    on conflict (user_id, track_id) do nothing;
  end loop;

  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.get_subordinate_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  with recursive subordinates as (
    select id from public.users where manager_id = auth.uid()
    union all
    select u.id
    from public.users u
    join subordinates s on u.manager_id = s.id
  )
  select id from subordinates
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

create trigger trg_departments_updated_at
before update on public.departments
for each row execute procedure public.set_updated_at();

create trigger trg_positions_updated_at
before update on public.positions
for each row execute procedure public.set_updated_at();

create trigger trg_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

create trigger trg_courses_updated_at
before update on public.courses
for each row execute procedure public.set_updated_at();

create trigger trg_course_modules_updated_at
before update on public.course_modules
for each row execute procedure public.set_updated_at();

create trigger trg_lessons_updated_at
before update on public.lessons
for each row execute procedure public.set_updated_at();

create trigger trg_quizzes_updated_at
before update on public.quizzes
for each row execute procedure public.set_updated_at();

create trigger trg_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute procedure public.set_updated_at();

create trigger trg_quiz_answers_updated_at
before update on public.quiz_answers
for each row execute procedure public.set_updated_at();

create trigger trg_tracks_updated_at
before update on public.tracks
for each row execute procedure public.set_updated_at();

create trigger trg_track_courses_updated_at
before update on public.track_courses
for each row execute procedure public.set_updated_at();

create trigger trg_track_rules_updated_at
before update on public.track_rules
for each row execute procedure public.set_updated_at();

create trigger trg_user_tracks_updated_at
before update on public.user_tracks
for each row execute procedure public.set_updated_at();

create trigger trg_user_course_progress_updated_at
before update on public.user_course_progress
for each row execute procedure public.set_updated_at();

create trigger trg_user_lesson_progress_updated_at
before update on public.user_lesson_progress
for each row execute procedure public.set_updated_at();

create trigger trg_user_quiz_attempts_updated_at
before update on public.user_quiz_attempts
for each row execute procedure public.set_updated_at();

create trigger trg_certificates_updated_at
before update on public.certificates
for each row execute procedure public.set_updated_at();

create trigger trg_sync_track_progress
after insert or update on public.user_course_progress
for each row
when (new.status = 'completed')
execute procedure public.sync_track_progress();

create trigger trg_auto_certificate
after update on public.user_course_progress
for each row
when (new.status = 'completed' and old.status != 'completed')
execute procedure public.auto_issue_certificate();

create trigger trg_auto_assign_tracks
after insert or update of department_id, position_id on public.users
for each row
execute procedure public.auto_assign_tracks();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.user_tracks enable row level security;
alter table public.user_course_progress enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users: admin sees all" on public.users
  for select
  using (public.current_user_role() = 'admin');

create policy "Users: manager sees team" on public.users
  for select
  using (
    public.current_user_role() = 'manager' and (
      id = auth.uid() or id in (select public.get_subordinate_ids())
    )
  );

create policy "Users: employee sees self" on public.users
  for select
  using (id = auth.uid());

create policy "Users: admin manages all" on public.users
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "UserTracks: admin all" on public.user_tracks
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "UserTracks: manager sees team" on public.user_tracks
  for select
  using (
    public.current_user_role() = 'manager'
    and user_id in (select public.get_subordinate_ids())
  );

create policy "UserTracks: employee sees own" on public.user_tracks
  for select
  using (user_id = auth.uid());

create policy "UserTracks: employee updates own" on public.user_tracks
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "UCP: admin all" on public.user_course_progress
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "UCP: manager sees team" on public.user_course_progress
  for select
  using (
    public.current_user_role() = 'manager'
    and user_id in (select public.get_subordinate_ids())
  );

create policy "UCP: employee manages own" on public.user_course_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ULP: admin all" on public.user_lesson_progress
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "ULP: employee manages own" on public.user_lesson_progress
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Quizzes: admin all" on public.quizzes
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Quizzes: authenticated read" on public.quizzes
  for select
  using (auth.uid() is not null);

create policy "QuizQuestions: admin all" on public.quiz_questions
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "QuizQuestions: authenticated read" on public.quiz_questions
  for select
  using (auth.uid() is not null);

create policy "QuizAnswers: admin all" on public.quiz_answers
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "QuizAnswers: authenticated read" on public.quiz_answers
  for select
  using (auth.uid() is not null);

create policy "UserQuizAttempts: admin all" on public.user_quiz_attempts
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "UserQuizAttempts: employee manages own" on public.user_quiz_attempts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "UserQuizAttempts: manager sees team" on public.user_quiz_attempts
  for select
  using (
    public.current_user_role() = 'manager'
    and user_id in (select public.get_subordinate_ids())
  );

create policy "Certs: admin all" on public.certificates
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Certs: manager sees team" on public.certificates
  for select
  using (
    public.current_user_role() = 'manager'
    and user_id in (select public.get_subordinate_ids())
  );

create policy "Certs: employee sees own" on public.certificates
  for select
  using (user_id = auth.uid());

create policy "Logs: admin all" on public.audit_logs
  for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ============================================================
-- VIEWS
-- ============================================================

create or replace view public.v_user_progress_summary as
select
  u.id as user_id,
  u.name,
  u.email,
  u.department_id,
  d.name as department_name,
  u.position_id,
  p.name as position_name,
  u.manager_id,
  count(distinct ut.id) as total_tracks,
  count(distinct ut.id) filter (where ut.status = 'completed') as completed_tracks,
  count(distinct ut.id) filter (where ut.status = 'overdue') as overdue_tracks,
  count(distinct ucp.id) filter (where ucp.status = 'completed') as completed_courses,
  count(distinct cert.id) as certificates_count,
  coalesce(avg(ut.progress_percent), 0)::numeric(5,2) as avg_track_progress
from public.users u
left join public.departments d on d.id = u.department_id
left join public.positions p on p.id = u.position_id
left join public.user_tracks ut on ut.user_id = u.id
left join public.user_course_progress ucp on ucp.user_id = u.id
left join public.certificates cert on cert.user_id = u.id
group by u.id, u.name, u.email, u.department_id, d.name, u.position_id, p.name, u.manager_id;

create or replace view public.v_overdue_tracks as
select
  ut.*,
  u.name as user_name,
  u.email as user_email,
  t.title as track_title,
  t.is_blocking
from public.user_tracks ut
join public.users u on u.id = ut.user_id
join public.tracks t on t.id = ut.track_id
where ut.status = 'overdue'
  or (ut.deadline_at < now() and ut.status != 'completed');

create or replace view public.v_completion_by_department as
select
  d.id as department_id,
  d.name as department_name,
  count(distinct u.id) as total_users,
  count(distinct ut.user_id) filter (where ut.status = 'completed') as completed_users,
  round(
    coalesce(
      count(distinct ut.user_id) filter (where ut.status = 'completed')::numeric /
      nullif(count(distinct u.id), 0) * 100,
      0
    ), 2
  ) as completion_rate
from public.departments d
left join public.users u on u.department_id = d.id and u.status = 'active'
left join public.user_tracks ut on ut.user_id = u.id
group by d.id, d.name;

-- ============================================================
-- STORAGE: course-thumbnails
-- ============================================================

insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

create policy "Course thumbnails: public read" on storage.objects
  for select
  using (bucket_id = 'course-thumbnails');

create policy "Course thumbnails: admin upload" on storage.objects
  for insert
  with check (
    bucket_id = 'course-thumbnails'
    and public.current_user_role() = 'admin'
  );

create policy "Course thumbnails: admin update" on storage.objects
  for update
  using (
    bucket_id = 'course-thumbnails'
    and public.current_user_role() = 'admin'
  )
  with check (
    bucket_id = 'course-thumbnails'
    and public.current_user_role() = 'admin'
  );

create policy "Course thumbnails: admin delete" on storage.objects
  for delete
  using (
    bucket_id = 'course-thumbnails'
    and public.current_user_role() = 'admin'
  );
