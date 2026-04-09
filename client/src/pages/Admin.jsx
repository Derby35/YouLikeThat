import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

/* ─── Constants ─────────────────────────────────────────── */
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];

const NFL_TEAMS = [
  { abbr: 'ARI', name: 'Arizona Cardinals' },    { abbr: 'ATL', name: 'Atlanta Falcons' },
  { abbr: 'BAL', name: 'Baltimore Ravens' },      { abbr: 'BUF', name: 'Buffalo Bills' },
  { abbr: 'CAR', name: 'Carolina Panthers' },     { abbr: 'CHI', name: 'Chicago Bears' },
  { abbr: 'CIN', name: 'Cincinnati Bengals' },    { abbr: 'CLE', name: 'Cleveland Browns' },
  { abbr: 'DAL', name: 'Dallas Cowboys' },        { abbr: 'DEN', name: 'Denver Broncos' },
  { abbr: 'DET', name: 'Detroit Lions' },         { abbr: 'GB',  name: 'Green Bay Packers' },
  { abbr: 'HOU', name: 'Houston Texans' },        { abbr: 'IND', name: 'Indianapolis Colts' },
  { abbr: 'JAX', name: 'Jacksonville Jaguars' },  { abbr: 'KC',  name: 'Kansas City Chiefs' },
  { abbr: 'LAC', name: 'Los Angeles Chargers' },  { abbr: 'LAR', name: 'Los Angeles Rams' },
  { abbr: 'LV',  name: 'Las Vegas Raiders' },     { abbr: 'MIA', name: 'Miami Dolphins' },
  { abbr: 'MIN', name: 'Minnesota Vikings' },     { abbr: 'NE',  name: 'New England Patriots' },
  { abbr: 'NO',  name: 'New Orleans Saints' },    { abbr: 'NYG', name: 'New York Giants' },
  { abbr: 'NYJ', name: 'New York Jets' },         { abbr: 'PHI', name: 'Philadelphia Eagles' },
  { abbr: 'PIT', name: 'Pittsburgh Steelers' },   { abbr: 'SEA', name: 'Seattle Seahawks' },
  { abbr: 'SF',  name: 'San Francisco 49ers' },   { abbr: 'TB',  name: 'Tampa Bay Buccaneers' },
  { abbr: 'TEN', name: 'Tennessee Titans' },      { abbr: 'WSH', name: 'Washington Commanders' },
];

const EMPTY_PLAYER    = { name: '', position: 'QB', jerseyNumber: '', teamAbbr: '', age: '', headshotUrl: '', espnId: '' };
const SEASON_TABS     = [2024, 2023, 2022, 2021];
const EMPTY_STAT_FORM = { inactive: true, gamesPlayed: 0, passingYards: 0, passingTDs: 0, interceptions: 0, rushingYards: 0, rushingTDs: 0, receivingYards: 0, receivingTDs: 0, receptions: 0 };

const buildEmptySeasonForms = () => {
  const obj = {};
  for (const y of SEASON_TABS) obj[y] = { ...EMPTY_STAT_FORM };
  obj[2024] = { ...EMPTY_STAT_FORM, inactive: false }; // 2024 active by default
  return obj;
};

const calcPPR = (pos, sf) => {
  if (sf.inactive) return 0;
  const v = k => Number(sf[k]) || 0;
  if (pos === 'QB') return +(v('passingYards')*0.04+v('passingTDs')*4-v('interceptions')*2+v('rushingYards')*0.1+v('rushingTDs')*6).toFixed(1);
  if (pos === 'RB') return +(v('rushingYards')*0.1+v('rushingTDs')*6+v('receptions')+v('receivingYards')*0.1+v('receivingTDs')*6).toFixed(1);
  return +(v('receptions')+v('receivingYards')*0.1+v('receivingTDs')*6+v('rushingYards')*0.1+v('rushingTDs')*6).toFixed(1);
};

