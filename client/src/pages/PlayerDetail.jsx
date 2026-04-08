import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

/* ── Column definitions per position ── */
const COL_DEFS = {
  QB: [
    { key: 'season',       label: 'Season',   isSum: false  },
    { key: 'gamesPlayed',  label: 'GP',        isSum: true  },
    { key: 'passingYards', label: 'Pass Yds',  isSum: true, fmt: v => v.toLocaleString() },
    { key: 'passingTDs',   label: 'Pass TD',   isSum: true  },
    { key: 'interceptions',label: 'INT',       isSum: true  },
    { key: 'rushingYards', label: 'Rush Yds',  isSum: true, dim: true, fmt: v => v.toLocaleString() },
    { key: 'rushingTDs',   label: 'Rush TD',   isSum: true, dim: true },
    { key: 'fantasyPoints',label: 'Fant Pts',  isSum: true, isFpts: true, fmt: v => v.toFixed(1) },
  ],
  RB: [
    { key: 'season',        label: 'Season',   isSum: false },
    { key: 'gamesPlayed',   label: 'GP',        isSum: true },
    { key: 'rushingYards',  label: 'Rush Yds',  isSum: true, fmt: v => v.toLocaleString() },
    { key: 'rushingTDs',    label: 'Rush TD',   isSum: true },
    { key: 'receptions',    label: 'REC',       isSum: true },
    { key: 'receivingYards',label: 'Rec Yds',   isSum: true, fmt: v => v.toLocaleString() },
    { key: 'receivingTDs',  label: 'Rec TD',    isSum: true, dim: true },
    { key: 'fantasyPoints', label: 'Fant Pts',  isSum: true, isFpts: true, fmt: v => v.toFixed(1) },
  ],
  WR: [
    { key: 'season',        label: 'Season',   isSum: false },
    { key: 'gamesPlayed',   label: 'GP',        isSum: true },
    { key: 'receptions',    label: 'REC',       isSum: true },
    { key: 'receivingYards',label: 'Rec Yds',   isSum: true, fmt: v => v.toLocaleString() },
    { key: 'receivingTDs',  label: 'Rec TD',    isSum: true },
    { key: 'rushingYards',  label: 'Rush Yds',  isSum: true, dim: true, fmt: v => v.toLocaleString() },
    { key: 'rushingTDs',    label: 'Rush TD',   isSum: true, dim: true },
    { key: 'fantasyPoints', label: 'Fant Pts',  isSum: true, isFpts: true, fmt: v => v.toFixed(1) },
  ],
  TE: [
    { key: 'season',        label: 'Season',   isSum: false },
    { key: 'gamesPlayed',   label: 'GP',        isSum: true },
    { key: 'receptions',    label: 'REC',       isSum: true },
    { key: 'receivingYards',label: 'Rec Yds',   isSum: true, fmt: v => v.toLocaleString() },
    { key: 'receivingTDs',  label: 'Rec TD',    isSum: true },
    { key: 'rushingYards',  label: 'Rush Yds',  isSum: true, dim: true, fmt: v => v.toLocaleString() },
    { key: 'rushingTDs',    label: 'Rush TD',   isSum: true, dim: true },
    { key: 'fantasyPoints', label: 'Fant Pts',  isSum: true, isFpts: true, fmt: v => v.toFixed(1) },
  ],
};

const SEASONS = [2024, 2023, 2022, 2021];

