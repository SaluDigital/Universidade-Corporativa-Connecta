import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getUserCourseProgress } from '../../lib/api';
import { Loader2 } from 'lucide-react';

export function LessonPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    getUserCourseProgress(user.id).then(({ data }) => {
      const progress = (data ?? []) as any[];

      // Prioridade: em andamento mais recentemente acessado
      const inProgress = progress
        .filter(p => p.status === 'in_progress')
        .sort((a, b) => new Date(b.last_access_at ?? 0).getTime() - new Date(a.last_access_at ?? 0).getTime());

      if (inProgress.length > 0) {
        navigate(`/employee/courses/${inProgress[0].course_id}`, { replace: true });
      } else {
        navigate('/employee/courses', { replace: true });
      }
    });
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#6B35B0]" />
    </div>
  );
}
