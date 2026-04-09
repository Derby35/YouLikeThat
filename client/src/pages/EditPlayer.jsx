import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

/* ─── Constants ─────────────────────────────────────────── */
const POSITIONS = ['QB', 'RB', 'WR', 'TE'];
const SEASON_TABS = [2024, 2023, 2022, 2021];

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

const STAT_DEFS = {
  QB: {
    Passing:  [
      { key: 'gamesPlayed',   label: 'Games Played'  },
      { key: 'passingYards',  label: 'Pass Yards'    },
      { key: 'passingTDs',    label: 'Pass TDs'      },
      { key: 'interceptions', label: 'Interceptions' },
    ],
    Rushing: [
      { key: 'rushingYards',  label: 'Rush Yards'    },
      { key: 'rushingTDs',    label: 'Rush TDs'      },
    ],
  },
  RB: {
    Rushing: [
      { key: 'gamesPlayed',    label: 'Games Played' },
      { key: 'rushingYards',   label: 'Rush Yards'   },
      { key: 'rushingTDs',     label: 'Rush TDs'     },
    ],
    Receiving: [
      { key: 'receptions',     label: 'Receptions'  },
      { key: 'receivingYards', label: 'Rec Yards'   },
      { key: 'receivingTDs',   label: 'Rec TDs'     },
    ],
  },
  WR: {
    Receiving: [
      { key: 'gamesPlayed',    label: 'Games Played' },
      { key: 'receptions',     label: 'Receptions'  },
      { key: 'receivingYards', label: 'Rec Yards'   },
      { key: 'receivingTDs',   label: 'Rec TDs'     },
    ],
    Rushing: [
      { key: 'rushingYards',   label: 'Rush Yards'  },
      { key: 'rushingTDs',     label: 'Rush TDs'    },
    ],
  },
  TE: {
    Receiving: [
      { key: 'gamesPlayed',    label: 'Games Played' },
      { key: 'receptions',     label: 'Receptions'  },
      { key: 'receivingYards', label: 'Rec Yards'   },
      { key: 'receivingTDs',   label: 'Rec TDs'     },
    ],
    Rushing: [
      { key: 'rushingYards',   label: 'Rush Yards'  },
      { key: 'rushingTDs',     label: 'Rush TDs'    },
    ],
  },
};

const EMPTY_STAT_FORM = {
  inactive: true,
  gamesPlayed: 0, passingYards: 0, passingTDs: 0, interceptions: 0,
  rushingYards: 0, rushingTDs: 0, receivingYards: 0, receivingTDs: 0, receptions: 0,
};

const buildEmptySeasonForms = () => {
  const obj = {};
  for (const y of SEASON_TABS) obj[y] = { ...EMPTY_STAT_FORM };
  return obj;
};

/* ── PPR calculator ── */
const calcPPR = (pos, sf) => {
  if (sf.inactive) return 0;
  const v = k => Number(sf[k]) || 0;
  if (pos === 'QB') return +(v('passingYards')*0.04+v('passingTDs')*4-v('interceptions')*2+v('rushingYards')*0.1+v('rushingTDs')*6).toFixed(1);
  if (pos === 'RB') return +(v('rushingYards')*0.1+v('rushingTDs')*6+v('receptions')+v('receivingYards')*0.1+v('receivingTDs')*6).toFixed(1);
  return +(v('receptions')+v('receivingYards')*0.1+v('receivingTDs')*6+v('rushingYards')*0.1+v('rushingTDs')*6).toFixed(1);
};

