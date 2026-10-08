import type { User, Department, Position, Course, Track, UserTrack, UserCourseProgress, Certificate, AuditLog } from '../types';

export const mockDepartments: Department[] = [
  { id: 'd1', name: 'Comercial', description: 'Equipe de vendas e atendimento', created_at: '2024-01-01' },
  { id: 'd2', name: 'Customer Success', description: 'Sucesso e retenção de clientes', created_at: '2024-01-01' },
  { id: 'd3', name: 'Operações', description: 'Processos operacionais', created_at: '2024-01-01' },
  { id: 'd4', name: 'Marketing', description: 'Marketing e comunicação', created_at: '2024-01-01' },
  { id: 'd5', name: 'Tecnologia', description: 'Desenvolvimento e infraestrutura', created_at: '2024-01-01' },
  { id: 'd6', name: 'RH', description: 'Recursos Humanos', created_at: '2024-01-01' },
];

export const mockPositions: Position[] = [
  { id: 'p1', name: 'Consultor de Vendas', department_id: 'd1', created_at: '2024-01-01' },
  { id: 'p2', name: 'Gerente Comercial', department_id: 'd1', created_at: '2024-01-01' },
  { id: 'p3', name: 'Analista de CS', department_id: 'd2', created_at: '2024-01-01' },
  { id: 'p4', name: 'Coordenador de CS', department_id: 'd2', created_at: '2024-01-01' },
  { id: 'p5', name: 'Analista de Marketing', department_id: 'd4', created_at: '2024-01-01' },
  { id: 'p6', name: 'Desenvolvedor', department_id: 'd5', created_at: '2024-01-01' },
  { id: 'p7', name: 'Analista de RH', department_id: 'd6', created_at: '2024-01-01' },
];

export const mockUsers: User[] = [
  {
    id: 'u1', name: 'Admin SuperDental', email: 'admin@superdental.com.br',
    role: 'admin', department_id: 'd6', position_id: 'p7',
    hire_date: '2022-01-01', status: 'active',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    created_at: '2022-01-01',
  },
  {
    id: 'u2', name: 'Carlos Mendes', email: 'carlos.mendes@superdental.com.br',
    role: 'manager', department_id: 'd1', position_id: 'p2',
    hire_date: '2022-03-15', status: 'active',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    created_at: '2022-03-15',
  },
  {
    id: 'u3', name: 'Ana Paula Lima', email: 'ana.lima@superdental.com.br',
    role: 'employee', department_id: 'd1', position_id: 'p1', manager_id: 'u2',
    hire_date: '2023-06-01', status: 'active',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
    created_at: '2023-06-01',
  },
  {
    id: 'u4', name: 'Pedro Souza', email: 'pedro.souza@superdental.com.br',
    role: 'employee', department_id: 'd1', position_id: 'p1', manager_id: 'u2',
    hire_date: '2023-08-10', status: 'active',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
    created_at: '2023-08-10',
  },
  {
    id: 'u5', name: 'Fernanda Costa', email: 'fernanda.costa@superdental.com.br',
    role: 'employee', department_id: 'd2', position_id: 'p3', manager_id: 'u2',
    hire_date: '2023-09-20', status: 'active',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fernanda',
    created_at: '2023-09-20',
  },
  {
    id: 'u6', name: 'Rafael Torres', email: 'rafael.torres@superdental.com.br',
    role: 'employee', department_id: 'd1', position_id: 'p1', manager_id: 'u2',
    hire_date: '2024-01-05', status: 'active',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafael',
    created_at: '2024-01-05',
  },
  {
    id: 'u7', name: 'Juliana Rocha', email: 'juliana.rocha@superdental.com.br',
    role: 'employee', department_id: 'd4', position_id: 'p5', manager_id: 'u2',
    hire_date: '2024-02-14', status: 'inactive',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juliana',
    created_at: '2024-02-14',
  },
];

