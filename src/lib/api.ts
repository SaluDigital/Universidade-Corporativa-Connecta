import { supabase, supabaseAdmin } from './supabase';

// ─── USERS ────────────────────────────────────────────────
export const getUsers = () =>
  supabase
    .from('users')
    .select('*, department:departments(id,name), position:positions(id,name)')
    .order('name');

export const getUserById = (id: string) =>
  supabase
    .from('users')
    .select('*, department:departments(id,name), position:positions(id,name)')
    .eq('id', id)
    .single();

export const updateUser = (id: string, data: Record<string, unknown>) =>
  supabase.from('users').update(data).eq('id', id);

export const updateUserStatus = (id: string, status: 'active' | 'inactive') =>
  supabase.from('users').update({ status }).eq('id', id);

/** Cria auth user + perfil na tabela users via Admin API (não afeta a sessão do admin) */
export const createUser = async (params: {
  name: string;
  email: string;
  password: string;
  role: string;
  department_id: string;
  position_id: string;
  hire_date: string;
}) => {
  if (!supabaseAdmin) throw new Error('VITE_SUPABASE_SERVICE_KEY não configurada no .env');

  // Usa Admin API — não faz login automático, não afeta a sessão atual
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true, // confirma o e-mail automaticamente, sem enviar e-mail
  });
  if (error) throw error;
  if (!data.user) throw new Error('Usuário não criado');

  // Usa supabaseAdmin no insert também — bypassa RLS completamente
  const { error: profileError } = await supabaseAdmin.from('users').insert({
    id: data.user.id,
    name: params.name,
    email: params.email,
    role: params.role,
    department_id: params.department_id || null,
    position_id: params.position_id || null,
    hire_date: params.hire_date || null,
    status: 'active',
  });
  if (profileError) throw profileError;
  return data.user;
};

// ─── DEPARTMENTS ──────────────────────────────────────────
export const getDepartments = () =>
  supabase.from('departments').select('*').order('name');

export const createDepartment = (data: { name: string; description?: string }) =>
  supabase.from('departments').insert(data).select().single();

export const updateDepartment = (id: string, data: { name?: string; description?: string }) =>
  supabase.from('departments').update(data).eq('id', id);

export const deleteDepartment = (id: string) =>
  supabase.from('departments').delete().eq('id', id);

// ─── POSITIONS ────────────────────────────────────────────
export const getPositions = () =>
  supabase.from('positions').select('*').order('name');

export const createPosition = (data: { name: string; department_id: string; description?: string }) =>
  supabase.from('positions').insert(data).select().single();

export const updatePosition = (id: string, data: { name?: string; description?: string }) =>
  supabase.from('positions').update(data).eq('id', id);

export const deletePosition = (id: string) =>
  supabase.from('positions').delete().eq('id', id);

// ─── COURSES ──────────────────────────────────────────────
export const getCourses = () =>
  supabase.from('courses').select('*').order('title');

export const getCourseById = (id: string) =>
  supabase.from('courses').select('*').eq('id', id).single();

export const createCourse = (data: Record<string, unknown>) =>
  supabase.from('courses').insert(data).select().single();

export const updateCourse = (id: string, data: Record<string, unknown>) =>
  supabase.from('courses').update(data).eq('id', id);

export const toggleCourseActive = (id: string, is_active: boolean) =>
  supabase.from('courses').update({ is_active }).eq('id', id);

export const deleteCourse = (id: string) =>
  supabase.from('courses').delete().eq('id', id);

export const uploadCourseThumbnail = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('course-thumbnails')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(path);
  return data.publicUrl;
};

// ─── TRACKS ───────────────────────────────────────────────
export const getTracks = () =>
  supabase
    .from('tracks')
    .select('*, courses:track_courses(*, course:courses(id,title,workload_hours,category,has_certificate))')
    .order('title');

export const createTrack = (data: Record<string, unknown>) =>
  supabase.from('tracks').insert(data).select().single();

export const updateTrack = (id: string, data: Record<string, unknown>) =>
  supabase.from('tracks').update(data).eq('id', id);

export const getTrackEnrollments = (trackId: string) =>
  supabase.from('user_tracks').select('*').eq('track_id', trackId);

export const addCourseToTrack = (trackId: string, courseId: string, sortOrder: number) =>
  supabase.from('track_courses').insert({ track_id: trackId, course_id: courseId, sort_order: sortOrder }).select().single();

export const removeCourseFromTrack = (trackId: string, courseId: string) =>
  supabase.from('track_courses').delete().eq('track_id', trackId).eq('course_id', courseId);

// ─── TRACK RULES ──────────────────────────────────────────
export const getRules = () =>
  supabase.from('track_rules').select('*, track:tracks(id,title,is_mandatory,is_blocking,deadline_days), department:departments(id,name), position:positions(id,name)');