const STAT_GROUPS = {
  QB: [
    { key: 'gamesPlayed',   label: 'Games Played', icon: '🏟' },
    { key: 'passingYards',  label: 'Pass Yards',    icon: '🏈', group: 'Passing' },
    { key: 'passingTDs',    label: 'Pass TDs',      icon: '✦',  group: 'Passing' },
    { key: 'interceptions', label: 'Interceptions', icon: '⚡', group: 'Passing' },
    { key: 'rushingYards',  label: 'Rush Yards',    icon: '💨', group: 'Rushing' },
    { key: 'rushingTDs',    label: 'Rush TDs',      icon: '✦',  group: 'Rushing' },
  ],
  RB: [
    { key: 'gamesPlayed',    label: 'Games Played', icon: '🏟' },
    { key: 'rushingYards',   label: 'Rush Yards',   icon: '💨', group: 'Rushing' },
    { key: 'rushingTDs',     label: 'Rush TDs',     icon: '✦',  group: 'Rushing' },
    { key: 'receptions',     label: 'Receptions',   icon: '🤲', group: 'Receiving' },
    { key: 'receivingYards', label: 'Rec Yards',    icon: '📏', group: 'Receiving' },
    { key: 'receivingTDs',   label: 'Rec TDs',      icon: '✦',  group: 'Receiving' },
  ],
  WR: [
    { key: 'gamesPlayed',    label: 'Games Played', icon: '🏟' },
    { key: 'receptions',     label: 'Receptions',   icon: '🤲', group: 'Receiving' },
    { key: 'receivingYards', label: 'Rec Yards',    icon: '📏', group: 'Receiving' },
    { key: 'receivingTDs',   label: 'Rec TDs',      icon: '✦',  group: 'Receiving' },
  ],
  TE: [
    { key: 'gamesPlayed',    label: 'Games Played', icon: '🏟' },
    { key: 'receptions',     label: 'Receptions',   icon: '🤲', group: 'Receiving' },
    { key: 'receivingYards', label: 'Rec Yards',    icon: '📏', group: 'Receiving' },
    { key: 'receivingTDs',   label: 'Rec TDs',      icon: '✦',  group: 'Receiving' },
  ],
};