export const mockCourses: Course[] = [
  {
    id: 'c1', title: 'Onboarding Geral SuperDental', description: 'Introdução à cultura, valores e processos da SuperDental.',
    category: 'Onboarding', thumbnail_url: '', workload_hours: 8, is_active: true,
    has_certificate: true, requires_exam: true, minimum_grade: 70, version: 2,
    created_by: 'u1', created_at: '2024-01-01',
  },
  {
    id: 'c2', title: 'Código de Cultura e Valores', description: 'Entenda os pilares que guiam nossa empresa.',
    category: 'Cultura', thumbnail_url: '', workload_hours: 4, is_active: true,
    has_certificate: true, requires_exam: false, version: 1,
    created_by: 'u1', created_at: '2024-01-01',
  },
  {
    id: 'c3', title: 'CRM e Funil de Vendas', description: 'Aprenda a usar o CRM e entenda o funil comercial.',
    category: 'Comercial', thumbnail_url: '', workload_hours: 6, is_active: true,
    has_certificate: true, requires_exam: true, minimum_grade: 75, version: 3,
    created_by: 'u1', created_at: '2024-01-15',
  },
  {
    id: 'c4', title: 'Atendimento e Conversão', description: 'Técnicas de atendimento de alta conversão.',
    category: 'Comercial', thumbnail_url: '', workload_hours: 10, is_active: true,
    has_certificate: true, requires_exam: true, minimum_grade: 80, version: 1,
    created_by: 'u1', created_at: '2024-02-01',
  },
  {
    id: 'c5', title: 'Liderança e Gestão de Pessoas', description: 'Desenvolvendo habilidades de liderança.',
    category: 'Gestão', thumbnail_url: '', workload_hours: 12, is_active: true,
    has_certificate: true, requires_exam: true, minimum_grade: 70, version: 1,
    created_by: 'u1', created_at: '2024-02-15',
  },
  {
    id: 'c6', title: 'Feedback e Comunicação', description: 'Como dar e receber feedback de forma eficaz.',
    category: 'Gestão', thumbnail_url: '', workload_hours: 6, is_active: true,
    has_certificate: false, requires_exam: false, version: 1,
    created_by: 'u1', created_at: '2024-03-01',
  },
  {
    id: 'c7', title: 'Gestão por Indicadores', description: 'OKRs, KPIs e gestão baseada em dados.',
    category: 'Gestão', thumbnail_url: '', workload_hours: 8, is_active: true,
    has_certificate: true, requires_exam: true, minimum_grade: 75, version: 2,
    created_by: 'u1', created_at: '2024-03-15',
  },
  {
    id: 'c8', title: 'Tráfego Pago Avançado', description: 'Google Ads, Meta Ads e estratégias de conversão.',
    category: 'Marketing', thumbnail_url: '', workload_hours: 16, is_active: true,
    has_certificate: true, requires_exam: true, minimum_grade: 80, version: 1,
    created_by: 'u1', created_at: '2024-04-01',
  },
];

export const mockTracks: Track[] = [
  {
    id: 't1', title: 'Trilha Onboarding Geral', description: 'Trilha obrigatória para todos os novos colaboradores.',
    target_type: 'department', deadline_days: 30, is_mandatory: true, is_blocking: true,
    is_active: true, created_by: 'u1', created_at: '2024-01-01',
  },
  {
    id: 't2', title: 'Trilha Comercial', description: 'Formação completa para a área comercial.',
    target_type: 'department', deadline_days: 60, is_mandatory: true, is_blocking: false,
    is_active: true, created_by: 'u1', created_at: '2024-01-01',
  },
  {
    id: 't3', title: 'Trilha Gestores', description: 'Desenvolvimento de lideranças da SuperDental.',
    target_type: 'position', deadline_days: 90, is_mandatory: true, is_blocking: false,
    is_active: true, created_by: 'u1', created_at: '2024-02-01',
  },
  {
    id: 't4', title: 'Trilha Tráfego Pago', description: 'Especialização em mídia paga para o time de marketing.',
    target_type: 'department', deadline_days: 45, is_mandatory: false, is_blocking: false,
    is_active: true, created_by: 'u1', created_at: '2024-04-01',
  },
];

export const mockUserTracks: UserTrack[] = [
  { id: 'ut1', user_id: 'u3', track_id: 't1', assigned_at: '2023-06-01', deadline_at: '2023-07-01', status: 'completed', progress_percent: 100, completed_at: '2023-06-25' },
  { id: 'ut2', user_id: 'u3', track_id: 't2', assigned_at: '2023-06-01', deadline_at: '2023-08-01', status: 'in_progress', progress_percent: 65 },
  { id: 'ut3', user_id: 'u4', track_id: 't1', assigned_at: '2023-08-10', deadline_at: '2023-09-10', status: 'completed', progress_percent: 100, completed_at: '2023-09-05' },
  { id: 'ut4', user_id: 'u4', track_id: 't2', assigned_at: '2023-08-10', deadline_at: '2023-10-10', status: 'overdue', progress_percent: 30 },
  { id: 'ut5', user_id: 'u5', track_id: 't1', assigned_at: '2023-09-20', deadline_at: '2023-10-20', status: 'in_progress', progress_percent: 75 },
  { id: 'ut6', user_id: 'u6', track_id: 't1', assigned_at: '2024-01-05', deadline_at: '2024-02-05', status: 'not_started', progress_percent: 0 },
  { id: 'ut7', user_id: 'u2', track_id: 't3', assigned_at: '2024-02-01', deadline_at: '2024-05-01', status: 'in_progress', progress_percent: 45 },
];