const PlayerDetail = () => {
  const { id } = useParams();
  const [player,     setPlayer]     = useState(null);
  const [allStats,   setAllStats]   = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [selectedWl, setSelectedWl] = useState('');
  const [addMsg,     setAddMsg]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [seasonFilter, setSeasonFilter] = useState('ALL');

  useEffect(() => {
    Promise.all([
      api.get(`/api/players/${id}`),
      api.get(`/api/stats/player/${id}`),
      api.get('/api/watchlists'),
    ]).then(([pRes, sRes, wlRes]) => {
      setPlayer(pRes.data);
      setAllStats(sRes.data);  // already sorted season desc
      setWatchlists(wlRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleAddToWatchlist = async () => {
    if (!selectedWl) return;
    setAddMsg('');
    try {
      await api.post(`/api/watchlists/${selectedWl}/players`, { playerId: id });
      setAddMsg('Player added to watchlist.');
      setSelectedWl('');
    } catch (err) {
      setAddMsg(err.response?.data?.message || 'Failed to add player.');
    }
  };

  /* Years that actually have data */
  const availableYears = useMemo(() => allStats.map(s => s.season), [allStats]);

  /* Filtered rows */
  const visibleStats = useMemo(() => {
    if (seasonFilter === 'ALL') return allStats;
    return allStats.filter(s => s.season === Number(seasonFilter));
  }, [allStats, seasonFilter]);

  /* Career totals */
  const careerTotals = useMemo(() => {
    const totals = { season: 'Career', gamesPlayed: 0, passingYards: 0, passingTDs: 0, interceptions: 0, rushingYards: 0, rushingTDs: 0, receivingYards: 0, receivingTDs: 0, receptions: 0, fantasyPoints: 0 };
    for (const s of allStats) {
      for (const k of Object.keys(totals)) {
        if (k !== 'season') totals[k] += (s[k] || 0);
      }
    }
    totals.fantasyPoints = +totals.fantasyPoints.toFixed(1);
    return totals;
  }, [allStats]);

  const stat2024 = useMemo(() => allStats.find(s => s.season === 2024), [allStats]);

  if (loading) return <div className="loading-state">Loading player...</div>;
  if (!player)  return <div className="empty-state"><h3>Player not found</h3></div>;

  const pos = player.position || 'WR';
  const cols = COL_DEFS[pos] || COL_DEFS.WR;

  const renderCell = (row, col) => {
    if (col.key === 'season') {
      return <strong>{row.season}</strong>;
    }
    const val = row[col.key] || 0;
    if (col.dim && val === 0) return <span className="pd-stat-label">—</span>;
    const display = col.fmt ? col.fmt(val) : val;
    if (col.isFpts) return <span className="pd-fpts">{display}</span>;
    return display;
  };

  const renderCareerCell = (col) => {
    if (col.key === 'season') return <strong>CAREER</strong>;
    const val = careerTotals[col.key] || 0;
    if (col.dim && val === 0) return <span className="pd-stat-label">—</span>;
    const display = col.fmt ? col.fmt(val) : val;
    if (col.isFpts) return <span className="pd-fpts">{display}</span>;
    return display;
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/players" className="btn btn-ghost btn-sm">← Back to Players</Link>
      </div>

      {/* ── Player Header ── */}
      <div className="player-header">
        <div className="player-avatar">
          {player.headshotUrl
            ? <img src={player.headshotUrl} alt={player.name} />
            : player.name.charAt(0)
          }
        </div>
        <div className="player-meta">
          <h1>{player.name}</h1>
          <div className="player-meta-row">
            <div className="player-meta-item">
              <span className={`pos-badge pos-${player.position}`}>{player.position}</span>
            </div>
            <div className="player-meta-item">
              <strong>{player.teamName || player.teamAbbr || 'No Team'}</strong>
            </div>
            {player.jerseyNumber != null && (
              <div className="player-meta-item">Jersey <strong>#{player.jerseyNumber}</strong></div>
            )}
            {player.age && (
              <div className="player-meta-item">Age <strong>{player.age}</strong></div>
            )}
          </div>
        </div>
        {stat2024 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '2px' }}>
              2024 Fantasy Pts
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent-orange)', fontFamily: 'var(--font-display)' }}>
              {stat2024.fantasyPoints?.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* ── Main content grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* ── Stats Card ── */}
        <div className="pd-card">
          <div className="pd-card-header">
            <span>Season Stats</span>
          </div>

          {/* Season pills */}
          <div className="pd-season-pills">
            <button
              className={`pd-season-pill${seasonFilter === 'ALL' ? ' active' : ''}`}
              onClick={() => setSeasonFilter('ALL')}
            >ALL</button>
            {SEASONS.filter(y => availableYears.includes(y)).map(y => (
              <button
                key={y}
                className={`pd-season-pill${seasonFilter === y ? ' active' : ''}`}
                onClick={() => setSeasonFilter(y)}
              >{y}</button>
            ))}
          </div>

          {/* Table */}
          <div className="pd-table-wrap">
            {visibleStats.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p>No stats for this season.</p>
              </div>
            ) : (
              <table className="pd-table">
                <thead>
                  <tr>
                    {cols.map(c => <th key={c.key}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleStats.map((row, i) => (
                    <tr
                      key={row._id}
                      className={`pd-row${row.season === 2024 ? ' pd-row-current' : ''}`}
                      style={{ '--row-i': i }}
                    >
                      {cols.map(c => (
                        <td key={c.key}>{renderCell(row, c)}</td>
                      ))}
                    </tr>
                  ))}
                  {/* Career totals row — only show when viewing ALL seasons and there's more than 1 */}
                  {seasonFilter === 'ALL' && allStats.length > 1 && (
                    <tr className="pd-career">
                      {cols.map(c => (
                        <td key={c.key}>{renderCareerCell(c)}</td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Add to Watchlist ── */}
        <div>
          <div className="section-title mb-12">Add to Watchlist</div>
          <div className="card">
            {watchlists.length === 0 ? (
              <div>
                <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '12px' }}>
                  You have no watchlists yet.
                </p>
                <Link to="/watchlists" className="btn btn-primary btn-sm">Create Watchlist</Link>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Select a Watchlist</label>
                  <select
                    className="form-select"
                    value={selectedWl}
                    onChange={e => setSelectedWl(e.target.value)}
                  >
                    <option value="">Choose...</option>
                    {watchlists.map(wl => (
                      <option key={wl._id} value={wl._id}>{wl.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAddToWatchlist}
                  disabled={!selectedWl}
                  style={{ width: '100%' }}
                >
                  Add Player
                </button>
                {addMsg && (
                  <p style={{
                    marginTop: '10px', fontSize: '13px',
                    color: addMsg.includes('added') ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}>
                    {addMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
