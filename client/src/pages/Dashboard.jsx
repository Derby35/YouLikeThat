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

  const topPlayers = [...players]
    .sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0))
    .slice(0, 8);

  return (
    <div>

      {/* Faint NFL watermark */}
      <img
        src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
        alt=""
        className="nfl-logo"
        aria-hidden="true"
      />

      {/* ── Welcome header ── */}
      <div className="dash-welcome">
        <div className="dash-welcome-glow" aria-hidden="true" />
        <div className="dash-welcome-eyebrow">2024 NFL Season</div>
        <h1 className="dash-welcome-title">
          Welcome back, <span className="dash-welcome-name">{user?.username}</span>
        </h1>
        <p className="dash-welcome-sub">Your personal fantasy football command center.</p>
      </div>

      {/* ── How it works ── */}
      <div className="hiw-grid">
        <div className="hiw-card" style={{ '--hiw-delay': '0ms' }}>
          <div className="hiw-num">01</div>
          <div className="hiw-body">
            <div className="hiw-title">Browse Players</div>
            <p className="hiw-desc">Explore the full 2024 NFL roster. Filter by position, search by name, and pull up complete multi-season stat histories.</p>
            <Link to="/players" className="hiw-link">Go to Players →</Link>
          </div>
        </div>
        <div className="hiw-card" style={{ '--hiw-delay': '80ms' }}>
          <div className="hiw-num">02</div>
          <div className="hiw-body">
            <div className="hiw-title">Build Watchlists</div>
            <p className="hiw-desc">Create custom lists to organise your roster targets. Track sleepers and injury returns all in one place.</p>
            <Link to="/watchlists" className="hiw-link">Go to Watchlists →</Link>
          </div>
        </div>
        <div className="hiw-card" style={{ '--hiw-delay': '160ms' }}>
          <div className="hiw-num">03</div>
          <div className="hiw-body">
            <div className="hiw-title">Dominate Your League</div>
            <p className="hiw-desc">Make data-driven start/sit calls every week. PPR-scored, position-filtered, and always up to date.</p>
          </div>
        </div>
      </div>

      {/* ── Feature strip ── */}
      <div className="feat-strip">
        {[
          { glyph: '◈', label: 'PPR Scoring',      desc: 'Points per reception calculated for every player' },
          { glyph: '⬡', label: 'Multi-Season Data', desc: 'Historical stats spanning multiple NFL seasons'    },
          { glyph: '◉', label: 'Position Filter',   desc: 'Instantly slice the roster by QB, RB, WR, TE'     },
          { glyph: '⊞', label: 'Custom Watchlists', desc: 'Build and manage unlimited player target lists'    },
        ].map((f, i) => (
          <div key={f.label} className="feat-strip-item" style={{ '--feat-delay': `${i * 60}ms` }}>
            <span className="feat-strip-glyph">{f.glyph}</span>
            <span className="feat-strip-label">{f.label}</span>
            <span className="feat-strip-desc">{f.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="dashboard-grid">

        {/* Top players table */}
        <div>
          <div className="section-title">Top Performers — Fantasy Points</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>Fant Pts</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((p, i) => (
                  <tr key={p._id}>
                    <td className="rank-cell">#{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <span className={`pos-badge pos-${p.position}`}>{p.position}</span>
                    </td>
                    <td style={{ color: 'var(--text-dim)' }}>
                      {p.teamAbbr || p.teamName}
                    </td>
                    <td>
                      <span className="fpts-pill">
                        {p.fantasyPoints?.toFixed(1) ?? '—'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/players/${p._id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <Link to="/players" className="btn btn-ghost btn-sm">See all players →</Link>
          </div>
        </div>

        {/* Watchlists sidebar */}
        <div>
          <div className="section-title">My Watchlists</div>
          {watchlists.length === 0 ? (
            <div className="card">
              <div className="wl-empty">
                <div className="wl-empty-icon">◎</div>
                <div className="wl-empty-title">No Watchlists Yet</div>
                <p className="wl-empty-sub">
                  Create a watchlist to start tracking your fantasy targets across positions.
                </p>
                <Link to="/watchlists" className="btn btn-primary btn-sm">
                  Create Watchlist
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {watchlists.slice(0, 5).map((wl) => (
                <Link key={wl._id} to={`/watchlists/${wl._id}`}>
                  <div className="watchlist-card">
                    <h3>{wl.name}</h3>
                    {wl.description && <p>{wl.description}</p>}
                    <div className="player-count">
                      <strong>{wl.playerCount || 0}</strong>{' '}
                      player{wl.playerCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Link>
              ))}
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link to="/watchlists" className="btn btn-ghost btn-sm">All watchlists →</Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