export const createRule = (data: Record<string, unknown>) =>
  supabase.from('track_rules').insert(data).select().single();

export const deleteRule = (id: string) =>
  supabase.from('track_rules').delete().eq('id', id);

// ─── USER TRACKS ──────────────────────────────────────────
export const getUserTracks = (userId: string) =>
  supabase
    .from('user_tracks')
    .select('*, track:tracks(*, courses:track_courses(*, course:courses(*)))')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

export const getTeamTracks = (userIds: string[]) =>
  supabase
    .from('user_tracks')
    .select('*, user:users(id,name,email,avatar_url), track:tracks(id,title,is_mandatory,is_blocking)')
    .in('user_id', userIds);

// ─── USER COURSE PROGRESS ─────────────────────────────────
export const getUserCourseProgress = (userId: string) =>
  supabase
    .from('user_course_progress')
    .select('*, course:courses(*)')
    .eq('user_id', userId);

export const upsertCourseProgress = (data: Record<string, unknown>) =>
  supabase.from('user_course_progress').upsert(data, { onConflict: 'user_id,course_id' }).select().single();

// ─── USER LESSON PROGRESS ─────────────────────────────────
export const getUserLessonProgress = (userId: string, lessonIds: string[]) =>
  supabase.from('user_lesson_progress').select('*').eq('user_id', userId).in('lesson_id', lessonIds);

export const upsertLessonProgress = (data: Record<string, unknown>) =>
  supabase.from('user_lesson_progress').upsert(data, { onConflict: 'user_id,lesson_id' }).select().single();

// ─── CERTIFICATES ─────────────────────────────────────────
export const getCertificates = () =>
  supabase
    .from('certificates')
    .select('*, user:users(id,name,email), course:courses(id,title)')
    .order('issued_at', { ascending: false });

export const getUserCertificates = (userId: string) =>
  supabase
    .from('certificates')
    .select('*, course:courses(id,title,workload_hours,category)')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

// ─── AUDIT LOGS ───────────────────────────────────────────
export const getAuditLogs = () =>
  supabase
    .from('audit_logs')
    .select('*, user:users(id,name,email)')
    .order('created_at', { ascending: false })
    .limit(200);

// ─── DASHBOARD STATS (view) ───────────────────────────────
export const getUserProgressSummary = () =>
  supabase.from('v_user_progress_summary').select('*');

export const getCompletionByDepartment = async (): Promise<{ data: any[]; error: null }> => {
  const [{ data: users }, { data: progress }] = await Promise.all([
    supabase.from('users').select('id, department_id, department:departments(id,name)'),
    supabase.from('user_course_progress').select('user_id, status'),
  ]);
  const deptMap: Record<string, { name: string; total: Set<string>; completedSet: Set<string> }> = {};
  (users ?? []).forEach((u: any) => {
    if (!u.department_id) return;
    const dname = u.department?.name ?? 'Sem departamento';
    if (!deptMap[u.department_id]) deptMap[u.department_id] = { name: dname, total: new Set(), completedSet: new Set() };
    deptMap[u.department_id].total.add(u.id);
  });
  const userDeptMap: Record<string, string> = {};
  (users ?? []).forEach((u: any) => { if (u.department_id) userDeptMap[u.id] = u.department_id; });
  (progress ?? []).forEach((p: any) => {
    const deptId = userDeptMap[p.user_id];
    if (deptId && p.status === 'completed' && deptMap[deptId]) deptMap[deptId].completedSet.add(p.user_id);
  });
  const data = Object.values(deptMap)
    .filter(d => d.total.size > 0)
    .map(d => ({
      department_name: d.name,
      total_users: d.total.size,
      completed_users: d.completedSet.size,
      completion_rate: Math.round((d.completedSet.size / d.total.size) * 100),
    }))
    .sort((a, b) => a.department_name.localeCompare(b.department_name));
  return { data, error: null };
};

export const getOverdueTracks = () =>
  supabase.from('v_overdue_tracks').select('*');

// ─── MONTHLY COMPLETIONS ──────────────────────────────────
export const getMonthlyCompletions = () =>
  supabase
    .from('user_course_progress')
    .select('completed_at')
    .eq('status', 'completed')
    .not('completed_at', 'is', null);

export const getMonthlyCertificates = () =>
  supabase
    .from('certificates')
    .select('issued_at');

// ─── TOP COURSES ──────────────────────────────────────────
export const getTopCourses = () =>
  supabase
    .from('user_course_progress')
    .select('course_id, courses(title)')
    .eq('status', 'completed');

