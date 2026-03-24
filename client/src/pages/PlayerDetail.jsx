import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const StatBox = ({ label, value }) => (
  <div className="stat-box">
    <div className="stat-box-label">{label}</div>
    <div className="stat-box-value">{value ?? '—'}</div>
  </div>
);

const PlayerDetail = () => {
  const { id } = useParams();
  const [player,     setPlayer]     = useState(null);
  const [stats,      setStats]      = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [selectedWl, setSelectedWl] = useState('');
  const [addMsg,     setAddMsg]     = useState('');
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/players/${id}`),
      api.get(`/api/stats/player/${id}`),
      api.get('/api/watchlists'),
    ]).then(([pRes, sRes, wlRes]) => {
      setPlayer(pRes.data);
      setStats(sRes.data);
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

  if (loading) return <div className="loading-state">Loading player...</div>;
  if (!player) return <div className="empty-state"><h3>Player not found</h3></div>;

  const s = stats[0]; // 2024 season stats

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/players" className="btn btn-ghost btn-sm">Back to Players</Link>
      </div>

      {/* player info */}
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
            {player.jerseyNumber && (
              <div className="player-meta-item">Jersey <strong>#{player.jerseyNumber}</strong></div>
            )}
            {player.age && (
              <div className="player-meta-item">Age <strong>{player.age}</strong></div>
            )}
          </div>
        </div>
        {s && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '2px' }}>
              2024 Fantasy Pts
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent-orange)' }}>
              {s.fantasyPoints?.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* stat boxes */}
      {s && (
        <>
          <div className="section-title mb-12">2024 Season Stats</div>
          <div className="stat-grid">
            <StatBox label="Games"   value={s.gamesPlayed} />
            {s.passingYards   > 0 && <StatBox label="Pass Yds" value={s.passingYards?.toLocaleString()} />}
            {s.passingTDs     > 0 && <StatBox label="Pass TDs" value={s.passingTDs} />}
            {s.interceptions  > 0 && <StatBox label="INTs"     value={s.interceptions} />}
            {s.rushingYards   > 0 && <StatBox label="Rush Yds" value={s.rushingYards?.toLocaleString()} />}
            {s.rushingTDs     > 0 && <StatBox label="Rush TDs" value={s.rushingTDs} />}
            {s.receivingYards > 0 && <StatBox label="Rec Yds"  value={s.receivingYards?.toLocaleString()} />}
            {s.receivingTDs   > 0 && <StatBox label="Rec TDs"  value={s.receivingTDs} />}
            {s.receptions     > 0 && <StatBox label="Receptions" value={s.receptions} />}
          </div>
        </>
      )}

      {/* stat table + watchlist panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div>
          <div className="section-title mb-12">Full Stat History</div>
          <div className="table-wrapper">
            {stats.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p>No stats found for this player.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Season</th><th>GP</th>
                    <th>Pass Yds</th><th>Pass TD</th><th>INT</th>
                    <th>Rush Yds</th><th>Rush TD</th>
                    <th>Rec Yds</th><th>Rec TD</th><th>REC</th>
                    <th>Fant Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row) => (
                    <tr key={row._id}>
                      <td><strong>{row.season}</strong></td>
                      <td>{row.gamesPlayed}</td>
                      <td>{row.passingYards   || '—'}</td>
                      <td>{row.passingTDs     || '—'}</td>
                      <td>{row.interceptions  || '—'}</td>
                      <td>{row.rushingYards   || '—'}</td>
                      <td>{row.rushingTDs     || '—'}</td>
                      <td>{row.receivingYards || '—'}</td>
                      <td>{row.receivingTDs   || '—'}</td>
                      <td>{row.receptions     || '—'}</td>
                      <td style={{ color: 'var(--accent-orange)', fontWeight: '700' }}>
                        {row.fantasyPoints?.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* add to watchlist */}
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
                    onChange={(e) => setSelectedWl(e.target.value)}
                  >
                    <option value="">Choose...</option>
                    {watchlists.map((wl) => (
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
                    marginTop: '10px',
                    fontSize: '13px',
                    color: addMsg.includes('added') ? 'var(--accent-green)' : 'var(--accent-red)'
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
