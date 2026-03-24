import { useState, useEffect } from 'react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

const emptyPlayer = { name: '', position: 'QB', jerseyNumber: '', teamName: '', teamAbbr: '', age: '' };
const emptyStat   = { player: '', gamesPlayed: '', passingYards: '', passingTDs: '', interceptions: '', rushingYards: '', rushingTDs: '', receivingYards: '', receivingTDs: '', receptions: '', fantasyPoints: '' };

// players tab
const PlayersTab = () => {
  const [players,     setPlayers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(emptyPlayer);
  const [editId,      setEditId]      = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [error,       setError]       = useState('');

  const load = async () => {
    const res = await api.get('/api/players');
    setPlayers(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyPlayer); setEditId(null); setError(''); setShowModal(true); };
  const openEdit   = (p)  => { setForm({ name: p.name, position: p.position, jerseyNumber: p.jerseyNumber || '', teamName: p.teamName || '', teamAbbr: p.teamAbbr || '', age: p.age || '' }); setEditId(p._id); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, jerseyNumber: form.jerseyNumber || undefined, age: form.age || undefined };
      if (editId) {
        await api.put(`/api/players/${editId}`, payload);
      } else {
        await api.post('/api/players', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/players/${deleteTarget}`);
    setDeleteTarget(null);
    load();
  };

  if (loading) return <div className="loading-state">Loading players...</div>;

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this player? Their stats will remain but may become orphaned."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Edit Player' : 'Add Player'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select className="form-select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jersey #</label>
                  <input className="form-input" type="number" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input className="form-input" placeholder="e.g. Kansas City Chiefs" value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Abbr</label>
                  <input className="form-input" placeholder="e.g. KC" value={form.teamAbbr} onChange={(e) => setForm({ ...form, teamAbbr: e.target.value.toUpperCase() })} maxLength={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Player'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>{players.length} players in database</p>
        <button className="btn btn-primary" onClick={openCreate}>Add Player</button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Pos</th><th>Team</th><th>Jersey</th><th>Age</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No players yet.</td></tr>
            ) : (
              players.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td><span className={`pos-badge pos-${p.position}`}>{p.position}</span></td>
                  <td style={{ color: 'var(--text-dim)' }}>{p.teamAbbr || '—'}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{p.jerseyNumber ? `#${p.jerseyNumber}` : '—'}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{p.age || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger  btn-sm" onClick={() => setDeleteTarget(p._id)}>Delete</button>
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

// stats tab
const StatsTab = () => {
  const [stats,       setStats]       = useState([]);
  const [players,     setPlayers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(emptyStat);
  const [editId,      setEditId]      = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [error,       setError]       = useState('');

  const load = async () => {
    const [sRes, pRes] = await Promise.all([
      api.get('/api/stats'),
      api.get('/api/players'),
    ]);
    setStats(sRes.data);
    setPlayers(pRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const num = (v) => v === '' ? undefined : Number(v);

  const openCreate = () => { setForm(emptyStat); setEditId(null); setError(''); setShowModal(true); };
  const openEdit   = (s) => {
    setForm({
      player:         s.player?._id || '',
      gamesPlayed:    s.gamesPlayed  ?? '',
      passingYards:   s.passingYards ?? '',
      passingTDs:     s.passingTDs   ?? '',
      interceptions:  s.interceptions?? '',
      rushingYards:   s.rushingYards ?? '',
      rushingTDs:     s.rushingTDs   ?? '',
      receivingYards: s.receivingYards ?? '',
      receivingTDs:   s.receivingTDs   ?? '',
      receptions:     s.receptions     ?? '',
      fantasyPoints:  s.fantasyPoints  ?? '',
    });
    setEditId(s._id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        player:         form.player,
        season:         2024,
        gamesPlayed:    num(form.gamesPlayed),
        passingYards:   num(form.passingYards),
        passingTDs:     num(form.passingTDs),
        interceptions:  num(form.interceptions),
        rushingYards:   num(form.rushingYards),
        rushingTDs:     num(form.rushingTDs),
        receivingYards: num(form.receivingYards),
        receivingTDs:   num(form.receivingTDs),
        receptions:     num(form.receptions),
        fantasyPoints:  num(form.fantasyPoints),
      };
      if (editId) {
        await api.put(`/api/stats/${editId}`, payload);
      } else {
        await api.post('/api/stats', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/stats/${deleteTarget}`);
    setDeleteTarget(null);
    load();
  };

  const field = (label, key, type = 'number') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  if (loading) return <div className="loading-state">Loading stats...</div>;

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this stat record?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Stat Record' : 'Add Stat Record'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Player</label>
                <select className="form-select" value={form.player} onChange={(e) => setForm({ ...form, player: e.target.value })} required>
                  <option value="">Select a player...</option>
                  {players.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.position})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 16px' }}>
                {field('Games Played',   'gamesPlayed')}
                {field('Passing Yards',  'passingYards')}
                {field('Passing TDs',    'passingTDs')}
                {field('Interceptions',  'interceptions')}
                {field('Rushing Yards',  'rushingYards')}
                {field('Rushing TDs',    'rushingTDs')}
                {field('Rec Yards',      'receivingYards')}
                {field('Rec TDs',        'receivingTDs')}
                {field('Receptions',     'receptions')}
                {field('Fantasy Points', 'fantasyPoints')}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>{stats.length} stat records in database</p>
        <button className="btn btn-primary" onClick={openCreate}>Add Stat Record</button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Player</th><th>Pos</th><th>GP</th>
              <th>Pass Yds</th><th>Pass TD</th>
              <th>Rush Yds</th><th>Rush TD</th>
              <th>Rec Yds</th><th>Rec TD</th><th>REC</th>
              <th>Fant Pts</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No stat records yet.</td></tr>
            ) : (
              stats.map((s) => (
                <tr key={s._id}>
                  <td style={{ fontWeight: '600' }}>{s.player?.name || '—'}</td>
                  <td><span className={`pos-badge pos-${s.player?.position}`}>{s.player?.position}</span></td>
                  <td>{s.gamesPlayed}</td>
                  <td>{s.passingYards   || '—'}</td>
                  <td>{s.passingTDs     || '—'}</td>
                  <td>{s.rushingYards   || '—'}</td>
                  <td>{s.rushingTDs     || '—'}</td>
                  <td>{s.receivingYards || '—'}</td>
                  <td>{s.receivingTDs   || '—'}</td>
                  <td>{s.receptions     || '—'}</td>
                  <td style={{ color: 'var(--accent-orange)', fontWeight: '700' }}>{s.fantasyPoints?.toFixed(1)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger  btn-sm" onClick={() => setDeleteTarget(s._id)}>Delete</button>
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

// main admin page with tab switcher
const Admin = () => {
  const [tab, setTab] = useState('players');

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Admin Panel</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '2px' }}>
          Manage players and stats for the 2024 NFL season.
        </p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'players' ? ' active' : ''}`} onClick={() => setTab('players')}>
          Players
        </button>
        <button className={`tab-btn${tab === 'stats' ? ' active' : ''}`} onClick={() => setTab('stats')}>
          Stats
        </button>
      </div>

      {tab === 'players' && <PlayersTab />}
      {tab === 'stats'   && <StatsTab />}
    </div>
  );
};

export default Admin;
