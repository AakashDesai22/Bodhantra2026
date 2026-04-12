import { Routes, Route } from 'react-router-dom';
import { MainLayout, ProtectedRoute } from '@/components';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import RegistrationPage from '@/features/participant/RegistrationPage';
import ParticipantDashboard from '@/features/participant/ParticipantDashboard';
import AdminDashboard from '@/features/admin/AdminDashboard';
import JackpotDisplay from '@/features/admin/allocation/reveal-games/jackpot/JackpotDisplay';
import TechnicalReveal from '@/features/admin/winner/TechnicalReveal';
import VaultVideoReveal from '@/features/admin/winner/VaultVideoReveal';
import JackpotReveal from '@/features/admin/winner/JackpotReveal';
import ProfilePage from '@/features/profile/ProfilePage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/event/:slug" element={<LandingPage />} />
        <Route path="/event/:slug/register" element={<RegistrationPage />} />

        {/* Protected: Participant */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ParticipantDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Profile (All roles) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected: Admin + Member Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={['admin', 'member']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Empty Layout for Fullscreen Projection Displays */}
      <Route
        path="/admin/display/jackpot"
        element={
          <ProtectedRoute requiredRole={['admin', 'member']}>
            <JackpotDisplay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/display/technical"
        element={
          <ProtectedRoute requiredRole={['admin', 'member']}>
            <TechnicalReveal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/display/vault"
        element={
          <ProtectedRoute requiredRole={['admin', 'member']}>
            <VaultVideoReveal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/display/slotmachine"
        element={
          <ProtectedRoute requiredRole={['admin', 'member']}>
            <JackpotReveal />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