/* ─── Add Player Modal (create-only, 2-step) ─────────────── */
const AddPlayerModal = ({ onClose, onSaved }) => {
  const [step,         setStep]         = useState(1);
  const [form,         setForm]         = useState({ ...EMPTY_PLAYER });
  const [seasonForms,  setSeasonForms]  = useState(buildEmptySeasonForms());
  const [activeTab,    setActiveTab]    = useState(2024);
  const [espnQuery,    setEspnQuery]    = useState('');
  const [espnState,    setEspnState]    = useState('idle');
  const [espnMsg,      setEspnMsg]      = useState('');
  const [error,        setError]        = useState('');
  const [saving,       setSaving]       = useState(false);

  const updateSeason = (year, key, val) =>
    setSeasonForms(prev => ({ ...prev, [year]: { ...prev[year], [key]: val } }));

  const handleEspnLookup = async () => {
    if (!espnQuery.trim()) return;
    setEspnState('loading'); setEspnMsg('');
    try {
      const res = await api.get(`/api/players/espn-lookup?name=${encodeURIComponent(espnQuery.trim())}`);
      const d = res.data;
      setForm(prev => ({
        ...prev,
        name:         d.name         || prev.name,
        position:     POSITIONS.includes(d.position) ? d.position : prev.position,
        jerseyNumber: d.jerseyNumber != null ? d.jerseyNumber : prev.jerseyNumber,
        teamAbbr:     d.teamAbbr     || prev.teamAbbr,
        age:          d.age          != null ? d.age : prev.age,
        headshotUrl:  d.headshotUrl  || prev.headshotUrl,
        espnId:       d.espnId       || prev.espnId,
      }));
      // Populate ESPN stats into the 2024 season tab
      if (d.stats && Object.keys(d.stats).length) {
        setSeasonForms(prev => ({
          ...prev,
          2024: {
            ...prev[2024],
            inactive: false,
            ...Object.fromEntries(
              Object.entries(d.stats)
                .filter(([k]) => k in EMPTY_STAT_FORM && k !== 'inactive')
                .map(([k, v]) => [k, v ?? 0])
            ),
          },
        }));
      }
      setEspnState('success');
      setEspnMsg(`Found: ${d.name || espnQuery}`);
    } catch (err) {
      setEspnState('error');
      setEspnMsg(err.response?.data?.message || 'Not found — fill in manually.');
    }
  };

  const handleSubmit = async () => {
    setError(''); setSaving(true);
    try {
      const team = NFL_TEAMS.find(t => t.abbr === form.teamAbbr);
      const playerPayload = {
        ...form,
        teamName:     team?.name || '',
        jerseyNumber: Number(form.jerseyNumber) || undefined,
        age:          Number(form.age)          || undefined,
      };

      // Step 1: create the player
      const created = await api.post('/api/players', playerPayload);
      const newId = created.data._id;

      // Step 2: batch-upsert only active seasons (skip inactive — nothing to delete on a new player)
      const statsArray = SEASON_TABS.reduce((acc, year) => {
        const sf = seasonForms[year];
        if (!sf.inactive) {
          acc.push({
            season:         year,
            inactive:       false,
            gamesPlayed:    Number(sf.gamesPlayed)    || 0,
            passingYards:   Number(sf.passingYards)   || 0,
            passingTDs:     Number(sf.passingTDs)     || 0,
            interceptions:  Number(sf.interceptions)  || 0,
            rushingYards:   Number(sf.rushingYards)   || 0,
            rushingTDs:     Number(sf.rushingTDs)     || 0,
            receivingYards: Number(sf.receivingYards) || 0,
            receivingTDs:   Number(sf.receivingTDs)   || 0,
            receptions:     Number(sf.receptions)     || 0,
          });
        }
        return acc;
      }, []);

      await api.put(`/api/players/${newId}/full`, { player: playerPayload, stats: statsArray });

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const sf        = seasonForms[activeTab] || EMPTY_STAT_FORM;
  const statFields = STAT_GROUPS[form.position] || STAT_GROUPS.WR;
  const livePPR   = calcPPR(form.position, sf);

  return (
    <div className="ap-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal">

        {/* Header */}
        <div className="ap-modal-header">
          <div className="ap-modal-avatar-placeholder">＋</div>
          <div className="ap-modal-header-text">
            <div className="ap-modal-title">Add New Player</div>
          </div>
          <button className="ap-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Stepper */}
        <div className="ap-stepper">
          <button className={`ap-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`} onClick={() => setStep(1)}>
            <span className="ap-step-num">{step > 1 ? '✓' : '1'}</span>
            <span>Player Info</span>
          </button>
          <div className="ap-step-line" />
          <button className={`ap-step ${step === 2 ? 'active' : ''}`} onClick={() => step > 1 && setStep(2)}>
            <span className="ap-step-num">2</span>
            <span>Season Stats</span>
          </button>
        </div>

        {/* Body */}
        <div className="ap-modal-body">

          {/* Step 1 — Player Info */}
          {step === 1 && (
            <div>
              <div className="ap-espn-block">
                <div className="ap-espn-label">
                  <span className="ap-espn-badge">ESPN</span>
                  Auto-fill player data instantly
                </div>
                <div className="ap-espn-row">
                  <input
                    className="ap-espn-input"
                    placeholder="Search any NFL player…"
                    value={espnQuery}
                    onChange={e => setEspnQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEspnLookup()}
                  />
                  <button
                    className={`ap-espn-btn ${espnState === 'loading' ? 'loading' : ''}`}
                    onClick={handleEspnLookup}
                    disabled={espnState === 'loading' || !espnQuery.trim()}
                  >
                    {espnState === 'loading' ? <><span className="ap-spinner" /> Looking up…</> : 'Look Up'}
                  </button>
                </div>
                {espnState === 'success' && <div className="ap-espn-status success">✓ {espnMsg} — fields populated below</div>}
                {espnState === 'error'   && <div className="ap-espn-status error">✕ {espnMsg}</div>}
              </div>

              <div className="ap-form-grid">
                <div className="ap-field ap-field-full">
                  <label className="ap-label">Full Name</label>
                  <input className="ap-input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Patrick Mahomes" />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Position</label>
                  <select className="ap-select" value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })}>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Jersey #</label>
                  <input className="ap-input" type="number" min={1} max={99}
                    value={form.jerseyNumber}
                    onChange={e => setForm({ ...form, jerseyNumber: e.target.value })}
                    placeholder="17" />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Team</label>
                  <select className="ap-select" value={form.teamAbbr}
                    onChange={e => setForm({ ...form, teamAbbr: e.target.value })}>
                    <option value="">Select team…</option>
                    {NFL_TEAMS.map(t => (
                      <option key={t.abbr} value={t.abbr}>{t.abbr} — {t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Age</label>
                  <input className="ap-input" type="number" min={18} max={50}
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                    placeholder="28" />
                </div>
                <div className="ap-field ap-field-full">
                  <label className="ap-label">
                    Headshot URL
                    {form.headshotUrl && (
                      <img src={form.headshotUrl} alt="" className="ap-headshot-preview"
                        onError={e => e.target.style.display = 'none'} />
                    )}
                  </label>
                  <input className="ap-input" value={form.headshotUrl}
                    onChange={e => setForm({ ...form, headshotUrl: e.target.value })}
                    placeholder="https://a.espncdn.com/…" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Multi-Season Stats */}
          {step === 2 && (
            <div>
              <div className="ap-stats-intro">
                <span className={`pos-badge pos-${form.position}`}>{form.position}</span>
                &nbsp; Stats for <strong>{form.name || 'this player'}</strong> — toggle seasons active/inactive
              </div>

              {/* Season tabs */}
              <div className="ep-season-tabs" style={{ marginBottom: 0 }}>
                {SEASON_TABS.map(year => {
                  const yf = seasonForms[year];
                  return (
                    <button
                      key={year}
                      className={`ep-season-tab${activeTab === year ? ' active' : ''}`}
                      onClick={() => setActiveTab(year)}
                    >
                      {year}
                      {!yf.inactive && <span className="ep-tab-dot" />}
                    </button>
                  );
                })}
              </div>

              {/* Active season content */}
              <div className="ep-season-content" style={{ borderTop: 'none' }}>
                {/* Inactive toggle + live PPR */}
                <div className="ep-season-controls">
                  <label className="ep-season-inactive-toggle">
                    <input
                      type="checkbox"
                      checked={!!sf.inactive}
                      onChange={e => updateSeason(activeTab, 'inactive', e.target.checked)}
                    />
                    <span>Not Active This Season</span>
                    {sf.inactive && <span className="ep-inactive-badge">INACTIVE</span>}
                  </label>
                  <div className="ep-ppr-preview" style={{ margin: 0 }}>
                    PPR:&nbsp;<span className="ep-ppr-value">{livePPR.toFixed(1)}</span>
                  </div>
                </div>

                {/* Stat fields */}
                <div className={`ap-stat-grid${sf.inactive ? ' ep-stat-inactive' : ''}`}>
                  {statFields.map((f, i) => {
                    const isFirst = i === 0 || f.group !== statFields[i - 1]?.group;
                    return (
                      <div key={f.key} className={`ap-stat-field ${i === 0 ? 'ap-stat-gp' : ''}`}>
                        {isFirst && f.group && <div className="ap-stat-group-label">{f.group}</div>}
                        <label className="ap-label">
                          <span className="ap-stat-icon">{f.icon}</span> {f.label}
                        </label>
                        <input
                          className="ap-input ap-stat-input"
                          type="number" min={0} placeholder="0"
                          value={sf[f.key] ?? 0}
                          disabled={sf.inactive}
                          onChange={e => updateSeason(activeTab, f.key, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error && <div className="ap-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="ap-modal-footer">
          <button className="ap-btn-cancel" onClick={onClose}>Cancel</button>
          {step === 1 && (
            <button className="ap-btn-primary" onClick={() => {
              if (!form.name.trim()) { setError('Player name is required.'); return; }
              setError(''); setStep(2);
            }}>Next: Season Stats →</button>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="ap-btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="ap-btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><span className="ap-spinner" /> Saving…</> : '＋ Add Player'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Admin Page ────────────────────────────────────── */
const Admin = () => {
  const navigate = useNavigate();

  const [players,      setPlayers]      = useState([]);
  const [loadingP,     setLoadingP]     = useState(true);
  const [playerSearch, setPlayerSearch] = useState('');
  const [posFilter,    setPosFilter]    = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadPlayers = async () => {
    try { const r = await api.get('/api/players'); setPlayers(r.data); }
    finally { setLoadingP(false); }
  };

  useEffect(() => { loadPlayers(); }, []);

  const handleDelete = async () => {
    await api.delete(`/api/players/${deleteTarget._id}`);
    setDeleteTarget(null);
    loadPlayers();
  };

  const filteredPlayers = players.filter(p => {
    const matchPos    = posFilter === 'ALL' || p.position === posFilter;
    const matchSearch = !playerSearch ||
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      (p.teamAbbr || '').toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.position.toLowerCase().includes(playerSearch.toLowerCase());
    return matchPos && matchSearch;
  });

  return (
    <div className="ap-page">

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmModal
          message={`Delete ${deleteTarget.name}? Their stats and watchlist entries will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Add Player modal */}
      {showAddModal && (
        <AddPlayerModal
          onClose={() => setShowAddModal(false)}
          onSaved={loadPlayers}
        />
      )}

      {/* Page header */}
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Admin Panel</h1>
          <p className="ap-page-sub">2024 NFL Season — Player Management</p>
        </div>
        <div className="ap-page-header-stats">
          <div className="ap-header-stat"><span>{players.length}</span>Players</div>
          <div className="ap-header-stat"><span>{filteredPlayers.length}</span>Showing</div>
        </div>
      </div>

      {/* ── Players Section ── */}
      <div className="ap-section">
        <div className="ap-section-header">
          <div className="ap-section-title">
            <div className="ap-section-icon">👤</div>
            Players
            <span className="ap-count-pill">{filteredPlayers.length}</span>
          </div>
          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className="ap-search"
                placeholder="Search by name, team, or position…"
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
              />
              {playerSearch && (
                <button className="ap-search-clear" onClick={() => setPlayerSearch('')}>✕</button>
              )}
            </div>
            <button className="ap-btn-primary ap-btn-sm" onClick={() => setShowAddModal(true)}>
              + Add Player
            </button>
          </div>
        </div>

        {/* Position filter pills */}
        <div className="ap-pos-filters">
          {['ALL', ...POSITIONS].map(pos => (
            <button
              key={pos}
              className={`ap-pos-pill ${posFilter === pos ? 'active' : ''} ${pos !== 'ALL' ? `pos-pill-${pos}` : ''}`}
              onClick={() => setPosFilter(pos)}
            >
              {pos}
            </button>
          ))}
        </div>

        {loadingP ? (
          <div className="ap-loading">Loading players…</div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Player</th><th>Pos</th><th>Team</th><th>Jersey</th><th>Age</th><th>Fant Pts</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length === 0 ? (
                  <tr><td colSpan={7} className="ap-empty">No players match your search.</td></tr>
                ) : filteredPlayers.map(pl => (
                  <tr key={pl._id}>
                    <td className="ap-player-cell">
                      {pl.headshotUrl
                        ? <img src={pl.headshotUrl} alt="" className="ap-row-avatar"
                            onError={e => e.target.style.display = 'none'} />
                        : <div className="ap-row-avatar-ph">{pl.name.charAt(0)}</div>
                      }
                      <span className="ap-player-name">{pl.name}</span>
                    </td>
                    <td><span className={`pos-badge pos-${pl.position}`}>{pl.position}</span></td>
                    <td className="ap-dim">{pl.teamAbbr || '—'}</td>
                    <td className="ap-dim">{pl.jerseyNumber ? `#${pl.jerseyNumber}` : '—'}</td>
                    <td className="ap-dim">{pl.age || '—'}</td>
                    <td><span className="ap-fpts">{pl.fantasyPoints?.toFixed(1) ?? '—'}</span></td>
                    <td>
                      <div className="ap-actions">
                        <button
                          className="ap-btn-edit"
                          onClick={() => navigate(`/admin/players/${pl._id}/edit`)}
                        >Edit</button>
                        <button
                          className="ap-btn-delete"
                          onClick={() => setDeleteTarget(pl)}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Admin;
