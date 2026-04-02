import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Watchlists from './pages/Watchlists';
import WatchlistDetail from './pages/WatchlistDetail';
import Admin from './pages/Admin';
import ManageUsers from './pages/ManageUsers';

const App = () => (
  <Routes>
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"      element={<Dashboard />} />
      <Route path="players"        element={<Players />} />
      <Route path="players/:id"    element={<PlayerDetail />} />
      <Route path="watchlists"     element={<Watchlists />} />
      <Route path="watchlists/:id" element={<WatchlistDetail />} />
      <Route path="admin"          element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="manage-users"   element={<AdminRoute><ManageUsers /></AdminRoute>} />
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
