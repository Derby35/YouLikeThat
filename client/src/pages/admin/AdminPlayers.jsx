import { useState, useEffect } from 'react';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

const EMPTY_PLAYER = {
  name: '', position: 'QB', jerseyNumber: '', teamName: '', teamAbbr: '',
  age: '', college: '', height: '', weight: '', headshotUrl: '', espnId: '',
};

const EMPTY_STATS = {
  gamesPlayed: '', passingYards: '', passingTDs: '', interceptions: '',
  rushingYards: '', rushingTDs: '', receivingYards: '', receivingTDs: '', receptions: '',
};

/* Which stat fields to show per position */
const STAT_FIELDS_BY_POS = {
  QB:  ['gamesPlayed', 'passingYards', 'passingTDs', 'interceptions', 'rushingYards', 'rushingTDs'],
  RB:  ['gamesPlayed', 'rushingYards', 'rushingTDs', 'receptions', 'receivingYards', 'receivingTDs'],
  WR:  ['gamesPlayed', 'receptions', 'receivingYards', 'receivingTDs'],
  TE:  ['gamesPlayed', 'receptions', 'receivingYards', 'receivingTDs'],
  K:   ['gamesPlayed'],
  DEF: ['gamesPlayed'],
};

const STAT_LABELS = {
  gamesPlayed:    'Games Played',
  passingYards:   'Passing Yards',
  passingTDs:     'Passing TDs',
  interceptions:  'Interceptions',
  rushingYards:   'Rushing Yards',
  rushingTDs:     'Rushing TDs',
  receptions:     'Receptions',
  receivingYards: 'Receiving Yards',
  receivingTDs:   'Receiving TDs',
};

