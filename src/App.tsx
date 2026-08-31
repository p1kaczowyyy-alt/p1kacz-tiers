import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';
import UsernameSetupGate from './components/UsernameSetupGate';

import Rankings from './pages/Rankings';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Statistics from './pages/Statistics';
import Rules from './pages/Rules';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <UsernameSetupGate>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Rankings />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/players" element={<Players />} />
            <Route path="/player/:username" element={<PlayerProfile />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <UserProfile />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RequireAdmin>
                  <AdminPanel />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </UsernameSetupGate>
  );
}
