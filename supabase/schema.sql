-- ============================================================
-- UNIVERSIDADE CORPORATIVA SUPERDENTAL — Supabase Schema
-- Versão: 1.0.0  |  Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'manager', 'employee');
create type user_status as enum ('active', 'inactive');
create type content_type as enum ('video', 'text', 'pdf', 'link', 'quiz');
create type target_type as enum ('department', 'position', 'manual');
create type track_status as enum ('not_started', 'in_progress', 'completed', 'overdue');
create type course_status as enum ('not_started', 'in_progress', 'completed', 'failed');
create type lesson_status as enum ('not_started', 'completed');
create type question_type as enum ('single', 'multiple');

-- ============================================================
-- DEPARTMENTS
-- ============================================================

create table departments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- POSITIONS
-- ============================================================

create table positions (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  department_id uuid references departments(id) on delete cascade,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================

create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          user_role not null default 'employee',
  department_id uuid references departments(id),
  position_id   uuid references positions(id),
  manager_id    uuid references users(id),
  hire_date     date,
  status        user_status not null default 'active',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_users_department on users(department_id);
create index idx_users_position   on users(position_id);
create index idx_users_manager    on users(manager_id);
create index idx_users_role       on users(role);
create index idx_users_status     on users(status);

-- ============================================================
-- COURSES
-- ============================================================

create table courses (
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
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_courses_active   on courses(is_active);
create index idx_courses_category on courses(category);

-- ============================================================
-- COURSE MODULES
-- ============================================================

create table course_modules (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_modules_course on course_modules(course_id);

-- ============================================================
-- LESSONS
-- ============================================================

create table lessons (
  id              uuid primary key default uuid_generate_v4(),
  module_id       uuid not null references course_modules(id) on delete cascade,
  title           text not null,
  description     text,
  content_type    content_type not null,
  content_url     text,
  content_html    text,
  duration_minutes integer,
  sort_order      integer not null default 0,
  is_required     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_lessons_module on lessons(module_id);

-- ============================================================
-- QUIZZES
-- ============================================================

create table quizzes (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references lessons(id) on delete cascade,
  title         text not null,
  minimum_grade numeric(5,2) not null default 70,
  attempt_limit integer not null default 3,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table quiz_questions (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  question_type question_type not null default 'single',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table quiz_answers (
  id           uuid primary key default uuid_generate_v4(),
  question_id  uuid not null references quiz_questions(id) on delete cascade,
  answer_text  text not null,
  is_correct   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TRACKS
-- ============================================================

create table tracks (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  target_type  target_type not null default 'manual',
  deadline_days integer,
  is_mandatory boolean not null default false,
  is_blocking  boolean not null default false,
  is_active    boolean not null default true,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- TRACK COURSES (many-to-many)
-- ============================================================

create table track_courses (
  id          uuid primary key default uuid_generate_v4(),
  track_id    uuid not null references tracks(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  sort_order  integer not null default 0,
  is_required boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(track_id, course_id)
);

create index idx_track_courses_track  on track_courses(track_id);
create index idx_track_courses_course on track_courses(course_id);

-- ============================================================
-- TRACK RULES (automatic assignment)
-- ============================================================

create table track_rules (
  id            uuid primary key default uuid_generate_v4(),
  track_id      uuid not null references tracks(id) on delete cascade,
  department_id uuid references departments(id),
  position_id   uuid references positions(id),
  role_target   user_role,
  auto_assign   boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_track_rules_track      on track_rules(track_id);
create index idx_track_rules_department on track_rules(department_id);
create index idx_track_rules_position   on track_rules(position_id);

-- ============================================================
-- USER TRACKS (enrollment)
-- ============================================================

create table user_tracks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  track_id        uuid not null references tracks(id) on delete cascade,
  assigned_by     uuid references users(id),
  assigned_reason text,
  assigned_at     timestamptz not null default now(),
  deadline_at     timestamptz,
  status          track_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, track_id)
);

create index idx_user_tracks_user   on user_tracks(user_id);
create index idx_user_tracks_track  on user_tracks(track_id);
create index idx_user_tracks_status on user_tracks(status);

-- ============================================================
-- USER COURSE PROGRESS
-- ============================================================

create table user_course_progress (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references users(id) on delete cascade,
  course_id        uuid not null references courses(id) on delete cascade,
  status           course_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  started_at       timestamptz,
  completed_at     timestamptz,
  grade            numeric(5,2),
  last_access_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id, course_id)
);

create index idx_ucp_user   on user_course_progress(user_id);
create index idx_ucp_course on user_course_progress(course_id);
create index idx_ucp_status on user_course_progress(status);

-- ============================================================
-- USER LESSON PROGRESS
-- ============================================================

create table user_lesson_progress (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  lesson_id       uuid not null references lessons(id) on delete cascade,
  status          lesson_status not null default 'not_started',
  watched_seconds integer not null default 0,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index idx_ulp_user   on user_lesson_progress(user_id);
create index idx_ulp_lesson on user_lesson_progress(lesson_id);

-- ============================================================
-- USER QUIZ ATTEMPTS
-- ============================================================

create table user_quiz_attempts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references users(id) on delete cascade,
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  score          numeric(5,2),
  passed         boolean,
  attempt_number integer not null default 1,
  started_at     timestamptz,
  finished_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_attempts_user on user_quiz_attempts(user_id);
create index idx_attempts_quiz on user_quiz_attempts(quiz_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================

create table certificates (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references users(id) on delete cascade,
  course_id        uuid not null references courses(id) on delete cascade,
  certificate_code text not null unique,
  pdf_url          text,
  issued_at        timestamptz not null default now(),
  course_version   integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_certs_user   on certificates(user_id);
create index idx_certs_course on certificates(course_id);
create index idx_certs_code   on certificates(certificate_code);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id),
  action      text not null,
  entity_type text,
  entity_id   text,
  payload     jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_user      on audit_logs(user_id);
create index idx_audit_action    on audit_logs(action);
create index idx_audit_entity    on audit_logs(entity_type, entity_id);
create index idx_audit_created   on audit_logs(created_at desc);

-- ============================================================
-- TRIGGERS — updated_at automático
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'departments','positions','users','courses','course_modules','lessons',
    'quizzes','quiz_questions','quiz_answers','tracks','track_courses',
    'track_rules','user_tracks','user_course_progress','user_lesson_progress',
    'user_quiz_attempts','certificates'
  ] loop
    execute format(
      'create trigger trg_%s_updated_at before update on %s for each row execute procedure set_updated_at()',
      t, t
    );
  end loop;
end;
$$ language plpgsql;

-- ============================================================
-- FUNCTION — Calcular progresso da trilha automaticamente
-- ============================================================

create or replace function calculate_track_progress(p_user_id uuid, p_track_id uuid)
returns numeric as $$
declare
  v_total    integer;
  v_done     integer;
  v_progress numeric;
begin
  -- Total de cursos obrigatórios na trilha
  select count(*) into v_total
  from track_courses
  where track_id = p_track_id and is_required = true;

  if v_total = 0 then return 0; end if;

  -- Cursos concluídos pelo usuário
  select count(*) into v_done
  from track_courses tc
  join user_course_progress ucp on ucp.course_id = tc.course_id
  where tc.track_id = p_track_id
    and tc.is_required = true
    and ucp.user_id = p_user_id
    and ucp.status = 'completed';

  v_progress := (v_done::numeric / v_total::numeric) * 100;
  return round(v_progress, 2);
end;
$$ language plpgsql;

-- ============================================================
-- FUNCTION — Atualizar user_tracks quando curso é concluído
-- ============================================================

create or replace function sync_track_progress()
returns trigger as $$
declare
  r record;
begin
  -- Encontrar todas as trilhas que contêm este curso
  for r in (
    select distinct tc.track_id
    from track_courses tc
    where tc.course_id = new.course_id
  ) loop
    update user_tracks
    set
      progress_percent = calculate_track_progress(new.user_id, r.track_id),
      status = case
        when calculate_track_progress(new.user_id, r.track_id) >= 100 then 'completed'::track_status
        when calculate_track_progress(new.user_id, r.track_id) > 0 then 'in_progress'::track_status
        when deadline_at < now() and status != 'completed' then 'overdue'::track_status
        else status
      end,
      completed_at = case
        when calculate_track_progress(new.user_id, r.track_id) >= 100 then now()
        else completed_at
      end,
      updated_at = now()
    where user_id = new.user_id
      and track_id = r.track_id;
  end loop;

  return new;
end;
$$ language plpgsql;

create trigger trg_sync_track_progress
after insert or update on user_course_progress
for each row
when (new.status = 'completed')
execute procedure sync_track_progress();

-- ============================================================
-- FUNCTION — Emitir certificado automaticamente
-- ============================================================

create or replace function auto_issue_certificate()
returns trigger as $$
declare
  v_course courses%rowtype;
  v_code text;
begin
  -- Verificar se o curso emite certificado
  select * into v_course from courses where id = new.course_id;

  if v_course.has_certificate = true then
    -- Verificar nota mínima se houver exame
    if v_course.requires_exam = false or (new.grade is not null and new.grade >= coalesce(v_course.minimum_grade, 0)) then
      -- Gerar código único
      v_code := 'SD-' || upper(encode(gen_random_bytes(6), 'hex'));

      -- Inserir certificado se não existir
      insert into certificates (user_id, course_id, certificate_code, course_version)
      values (new.user_id, new.course_id, v_code, v_course.version)
      on conflict do nothing;

      -- Log
      insert into audit_logs (user_id, action, entity_type, entity_id, payload)
      values (new.user_id, 'ISSUE_CERTIFICATE', 'certificate', new.course_id::text,
              jsonb_build_object('course_id', new.course_id, 'code', v_code));
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_auto_certificate
after update on user_course_progress
for each row
when (new.status = 'completed' and old.status != 'completed')
execute procedure auto_issue_certificate();

-- ============================================================
-- FUNCTION — Atribuir trilhas automaticamente ao criar usuário
-- ============================================================

create or replace function auto_assign_tracks()
returns trigger as $$
declare
  r record;
begin
  -- Encontrar trilhas que se aplicam a este usuário por departamento ou cargo
  for r in (
    select distinct tr.track_id
    from track_rules tr
    where tr.auto_assign = true
      and (
        tr.department_id is null or tr.department_id = new.department_id
      )
      and (
        tr.position_id is null or tr.position_id = new.position_id
      )
  ) loop
    insert into user_tracks (user_id, track_id, assigned_reason, deadline_at)
    select
      new.id,
      r.track_id,
      'auto_assigned',
      case
        when t.deadline_days is not null then now() + (t.deadline_days || ' days')::interval
        else null
      end
    from tracks t
    where t.id = r.track_id
      and t.is_active = true
    on conflict (user_id, track_id) do nothing;
  end loop;

  return new;
end;
$$ language plpgsql;

create trigger trg_auto_assign_tracks
after insert or update of department_id, position_id on users
for each row
execute procedure auto_assign_tracks();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas sensíveis
alter table users enable row level security;
alter table user_tracks enable row level security;
alter table user_course_progress enable row level security;
alter table user_lesson_progress enable row level security;
alter table user_quiz_attempts enable row level security;
alter table certificates enable row level security;
alter table audit_logs enable row level security;

-- Helper: pegar role do usuário atual
create or replace function current_user_role()
returns user_role as $$
  select role from users where id = auth.uid()
$$ language sql security definer stable;

-- Helper: pegar IDs dos subordinados do gestor atual
create or replace function get_subordinate_ids()
returns setof uuid as $$
  with recursive subordinates as (
    select id from users where manager_id = auth.uid()
    union all
    select u.id from users u join subordinates s on u.manager_id = s.id
  )
  select id from subordinates
$$ language sql security definer stable;

-- USERS table policies
create policy "Users: admin sees all" on users
  for select using (current_user_role() = 'admin');

create policy "Users: manager sees team" on users
  for select using (
    current_user_role() = 'manager' and (
      id = auth.uid() or id in (select get_subordinate_ids())
    )
  );

create policy "Users: employee sees self" on users
  for select using (id = auth.uid());

create policy "Users: admin manages all" on users
  for all using (current_user_role() = 'admin');

-- USER_TRACKS policies
create policy "UserTracks: admin all" on user_tracks
  for all using (current_user_role() = 'admin');

create policy "UserTracks: manager sees team" on user_tracks
  for select using (
    current_user_role() = 'manager' and
    user_id in (select get_subordinate_ids())
  );

create policy "UserTracks: employee sees own" on user_tracks
  for select using (user_id = auth.uid());

create policy "UserTracks: employee updates own" on user_tracks
  for update using (user_id = auth.uid());

-- USER_COURSE_PROGRESS policies
create policy "UCP: admin all" on user_course_progress
  for all using (current_user_role() = 'admin');

create policy "UCP: manager sees team" on user_course_progress
  for select using (
    current_user_role() = 'manager' and
    user_id in (select get_subordinate_ids())
  );

create policy "UCP: employee manages own" on user_course_progress
  for all using (user_id = auth.uid());

-- USER_LESSON_PROGRESS policies
create policy "ULP: admin all" on user_lesson_progress
  for all using (current_user_role() = 'admin');

create policy "ULP: employee manages own" on user_lesson_progress
  for all using (user_id = auth.uid());

-- CERTIFICATES policies
create policy "Certs: admin all" on certificates
  for all using (current_user_role() = 'admin');

create policy "Certs: manager sees team" on certificates
  for select using (
    current_user_role() = 'manager' and
    user_id in (select get_subordinate_ids())
  );

create policy "Certs: employee sees own" on certificates
  for select using (user_id = auth.uid());

-- AUDIT_LOGS policies
create policy "Logs: admin all" on audit_logs
  for all using (current_user_role() = 'admin');

-- ============================================================
-- VIEWS úteis
-- ============================================================

-- View: resumo do progresso do usuário
create or replace view v_user_progress_summary as
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
from users u
left join departments d on d.id = u.department_id
left join positions p on p.id = u.position_id
left join user_tracks ut on ut.user_id = u.id
left join user_course_progress ucp on ucp.user_id = u.id
left join certificates cert on cert.user_id = u.id
group by u.id, u.name, u.email, u.department_id, d.name, u.position_id, p.name, u.manager_id;

-- View: trilhas vencidas
create or replace view v_overdue_tracks as
select
  ut.*,
  u.name as user_name,
  u.email as user_email,
  t.title as track_title,
  t.is_blocking
from user_tracks ut
join users u on u.id = ut.user_id
join tracks t on t.id = ut.track_id
where ut.status = 'overdue'
  or (ut.deadline_at < now() and ut.status != 'completed');

-- View: taxa de conclusão por departamento
create or replace view v_completion_by_department as
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
from departments d
left join users u on u.department_id = d.id and u.status = 'active'
left join user_tracks ut on ut.user_id = u.id
group by d.id, d.name;

-- ============================================================
-- SEED DATA INICIAL (exemplo)
-- ============================================================

insert into departments (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'Comercial', 'Equipe de vendas e atendimento'),
  ('00000000-0000-0000-0000-000000000002', 'Customer Success', 'Sucesso e retenção de clientes'),
  ('00000000-0000-0000-0000-000000000003', 'Operações', 'Processos operacionais'),
  ('00000000-0000-0000-0000-000000000004', 'Marketing', 'Marketing e comunicação'),
  ('00000000-0000-0000-0000-000000000005', 'Tecnologia', 'Desenvolvimento e infraestrutura'),
  ('00000000-0000-0000-0000-000000000006', 'RH', 'Recursos Humanos')
on conflict do nothing;

insert into positions (name, department_id) values
  ('Consultor de Vendas', '00000000-0000-0000-0000-000000000001'),
  ('Gerente Comercial',  '00000000-0000-0000-0000-000000000001'),
  ('Analista de CS',     '00000000-0000-0000-0000-000000000002'),
  ('Coordenador de CS',  '00000000-0000-0000-0000-000000000002'),
  ('Analista de Marketing', '00000000-0000-0000-0000-000000000004'),
  ('Desenvolvedor',      '00000000-0000-0000-0000-000000000005'),
  ('Analista de RH',     '00000000-0000-0000-0000-000000000006')
on conflict do nothing;
