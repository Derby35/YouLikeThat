import { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
const EMPTY = { name: '', position: 'QB', jerseyNumber: '', team: '', age: '', college: '', height: '', weight: '' };

const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    const [pRes, tRes] = await Promise.all([api.get('/api/players'), api.get('/api/teams')]);
    setPlayers(pRes.data);
    setTeams(tRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY, team: teams[0]?._id || '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setForm({
      name: p.name, position: p.position, jerseyNumber: p.jerseyNumber || '',
      team: p.team?._id || '', age: p.age || '', college: p.college || '',
      height: p.height || '', weight: p.weight || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, jerseyNumber: Number(form.jerseyNumber) || undefined, age: Number(form.age) || undefined, weight: Number(form.weight) || undefined };
      if (editTarget) {
        await api.put(`/api/players/${editTarget._id}`, payload);
      } else {
        await api.post('/api/players', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save player');
    }
  };

  const handleDelete = async () => {
    await api.delete(`/api/players/${deleteTarget}`);
    setDeleteTarget(null);
    load();
  };

  const filtered = players.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-state">Loading players...</div>;

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this player? Their stat records and watchlist entries will remain but will be orphaned."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-close-row">
              <h3>{editTarget ? 'Edit Player' : 'Add Player'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Patrick Mahomes" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select className="form-select" value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <select className="form-select" value={form.team}
                    onChange={(e) => setForm({ ...form, team: e.target.value })} required>
                    <option value="">Select team...</option>
                    {teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jersey Number</label>
                  <input className="form-input" type="number" value={form.jerseyNumber}
                    onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
                    placeholder="e.g. 15" min={1} max={99} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 28" />
                </div>
                <div className="form-group">
                  <label className="form-label">College</label>
                  <input className="form-input" value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="e.g. Alabama" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Height</label>
                  <input className="form-input" value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder='e.g. 6&apos;3"' />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (lbs)</label>
                  <input className="form-input" type="number" value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 220" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTarget ? 'Save Changes' : 'Add Player'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Manage Players</h1>
          <p>{players.length} players in database</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Player</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">&#9906;</span>
          <input className="search-input" placeholder="Search players..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Pos</th><th>Team</th><th>Age</th><th>College</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td><span className="player-number">#{p.jerseyNumber}</span></td>
                <td style={{ fontWeight: '600' }}>{p.name}</td>
                <td><span className={`pos-badge pos-${p.position}`}>{p.position}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="team-dot" style={{ background: p.team?.primaryColor || '#666' }} />
                    <span style={{ color: 'var(--text-dim)' }}>{p.team?.abbreviation}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-dim)' }}>{p.age}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{p.college || '—'}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPlayers;