/* ─── EditPlayer Page ────────────────────────────────────── */
const EditPlayer = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [pageErr,  setPageErr]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const [playerName, setPlayerName] = useState('');
  const [imgBroken,  setImgBroken]  = useState(false);

  /* Player identity form */
  const [form,     setForm]     = useState({ name: '', position: 'QB', jerseyNumber: '', teamAbbr: '', age: '', headshotUrl: '', espnId: '' });
  const [origForm, setOrigForm] = useState(null);

  /* Season forms: keyed by year */
  const [seasonForms,     setSeasonForms]     = useState(buildEmptySeasonForms());
  const [origSeasonForms, setOrigSeasonForms] = useState(buildEmptySeasonForms());

  /* Active season tab */
  const [activeTab, setActiveTab] = useState(2024);

  /* Clear confirmation per tab */
  const [clearConfirm, setClearConfirm] = useState(null); // year or null

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get(`/api/players/${id}`),
          api.get(`/api/stats/player/${id}`),
        ]);

        const pl = pRes.data;
        setPlayerName(pl.name);

        const pf = {
          name:         pl.name        || '',
          position:     pl.position    || 'QB',
          jerseyNumber: pl.jerseyNumber != null ? pl.jerseyNumber : '',
          teamAbbr:     pl.teamAbbr    || '',
          age:          pl.age         != null ? pl.age : '',
          headshotUrl:  pl.headshotUrl || '',
          espnId:       pl.espnId      || '',
        };
        setForm(pf);
        setOrigForm(pf);

        /* Build season forms from stat records */
        const newForms = buildEmptySeasonForms();
        for (const s of sRes.data) {
          if (SEASON_TABS.includes(s.season)) {
            newForms[s.season] = {
              inactive:      false,
              gamesPlayed:   s.gamesPlayed   ?? 0,
              passingYards:  s.passingYards  ?? 0,
              passingTDs:    s.passingTDs    ?? 0,
              interceptions: s.interceptions ?? 0,
              rushingYards:  s.rushingYards  ?? 0,
              rushingTDs:    s.rushingTDs    ?? 0,
              receivingYards:s.receivingYards?? 0,
              receivingTDs:  s.receivingTDs  ?? 0,
              receptions:    s.receptions    ?? 0,
            };
          }
        }
        setSeasonForms(newForms);
        setOrigSeasonForms(JSON.parse(JSON.stringify(newForms)));
      } catch {
        setPageErr('Failed to load player data. They may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Toast ── */
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  }, []);

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'Player name is required.'); return; }
    setSaving(true);
    try {
      const team = NFL_TEAMS.find(t => t.abbr === form.teamAbbr);
      const playerPayload = {
        ...form,
        teamName:     team?.name || '',
        jerseyNumber: form.jerseyNumber !== '' ? Number(form.jerseyNumber) : undefined,
        age:          form.age          !== '' ? Number(form.age)          : undefined,
      };

      const statsArray = SEASON_TABS.reduce((acc, year) => {
        const sf   = seasonForms[year];
        const orig = origSeasonForms?.[year];
        // Skip seasons that were never in the DB and the user never activated
        if (sf.inactive && orig?.inactive) return acc;
        if (sf.inactive) {
          acc.push({ season: year, inactive: true });
        } else {
          acc.push({
            season:        year,
            inactive:      false,
            gamesPlayed:   Number(sf.gamesPlayed)    || 0,
            passingYards:  Number(sf.passingYards)   || 0,
            passingTDs:    Number(sf.passingTDs)     || 0,
            interceptions: Number(sf.interceptions)  || 0,
            rushingYards:  Number(sf.rushingYards)   || 0,
            rushingTDs:    Number(sf.rushingTDs)     || 0,
            receivingYards:Number(sf.receivingYards) || 0,
            receivingTDs:  Number(sf.receivingTDs)   || 0,
            receptions:    Number(sf.receptions)     || 0,
          });
        }
        return acc;
      }, []);

      await api.put(`/api/players/${id}/full`, { player: playerPayload, stats: statsArray });

      setOrigForm({ ...form });
      setOrigSeasonForms(JSON.parse(JSON.stringify(seasonForms)));
      setPlayerName(form.name);
      showToast('success', 'Player updated successfully');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Change detection ── */
  const pChanged = (key) => origForm && String(form[key]) !== String(origForm[key] ?? '');
  const sChanged = (year, key) =>
    origSeasonForms &&
    String(seasonForms[year]?.[key]) !== String(origSeasonForms[year]?.[key] ?? '');
  const hasChanges = origForm && (
    Object.keys(form).some(pChanged) ||
    SEASON_TABS.some(y => Object.keys(EMPTY_STAT_FORM).some(k => sChanged(y, k)))
  );

  /* ── Update a single season field ── */
  const updateSeason = (year, key, val) => {
    setSeasonForms(prev => ({
      ...prev,
      [year]: { ...prev[year], [key]: val },
    }));
  };

  /* ── Clear season ── */
  const handleClear = (year) => {
    if (clearConfirm === year) {
      setSeasonForms(prev => ({
        ...prev,
        [year]: { ...EMPTY_STAT_FORM, inactive: prev[year].inactive },
      }));
      setClearConfirm(null);
    } else {
      setClearConfirm(year);
      setTimeout(() => setClearConfirm(null), 3500);
    }
  };

  const sf   = seasonForms[activeTab] || EMPTY_STAT_FORM;
  const statDefs = STAT_DEFS[form.position] || STAT_DEFS.QB;
  const livePPR  = calcPPR(form.position, sf);

  /* ── Render ── */
  if (loading) return (
    <div className="ep-loading-screen">
      <div className="ep-loading-spinner" />
      <span>Loading player…</span>
    </div>
  );

  if (pageErr) return (
    <div className="ep-loading-screen">
      <div className="ep-load-error">{pageErr}</div>
      <button className="ep-btn-cancel" onClick={() => navigate('/admin')} style={{ marginTop: '16px' }}>
        Back to Admin
      </button>
    </div>
  );

  return (
    <div className="ep-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`ep-toast ep-toast-${toast.type}`}>
          <span className="ep-toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div className="ep-breadcrumb">
        <Link to="/admin" className="ep-bc-link">Admin Panel</Link>
        <span className="ep-bc-sep">›</span>
        <span className="ep-bc-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>Players</span>
        <span className="ep-bc-sep">›</span>
        <span className="ep-bc-current">{playerName || 'Edit Player'}</span>
      </div>

      {/* ── Page header ── */}
      <div className="ep-page-header">
        <div className="ep-page-header-left">
          <div className="ep-page-eyebrow">EDITING PLAYER</div>
          <h1 className="ep-page-title">{playerName || '—'}</h1>
          <div className="ep-page-meta">
            <span className={`pos-badge pos-${form.position}`}>{form.position}</span>
            {form.teamAbbr && <span className="ep-team-tag">{form.teamAbbr}</span>}
            {hasChanges && <span className="ep-unsaved-dot">● unsaved changes</span>}
          </div>
        </div>
        <div className="ep-page-header-actions">
          <button className="ep-btn-cancel" onClick={() => navigate('/admin')}>Cancel</button>
          <button className="ep-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="ep-spinner" /> Saving…</> : '✓ Save All Changes'}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="ep-content">

        {/* ══ Card 1 — Player Identity ══ */}
        <div className="ep-card">
          <div className="ep-card-header">
            <div className="ep-card-icon">👤</div>
            <div>
              <div className="ep-card-title">Player Identity</div>
              <div className="ep-card-sub">Core info — name, team, position, age</div>
            </div>
          </div>

          <div className="ep-identity-layout">
            <div className="ep-avatar-col">
              <div className="ep-avatar-wrap">
                {form.headshotUrl && !imgBroken ? (
                  <img
                    src={form.headshotUrl}
                    alt={form.name}
                    className="ep-avatar-img"
                    onError={() => setImgBroken(true)}
                  />
                ) : (
                  <div className="ep-avatar-ph">
                    {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
              <div className={`pos-badge pos-${form.position}`} style={{ marginTop: '10px', textAlign: 'center', display: 'block' }}>
                {form.position}
              </div>
              {form.jerseyNumber && (
                <div className="ep-avatar-jersey">#{form.jerseyNumber}</div>
              )}
            </div>

            <div className="ep-identity-fields">
              <div className="ep-field-grid">

                <div className={`ep-field ep-field-full ${pChanged('name') ? 'ep-field-changed' : ''}`}>
                  <label className="ep-label">Full Name</label>
                  <input
                    className="ep-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Patrick Mahomes"
                  />
                </div>

                <div className={`ep-field ${pChanged('position') ? 'ep-field-changed' : ''}`}>
                  <label className="ep-label">Position</label>
                  <select
                    className="ep-select"
                    value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })}
                  >
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>

                <div className={`ep-field ${pChanged('jerseyNumber') ? 'ep-field-changed' : ''}`}>
                  <label className="ep-label">Jersey #</label>
                  <input
                    className="ep-input"
                    type="number" min={0} max={99}
                    value={form.jerseyNumber}
                    onChange={e => setForm({ ...form, jerseyNumber: e.target.value })}
                    placeholder="17"
                  />
                </div>

                <div className={`ep-field ${pChanged('teamAbbr') ? 'ep-field-changed' : ''}`}>
                  <label className="ep-label">Team</label>
                  <select
                    className="ep-select"
                    value={form.teamAbbr}
                    onChange={e => setForm({ ...form, teamAbbr: e.target.value })}
                  >
                    <option value="">Select team…</option>
                    {NFL_TEAMS.map(t => (
                      <option key={t.abbr} value={t.abbr}>{t.abbr} — {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className={`ep-field ${pChanged('age') ? 'ep-field-changed' : ''}`}>
                  <label className="ep-label">Age</label>
                  <input
                    className="ep-input"
                    type="number" min={18} max={55}
                    value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })}
                    placeholder="28"
                  />
                </div>

                <div className={`ep-field ep-field-full ${pChanged('headshotUrl') ? 'ep-field-changed' : ''}`}>
                  <label className="ep-label">
                    Headshot URL
                    <span className="ep-label-hint"> — paste ESPN CDN link or any image URL</span>
                  </label>
                  <div className="ep-headshot-row">
                    <input
                      className="ep-input"
                      value={form.headshotUrl}
                      onChange={e => { setForm({ ...form, headshotUrl: e.target.value }); setImgBroken(false); }}
                      placeholder="https://a.espncdn.com/i/headshots/nfl/players/full/…"
                    />
                    {form.headshotUrl && (
                      <button
                        className="ep-verify-btn"
                        onClick={() => setImgBroken(false)}
                        title="Reload preview"
                      >↺</button>
                    )}
                  </div>
                  {imgBroken && (
                    <div className="ep-headshot-warn">⚠ Image failed to load — check the URL</div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ══ Card 2 — Multi-Season Stats ══ */}
        <div className="ep-card">
          <div className="ep-card-header">
            <div className="ep-card-icon">📊</div>
            <div>
              <div className="ep-card-title">Season Stats</div>
              <div className="ep-card-sub">Edit stats for each season — toggle inactive to remove a season</div>
            </div>
          </div>

          {/* Season Tabs */}
          <div className="ep-season-tabs">
            {SEASON_TABS.map(year => {
              const yf = seasonForms[year];
              const hasData = yf && !yf.inactive;
              const anyChanged = Object.keys(EMPTY_STAT_FORM).some(k => sChanged(year, k));
              return (
                <button
                  key={year}
                  className={`ep-season-tab${activeTab === year ? ' active' : ''}`}
                  onClick={() => { setActiveTab(year); setClearConfirm(null); }}
                >
                  {year}
                  {hasData && <span className="ep-tab-dot" />}
                  {anyChanged && <span className="ep-tab-changed-dot" />}
                </button>
              );
            })}
          </div>

          {/* Active season content */}
          <div className="ep-season-content">

            {/* Controls row */}
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {clearConfirm === activeTab ? (
                  <span className="ep-clear-confirm" onClick={() => handleClear(activeTab)}>
                    Confirm clear?
                  </span>
                ) : (
                  <button className="ep-clear-btn" onClick={() => handleClear(activeTab)}>
                    Clear Season
                  </button>
                )}
              </div>
            </div>

            {/* Live PPR */}
            <div className="ep-ppr-preview">
              Fantasy Pts (PPR):&nbsp;
              <span className="ep-ppr-value">{livePPR.toFixed(1)}</span>
            </div>

            {/* Stat fields */}
            <div className={`ep-stat-sections${sf.inactive ? ' ep-stat-inactive' : ''}`}>
              {Object.entries(statDefs).map(([groupName, fields]) => (
                <div key={groupName} className="ep-stat-section">
                  <div className="ep-stat-section-label">{groupName.toUpperCase()}</div>
                  <div className="ep-stat-field-grid">
                    {fields.map(f => (
                      <div
                        key={f.key}
                        className={`ep-stat-field ${sChanged(activeTab, f.key) ? 'ep-field-changed' : ''}`}
                      >
                        <label className="ep-label">{f.label}</label>
                        <input
                          className="ep-input ep-stat-input"
                          type="number"
                          min={0}
                          value={sf[f.key] ?? 0}
                          onChange={e => updateSeason(activeTab, f.key, e.target.value)}
                          disabled={sf.inactive}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* ── Sticky footer ── */}
      <div className="ep-footer">
        <div className="ep-footer-left">
          {hasChanges
            ? <span className="ep-footer-unsaved">● You have unsaved changes</span>
            : <span className="ep-footer-clean">All changes saved</span>
          }
        </div>
        <div className="ep-footer-actions">
          <button className="ep-btn-cancel" onClick={() => navigate('/admin')}>← Cancel</button>
          <button className="ep-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="ep-spinner" /> Saving…</> : '✓ Save All Changes'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default EditPlayer;
