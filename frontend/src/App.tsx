import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.js';
import { AppHeader } from './components/AppHeader.js';
import { Home } from './pages/Home.js';
import { Landing } from './pages/Landing.js';
import { Login } from './pages/Login.js';
import { ApplicationForm } from './pages/ApplicationForm.js';
import { ApplicationDetail } from './pages/ApplicationDetail.js';

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
      Loading…
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-[1120px] px-6 pb-24 pt-7">{children}</main>
    </>
  );
}

export function App() {
  const { status } = useAuth();

  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'anonymous') {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<ApplicationForm />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/applications/:id/edit" element={<ApplicationForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
