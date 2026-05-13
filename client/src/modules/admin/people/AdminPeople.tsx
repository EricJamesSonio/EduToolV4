import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminEducatorPage from './pages/AdminEducatorPage';
import AdminStudentPage from './pages/AdminStudentPage';
import PeopleCategoryPage from './pages/PeopleCategoryPage';
import { useEducators } from './hooks/useEducators';
import { useStudents } from './hooks/useStudents';

type PeopleView = 'categories' | 'students' | 'educators';

export const AdminPeople: React.FC = () => {
  const [view, setView] = useState<PeopleView>('categories');
  const { data: students = [] } = useStudents();
  const { data: educators = [] } = useEducators();

  const renderContent = () => {
    if (view === 'students') {
      return <AdminStudentPage onBack={() => setView('categories')} />;
    }

    if (view === 'educators') {
      return <AdminEducatorPage onBack={() => setView('categories')} />;
    }

    return (
      <PeopleCategoryPage
        studentCount={students.length}
        educatorCount={educators.length}
        onSelectStudents={() => setView('students')}
        onSelectEducators={() => setView('educators')}
      />
    );
  };

  return (
    <AdminLayout>
      <div className="admin-people">
        <div className="admin-people-content">{renderContent()}</div>
      </div>
    </AdminLayout>
  );
};
