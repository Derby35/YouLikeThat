import { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

const emptyForm = { username: '', password: '', role: 'standard' };

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/api/users');
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/users', form);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/users/${userId}/role`, { role: newRole });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/users/${deleteTarget}`);
    setDeleteTarget(null);
    load();
  };

  if (loading) return <div className="loading-state">Loading users...</div>;

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this user? Their watchlists will be removed."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add User</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Manage Users</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '2px' }}>
              {users.length} registered {users.length === 1 ? 'user' : 'users'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>Add User</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u._id === currentUser?.id;
                const isProtected = u.username === 'admin';
                const canEdit = !isSelf && !isProtected;
                return (
                  <tr key={u._id}>
                    <td style={{ fontWeight: '600' }}>
                      {u.username}
                      {isSelf && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>(you)</span>
                      )}
                    </td>
                    <td>
                      {canEdit ? (
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        >
                          <option value="standard">Standard</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="navbar-role-badge">{u.role}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-dim)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {canEdit && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteTarget(u._id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