export const mockCourseProgress: UserCourseProgress[] = [
  { id: 'cp1', user_id: 'u3', course_id: 'c1', status: 'completed', progress_percent: 100, started_at: '2023-06-02', completed_at: '2023-06-10', grade: 88, last_access_at: '2023-06-10' },
  { id: 'cp2', user_id: 'u3', course_id: 'c2', status: 'completed', progress_percent: 100, started_at: '2023-06-11', completed_at: '2023-06-15', last_access_at: '2023-06-15' },
  { id: 'cp3', user_id: 'u3', course_id: 'c3', status: 'in_progress', progress_percent: 55, started_at: '2023-07-01', last_access_at: '2023-07-20' },
  { id: 'cp4', user_id: 'u4', course_id: 'c1', status: 'completed', progress_percent: 100, started_at: '2023-08-12', completed_at: '2023-08-25', grade: 92, last_access_at: '2023-08-25' },
  { id: 'cp5', user_id: 'u5', course_id: 'c1', status: 'in_progress', progress_percent: 70, started_at: '2023-09-22', last_access_at: '2023-10-01' },
];

export const mockCertificates: Certificate[] = [
  { id: 'cert1', user_id: 'u3', course_id: 'c1', certificate_code: 'SD-2024-C1-U3-001', issued_at: '2023-06-10' },
  { id: 'cert2', user_id: 'u3', course_id: 'c2', certificate_code: 'SD-2024-C2-U3-002', issued_at: '2023-06-15' },
  { id: 'cert3', user_id: 'u4', course_id: 'c1', certificate_code: 'SD-2024-C1-U4-003', issued_at: '2023-08-25' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'log1', user_id: 'u1', action: 'CREATE_USER', entity_type: 'user', entity_id: 'u6', ip_address: '192.168.1.1', created_at: '2024-01-05T09:00:00' },
  { id: 'log2', user_id: 'u1', action: 'ASSIGN_TRACK', entity_type: 'user_track', entity_id: 'ut6', ip_address: '192.168.1.1', created_at: '2024-01-05T09:05:00' },
  { id: 'log3', user_id: 'u3', action: 'COMPLETE_LESSON', entity_type: 'lesson', entity_id: 'l1', ip_address: '192.168.1.10', created_at: '2024-01-10T14:30:00' },
  { id: 'log4', user_id: 'u1', action: 'CREATE_COURSE', entity_type: 'course', entity_id: 'c8', ip_address: '192.168.1.1', created_at: '2024-04-01T11:00:00' },
  { id: 'log5', user_id: 'u4', action: 'SUBMIT_QUIZ', entity_type: 'quiz', entity_id: 'q1', ip_address: '192.168.1.15', created_at: '2024-03-15T16:20:00' },
];

export const completionByDepartment = [
  { name: 'Comercial', rate: 68, total: 45, completed: 31 },
  { name: 'CS', rate: 82, total: 20, completed: 16 },
  { name: 'Operações', rate: 55, total: 30, completed: 17 },
  { name: 'Marketing', rate: 91, total: 15, completed: 14 },
  { name: 'Tecnologia', rate: 75, total: 25, completed: 19 },
  { name: 'RH', rate: 100, total: 8, completed: 8 },
];

export const monthlyProgress = [
  { month: 'Out', completions: 12, certificates: 8 },
  { month: 'Nov', completions: 19, certificates: 14 },
  { month: 'Dez', completions: 8, certificates: 5 },
  { month: 'Jan', completions: 25, certificates: 18 },
  { month: 'Fev', completions: 32, certificates: 24 },
  { month: 'Mar', completions: 28, certificates: 21 },
  { month: 'Abr', completions: 41, certificates: 35 },
];

export const topCourses = [
  { name: 'Onboarding Geral', completions: 68, rate: 94 },
  { name: 'Código de Cultura', completions: 61, rate: 88 },
  { name: 'CRM e Funil', completions: 43, rate: 72 },
  { name: 'Atendimento', completions: 38, rate: 65 },
  { name: 'Tráfego Pago', completions: 12, rate: 48 },
];
