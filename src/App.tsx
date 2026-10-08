import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { CoursesPage } from './pages/admin/CoursesPage';
import { TracksPage } from './pages/admin/TracksPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { RulesPage } from './pages/admin/RulesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { CertificatesPage } from './pages/admin/CertificatesPage';
import { LogsPage } from './pages/admin/LogsPage';

// Manager pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { TeamPage } from './pages/manager/TeamPage';
import { ProgressPage } from './pages/manager/ProgressPage';
import { ManagerCertificatesPage } from './pages/manager/ManagerCertificatesPage';
import { AlertsPage } from './pages/manager/AlertsPage';

// Employee pages
import { MyTrackPage } from './pages/employee/MyTrackPage';
import { MyCoursesPage } from './pages/employee/MyCoursesPage';
import { CourseDetailPage } from './pages/employee/CourseDetailPage';
import { LessonPage } from './pages/employee/LessonPage';
import { MyCertificatesPage } from './pages/employee/MyCertificatesPage';
import { HistoryPage } from './pages/employee/HistoryPage';

// Admin course management pages
import { CourseExamPage } from './pages/admin/CourseExamPage';
import { CourseModulesPage } from './pages/admin/CourseModulesPage';

import type { UserRole } from './types';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/employee" replace />;
}

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/admin': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
  '/admin/users': { title: 'Usuários', subtitle: 'Gestão de colaboradores' },
  '/admin/departments': { title: 'Departamentos', subtitle: 'Áreas e cargos' },
  '/admin/courses': { title: 'Cursos', subtitle: 'Gestão de conteúdo' },
  '/admin/tracks': { title: 'Trilhas', subtitle: 'Jornadas de aprendizado' },
  '/admin/rules': { title: 'Regras', subtitle: 'Atribuição automática' },
  '/admin/reports': { title: 'Relatórios', subtitle: 'Analytics e insights' },
  '/admin/certificates': { title: 'Certificados', subtitle: 'Certificados emitidos' },
  '/admin/logs': { title: 'Logs', subtitle: 'Auditoria do sistema' },
  '/admin/courses/exam': { title: 'Banco de Perguntas', subtitle: 'Gestão da prova do curso' },
  '/admin/courses/modules': { title: 'Módulos e Aulas', subtitle: 'Conteúdo do curso' },
  '/manager': { title: 'Minha Equipe', subtitle: 'Painel do gestor' },
  '/manager/team': { title: 'Colaboradores', subtitle: 'Sua equipe' },
  '/manager/progress': { title: 'Progresso', subtitle: 'Acompanhamento de trilhas' },
  '/manager/certificates': { title: 'Certificados', subtitle: 'Certificados da equipe' },
  '/manager/alerts': { title: 'Alertas', subtitle: 'Pendências e atrasos' },
  '/employee': { title: 'Minha Trilha', subtitle: 'Sua jornada de aprendizado' },
  '/employee/courses': { title: 'Meus Cursos', subtitle: 'Conteúdo disponível' },
  '/employee/courses/detail': { title: 'Detalhes do Curso', subtitle: 'Conteúdo e avaliação' },
  '/employee/lesson': { title: 'Aula', subtitle: 'Em andamento' },
  '/employee/certificates': { title: 'Certificados', subtitle: 'Suas conquistas' },
  '/employee/history': { title: 'Histórico', subtitle: 'Seu percurso completo' },
};

function LayoutWithTitle({ path }: { path: string }) {
  const info = pageTitles[path] ?? { title: 'SaluDigital LMS' };
  return <Layout title={info.title} subtitle={info.subtitle} />;
}

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
        </Route>
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/users" /></ProtectedRoute>}>
          <Route index element={<UsersPage />} />
        </Route>
        <Route path="/admin/departments" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/departments" /></ProtectedRoute>}>
          <Route index element={<DepartmentsPage />} />
        </Route>
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/courses" /></ProtectedRoute>}>
          <Route index element={<CoursesPage />} />
        </Route>
        <Route path="/admin/courses/:courseId/modules" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/courses/modules" /></ProtectedRoute>}>
          <Route index element={<CourseModulesPage />} />
        </Route>
        <Route path="/admin/courses/:courseId/exam" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/courses/exam" /></ProtectedRoute>}>
          <Route index element={<CourseExamPage />} />
        </Route>
        <Route path="/admin/tracks" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/tracks" /></ProtectedRoute>}>
          <Route index element={<TracksPage />} />
        </Route>
        <Route path="/admin/rules" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/rules" /></ProtectedRoute>}>
          <Route index element={<RulesPage />} />
        </Route>
        <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/reports" /></ProtectedRoute>}>
          <Route index element={<ReportsPage />} />
        </Route>
        <Route path="/admin/certificates" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/certificates" /></ProtectedRoute>}>
          <Route index element={<CertificatesPage />} />
        </Route>
        <Route path="/admin/logs" element={<ProtectedRoute roles={['admin']}><LayoutWithTitle path="/admin/logs" /></ProtectedRoute>}>
          <Route index element={<LogsPage />} />
        </Route>

        {/* Manager routes */}
        <Route path="/manager" element={<ProtectedRoute roles={['manager', 'admin']}><LayoutWithTitle path="/manager" /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
        </Route>
        <Route path="/manager/team" element={<ProtectedRoute roles={['manager', 'admin']}><LayoutWithTitle path="/manager/team" /></ProtectedRoute>}>
          <Route index element={<TeamPage />} />
        </Route>
        <Route path="/manager/progress" element={<ProtectedRoute roles={['manager', 'admin']}><LayoutWithTitle path="/manager/progress" /></ProtectedRoute>}>
          <Route index element={<ProgressPage />} />
        </Route>
        <Route path="/manager/certificates" element={<ProtectedRoute roles={['manager', 'admin']}><LayoutWithTitle path="/manager/certificates" /></ProtectedRoute>}>
          <Route index element={<ManagerCertificatesPage />} />
        </Route>
        <Route path="/manager/alerts" element={<ProtectedRoute roles={['manager', 'admin']}><LayoutWithTitle path="/manager/alerts" /></ProtectedRoute>}>
          <Route index element={<AlertsPage />} />
        </Route>

        {/* Employee routes */}
        <Route path="/employee" element={<ProtectedRoute><LayoutWithTitle path="/employee" /></ProtectedRoute>}>
          <Route index element={<MyTrackPage />} />
        </Route>
        <Route path="/employee/courses" element={<ProtectedRoute><LayoutWithTitle path="/employee/courses" /></ProtectedRoute>}>
          <Route index element={<MyCoursesPage />} />
        </Route>
        <Route path="/employee/courses/:courseId" element={<ProtectedRoute><LayoutWithTitle path="/employee/courses/detail" /></ProtectedRoute>}>
          <Route index element={<CourseDetailPage />} />
        </Route>
        <Route path="/employee/lesson" element={<ProtectedRoute><LayoutWithTitle path="/employee/lesson" /></ProtectedRoute>}>
          <Route index element={<LessonPage />} />
        </Route>
        <Route path="/employee/certificates" element={<ProtectedRoute><LayoutWithTitle path="/employee/certificates" /></ProtectedRoute>}>
          <Route index element={<MyCertificatesPage />} />
        </Route>
        <Route path="/employee/history" element={<ProtectedRoute><LayoutWithTitle path="/employee/history" /></ProtectedRoute>}>
          <Route index element={<HistoryPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
