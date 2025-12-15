import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { getCurrentUser, logoutUser } from './services/storageService';
import Auth from './components/Auth';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const u = getCurrentUser();
    setUser(u);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-indigo-600">Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return user.role === UserRole.TEACHER ? (
    <TeacherDashboard user={user} onLogout={handleLogout} />
  ) : (
    <StudentDashboard user={user} onLogout={handleLogout} />
  );
};

export default App;