const AdminPlayers = () => {
  const [players,      setPlayers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_PLAYER);
  const [stats,        setStats]        = useState(EMPTY_STATS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');

  /* ESPN lookup state */
  const [espnSearch,   setEspnSearch]   = useState('');
  const [espnLoading,  setEspnLoading]  = useState(false);
  const [espnError,    setEspnError]    = useState('');

  const load = async () => {
    const pRes = await api.get('/api/players');
    setPlayers(pRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_PLAYER);
    setStats(EMPTY_STATS);
    setEspnSearch('');
    setEspnError('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setForm({
      name: p.name, position: p.position,
      jerseyNumber: p.jerseyNumber || '', teamName: p.teamName || '',
      teamAbbr: p.teamAbbr || '', age: p.age || '',
      college: p.college || '', height: p.height || '',
      weight: p.weight || '', headshotUrl: p.headshotUrl || '',
      espnId: p.espnId || '',
    });
    setStats(EMPTY_STATS);
    setEspnSearch('');
    setEspnError('');
    setError('');
    setShowModal(true);
  };

  /* ── ESPN auto-fill ── */
  const handleEspnLookup = async () => {
    if (!espnSearch.trim()) return;
    setEspnLoading(true);
    setEspnError('');
    try {
      const res = await api.get(`/api/players/espn-lookup?name=${encodeURIComponent(espnSearch.trim())}`);
      const d   = res.data;

      setForm((prev) => ({
        ...prev,
        name:         d.name         || prev.name,
        position:     POSITIONS.includes(d.position) ? d.position : prev.position,
        jerseyNumber: d.jerseyNumber ?? prev.jerseyNumber,
        teamName:     d.teamName     || prev.teamName,
        teamAbbr:     d.teamAbbr     || prev.teamAbbr,
        age:          d.age          ?? prev.age,
        college:      d.college      || prev.college,
        headshotUrl:  d.headshotUrl  || prev.headshotUrl,
        espnId:       d.espnId       || prev.espnId,
      }));

      if (d.stats && Object.keys(d.stats).length) {
        setStats((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(d.stats)
              .filter(([k]) => k in EMPTY_STATS)
              .map(([k, v]) => [k, v ?? ''])
          ),
        }));
      }
    } catch (err) {
      setEspnError(err.response?.data?.message || 'Player not found on ESPN. Fill in manually.');
    } finally {
      setEspnLoading(false);
    }
  };

  /* ── Submit: create or update ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const playerPayload = {
        ...form,
        jerseyNumber: Number(form.jerseyNumber) || undefined,
        age:          Number(form.age)          || undefined,
        weight:       Number(form.weight)       || undefined,
      };

      if (editTarget) {
        /* update player info only (stats managed in AdminStats) */
        await api.put(`/api/players/${editTarget._id}`, playerPayload);
      } else {
        /* create player — pass stats so server auto-creates the Stat record */
        const statsPayload = Object.fromEntries(
          Object.entries(stats).map(([k, v]) => [k, v === '' ? 0 : Number(v)])
        );
        await api.post('/api/players', { ...playerPayload, stats: statsPayload });
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

  const visibleStatFields = STAT_FIELDS_BY_POS[form.position] || ['gamesPlayed'];

  const filtered = players.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-state">Loading players...</div>;

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this player? Their stats and watchlist appearances will also be permanently removed."
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

            {/* ── ESPN auto-fill (create only) ── */}
            {!editTarget && (
              <div className="espn-lookup-bar">
                <div className="espn-lookup-label">Auto-fill from ESPN</div>
                <div className="espn-lookup-row">
                  <input
                    className="form-input"
                    placeholder="Search player name on ESPN…"
                    value={espnSearch}
                    onChange={(e) => setEspnSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleEspnLookup())}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleEspnLookup}
                    disabled={espnLoading || !espnSearch.trim()}
                  >
                    {espnLoading ? 'Looking up…' : 'Look Up'}
                  </button>
                </div>
                {espnError && <div className="espn-lookup-error">{espnError}</div>}
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>

              {/* ── Player info ── */}
              <div className="modal-section-label">Player Info</div>
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
                  <label className="form-label">Team Name</label>
                  <input className="form-input" value={form.teamName}
                    onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                    placeholder="e.g. Kansas City Chiefs" />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Abbr</label>
                  <input className="form-input" value={form.teamAbbr}
                    onChange={(e) => setForm({ ...form, teamAbbr: e.target.value.toUpperCase() })}
                    placeholder="e.g. KC" maxLength={5} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jersey Number</label>
                  <input className="form-input" type="number" value={form.jerseyNumber}
                    onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
                    placeholder="e.g. 15" min={1} max={99} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="e.g. 28" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">College</label>
                  <input className="form-input" value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. Texas Tech" />
                </div>
                <div className="form-group">
                  <label className="form-label">Height</label>
                  <input className="form-input" value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    placeholder='e.g. 6&apos;2"' />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Weight (lbs)</label>
                  <input className="form-input" type="number" value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="e.g. 230" />
                </div>
                <div className="form-group">
                  <label className="form-label">Headshot URL</label>
                  <input className="form-input" value={form.headshotUrl}
                    onChange={(e) => setForm({ ...form, headshotUrl: e.target.value })}
                    placeholder="https://…" />
                </div>
              </div>

              {/* ── Season stats (create only) ── */}
              {!editTarget && (
                <>
                  <div className="modal-section-label" style={{ marginTop: '20px' }}>
                    2024 Season Stats
                    <span className="modal-section-hint">Auto-filled from ESPN if found above</span>
                  </div>
                  <div className="form-row" style={{ flexWrap: 'wrap' }}>
                    {visibleStatFields.map((field) => (
                      <div className="form-group" key={field}>
                        <label className="form-label">{STAT_LABELS[field]}</label>
                        <input
                          className="form-input"
                          type="number"
                          min={0}
                          value={stats[field]}
                          onChange={(e) => setStats({ ...stats, [field]: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editTarget ? 'Save Changes' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
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
                <td><span className="player-number">#{p.jerseyNumber || '—'}</span></td>
                <td style={{ fontWeight: '600' }}>{p.name}</td>
                <td><span className={`pos-badge pos-${p.position}`}>{p.position}</span></td>
                <td style={{ color: 'var(--text-dim)' }}>{p.teamAbbr || p.teamName || '—'}</td>
                <td style={{ color: 'var(--text-dim)' }}>{p.age || '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{p.college || '—'}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm"    onClick={() => setDeleteTarget(p._id)}>Delete</button>
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