// ─── RECENT ACTIVITY (real tables, not audit_logs) ────────
export const getRecentActivity = async (): Promise<{ data: any[]; error: null }> => {
  const [{ data: completions }, { data: certs }] = await Promise.all([
    supabase
      .from('user_course_progress')
      .select('id, completed_at, user_id, course_id, user:users(id,name,email), course:courses(id,title)')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10),
    supabase
      .from('certificates')
      .select('id, issued_at, user_id, course_id, user:users(id,name,email), course:courses(id,title)')
      .order('issued_at', { ascending: false })
      .limit(10),
  ]);
  const events = [
    ...(completions ?? []).map((c: any) => ({
      id: `cp-${c.id}`,
      action: 'COMPLETE_LESSON',
      created_at: c.completed_at,
      user: c.user,
      meta: c.course?.title,
    })),
    ...(certs ?? []).map((c: any) => ({
      id: `cert-${c.id}`,
      action: 'ISSUE_CERTIFICATE',
      created_at: c.issued_at,
      user: c.user,
      meta: c.course?.title,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);
  return { data: events, error: null };
};

export const getActivityFeed = async (): Promise<{ data: any[]; error: null }> => {
  const [{ data: completions }, { data: certs }, { data: newUsers }] = await Promise.all([
    supabase
      .from('user_course_progress')
      .select('id, completed_at, user_id, course_id, user:users(id,name,email,role), course:courses(id,title)')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(100),
    supabase
      .from('certificates')
      .select('id, issued_at, user_id, course_id, user:users(id,name,email,role), course:courses(id,title)')
      .order('issued_at', { ascending: false })
      .limit(100),
    supabase
      .from('users')
      .select('id, created_at, name, email, role')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  const events = [
    ...(completions ?? []).map((c: any) => ({
      id: `cp-${c.id}`,
      action: 'COMPLETE_LESSON',
      created_at: c.completed_at,
      user: c.user,
      entity_type: 'course',
      entity_id: c.course_id,
      meta: c.course?.title,
      ip_address: null,
    })),
    ...(certs ?? []).map((c: any) => ({
      id: `cert-${c.id}`,
      action: 'ISSUE_CERTIFICATE',
      created_at: c.issued_at,
      user: c.user,
      entity_type: 'certificate',
      entity_id: c.course_id,
      meta: c.course?.title,
      ip_address: null,
    })),
    ...(newUsers ?? []).map((u: any) => ({
      id: `user-${u.id}`,
      action: 'CREATE_USER',
      created_at: u.created_at,
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
      entity_type: 'user',
      entity_id: u.id,
      meta: u.name,
      ip_address: null,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 200);
  return { data: events, error: null };
};

// ─── COURSE MODULES & LESSONS ────────────────────────────
export const getCourseModules = (courseId: string) =>
  supabase
    .from('course_modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('sort_order');

export const createModule = (data: Record<string, unknown>) =>
  supabase.from('course_modules').insert(data).select().single();

export const updateModule = (id: string, data: Record<string, unknown>) =>
  supabase.from('course_modules').update(data).eq('id', id);

export const deleteModule = (id: string) =>
  supabase.from('course_modules').delete().eq('id', id);

export const createLesson = (data: Record<string, unknown>) =>
  supabase.from('lessons').insert(data).select().single();

export const updateLesson = (id: string, data: Record<string, unknown>) =>
  supabase.from('lessons').update(data).eq('id', id);

export const deleteLesson = (id: string) =>
  supabase.from('lessons').delete().eq('id', id);

// ─── COURSE EXAM ──────────────────────────────────────────
export const getCourseQuiz = (courseId: string) =>
  supabase
    .from('quizzes')
    .select('*, questions:quiz_questions(*, answers:quiz_answers(*))')
    .eq('course_id', courseId)
    .maybeSingle();

export const createCourseQuiz = (data: Record<string, unknown>) =>
  supabase.from('quizzes').insert(data).select().single();

export const updateCourseQuiz = (id: string, data: Record<string, unknown>) =>
  supabase.from('quizzes').update(data).eq('id', id);

export const addExamQuestion = (data: Record<string, unknown>) =>
  supabase.from('quiz_questions').insert(data).select().single();

export const updateExamQuestion = (id: string, question_text: string) =>
  supabase.from('quiz_questions').update({ question_text }).eq('id', id);

export const deleteExamQuestion = (id: string) =>
  supabase.from('quiz_questions').delete().eq('id', id);

export const addExamAlternative = (data: Record<string, unknown>) =>
  supabase.from('quiz_answers').insert(data).select().single();

export const updateExamAlternative = (id: string, data: Record<string, unknown>) =>
  supabase.from('quiz_answers').update(data).eq('id', id);

export const deleteExamAlternative = (id: string) =>
  supabase.from('quiz_answers').delete().eq('id', id);

export const saveExamAttempt = (data: Record<string, unknown>) =>
  supabase.from('user_quiz_attempts').insert(data).select().single();

export const getUserExamAttempts = (userId: string, quizId: string) =>
  supabase
    .from('user_quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false });
