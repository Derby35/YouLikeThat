import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [players,    setPlayers]    = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/players'),
      api.get('/api/watchlists'),
    ]).then(([pRes, wRes]) => {
      setPlayers(pRes.data);
      setWatchlists(wRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading dashboard...</div>;

  // just show the top 8 for the dashboard preview
  const topPlayers = [...players]
    .sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0))
    .slice(0, 8);

  return (
    <div>
      <img
        src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
        alt="NFL Logo"
        className="nfl-logo"
      />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>
          Welcome back, <span style={{ color: 'var(--accent)' }}>{user?.username}</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
          2024 NFL Season — here is your personal overview
        </p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-label">Players in Database</div>
          <div className="stat-card-value">{players.length}</div>
          <div className="stat-card-sub">
            <Link to="/players" style={{ color: 'var(--accent)' }}>Browse all players</Link>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-label">My Watchlists</div>
          <div className="stat-card-value">{watchlists.length}</div>
          <div className="stat-card-sub">
            <Link to="/watchlists" style={{ color: 'var(--accent-orange)' }}>Manage watchlists</Link>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-label">Season</div>
          <div className="stat-card-value">2024</div>
          <div className="stat-card-sub">NFL Regular Season</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* top players table */}
        <div>
          <div className="section-title">Top Players by Fantasy Points</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: '600' }}>{p.name}</td>
                    <td><span className={`pos-badge pos-${p.position}`}>{p.position}</span></td>
                    <td style={{ color: 'var(--text-dim)' }}>{p.teamAbbr || p.teamName}</td>
                    <td>
                      <Link to={`/players/${p._id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <Link to="/players" className="btn btn-ghost btn-sm">See all players</Link>
          </div>
        </div>

        {/* watchlists sidebar */}
        <div>
          <div className="section-title">My Watchlists</div>
          {watchlists.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '14px' }}>
                No watchlists yet. Create one to start tracking players.
              </p>
              <Link to="/watchlists" className="btn btn-primary btn-sm">Create Watchlist</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {watchlists.slice(0, 5).map((wl) => (
                <Link key={wl._id} to={`/watchlists/${wl._id}`}>
                  <div className="watchlist-card" style={{ cursor: 'pointer' }}>
                    <h3>{wl.name}</h3>
                    {wl.description && <p>{wl.description}</p>}
                    <div className="player-count">
                      <strong>{wl.playerCount || 0}</strong> player{wl.playerCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Link>
              ))}
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link to="/watchlists" className="btn btn-ghost btn-sm">All watchlists</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
