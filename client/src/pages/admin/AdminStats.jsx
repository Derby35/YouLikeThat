import { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const EMPTY_STAT = {
  player: '', season: new Date().getFullYear(),
  gamesPlayed: '', passingYards: '', passingTouchdowns: '', interceptions: '', completionPct: '',
  rushingYards: '', rushingTouchdowns: '', rushingAttempts: '',
  receivingYards: '', receivingTouchdowns: '', receptions: '', targets: '',
  sacks: '', tackles: '', fantasyPoints: '',
};

const numField = (val) => (val !== '' && val !== undefined ? Number(val) : 0);

const AdminStats = () => {
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_STAT);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');

  const load = async () => {
    const [sRes, pRes] = await Promise.all([api.get('/api/stats'), api.get('/api/players')]);
    setStats(sRes.data);
    setPlayers(pRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_STAT, player: players[0]?._id || '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      player: s.player?._id || '', season: s.season,
      gamesPlayed: s.gamesPlayed, passingYards: s.passingYards, passingTouchdowns: s.passingTouchdowns,
      interceptions: s.interceptions, completionPct: s.completionPct,
      rushingYards: s.rushingYards, rushingTouchdowns: s.rushingTouchdowns, rushingAttempts: s.rushingAttempts,
      receivingYards: s.receivingYards, receivingTouchdowns: s.receivingTouchdowns, receptions: s.receptions,
      targets: s.targets, sacks: s.sacks, tackles: s.tackles, fantasyPoints: s.fantasyPoints,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, k === 'player' ? v : numField(v)])
      );
      payload.player = form.player;
      payload.season = Number(form.season);
      if (editTarget) {
        await api.put(`/api/stats/${editTarget._id}`, payload);
      } else {
        await api.post('/api/stats', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save stat record');
    }
  };

  const handleDelete = async () => {
    await api.delete(`/api/stats/${deleteTarget}`);
    setDeleteTarget(null);
    load();
  };

  const filtered = playerFilter ? stats.filter((s) => s.player?._id === playerFilter) : stats;

  if (loading) return <div className="loading-state">Loading stat records...</div>;

  const F = ({ label, field, type = 'number' }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder="0" />
    </div>
  );

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this stat record permanently?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-close-row">
              <h3>{editTarget ? 'Edit Stat Record' : 'Add Stat Record'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Player</label>
                  <select className="form-select" value={form.player}
                    onChange={(e) => setForm({ ...form, player: e.target.value })} required>
                    <option value="">Select player...</option>
                    {players.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.position})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Season</label>
                  <input className="form-input" type="number" value={form.season}
                    onChange={(e) => setForm({ ...form, season: e.target.value })} min={2000} max={2030} required />
                </div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 12px' }}>
                Passing Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <F label="Games Played" field="gamesPlayed" />
                <F label="Passing Yards" field="passingYards" />
                <F label="Pass TDs" field="passingTouchdowns" />
                <F label="Interceptions" field="interceptions" />
                <F label="Completion %" field="completionPct" />
              </div>

              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '12px 0 12px' }}>
                Rushing Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <F label="Rush Yards" field="rushingYards" />
                <F label="Rush TDs" field="rushingTouchdowns" />
                <F label="Attempts" field="rushingAttempts" />
              </div>

              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '12px 0 12px' }}>
                Receiving Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <F label="Rec Yards" field="receivingYards" />
                <F label="Rec TDs" field="receivingTouchdowns" />
                <F label="Receptions" field="receptions" />
                <F label="Targets" field="targets" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                <F label="Tackles" field="tackles" />
                <F label="Sacks" field="sacks" />
                <F label="Fantasy Points" field="fantasyPoints" />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTarget ? 'Save Changes' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Manage Stat Records</h1>
          <p>{stats.length} total records</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Stat Record</button>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)}>
          <option value="">All Players</option>
          {players.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Player</th><th>Pos</th><th>Season</th><th>GP</th>
              <th>Pass Yds</th><th>Pass TD</th><th>Rush Yds</th><th>Rec Yds</th>
              <th>TDs</th><th>Fant Pts</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No records found.</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: '600' }}>{s.player?.name}</td>
                  <td><span className={`pos-badge pos-${s.player?.position}`}>{s.player?.position}</span></td>
                  <td><strong>{s.season}</strong></td>
                  <td>{s.gamesPlayed}</td>
                  <td>{s.passingYards || '—'}</td>
                  <td>{s.passingTouchdowns || '—'}</td>
                  <td>{s.rushingYards || '—'}</td>
                  <td>{s.receivingYards || '—'}</td>
                  <td>{(s.passingTouchdowns || 0) + (s.rushingTouchdowns || 0) + (s.receivingTouchdowns || 0) || '—'}</td>
                  <td><strong style={{ color: 'var(--accent-gold)' }}>{s.fantasyPoints?.toFixed(1)}</strong></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStats;
