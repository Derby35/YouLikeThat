import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const POSITIONS = ['QB', 'RB', 'WR', 'TE'];

const Players = () => {
  const [players,   setPlayers]   = useState([]);
  const [search,    setSearch]    = useState('');
  const [teamFilter,setTeamFilter]= useState('');
  const [posFilter, setPosFilter] = useState('');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get('/api/players').then((res) => {
      setPlayers(res.data);
      setLoading(false);
    });
  }, []);

  // derive team options straight from the player data
  const teams = [...new Map(
    players.filter((p) => p.teamAbbr).map((p) => [p.teamAbbr, p.teamName || p.teamAbbr])
  ).entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = players.filter((p) => {
    const matchSearch = !search    || p.name.toLowerCase().includes(search.toLowerCase());
    const matchTeam   = !teamFilter || p.teamAbbr === teamFilter;
    const matchPos    = !posFilter  || p.position === posFilter;
    return matchSearch && matchTeam && matchPos;
  });

  const clearFilters = () => { setSearch(''); setTeamFilter(''); setPosFilter(''); };
  const hasFilter    = search || teamFilter || posFilter;

  if (loading) return <div className="loading-state">Loading players...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Players</h1>
          <p>{filtered.length} player{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">&#128269;</span>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
          <option value="">All Positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <select className="filter-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">All Teams</option>
          {teams.map(([abbr, name]) => (
            <option key={abbr} value={abbr}>{name}</option>
          ))}
        </select>
        {hasFilter && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Position</th>
              <th>Team</th>
              <th>Age</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  No players found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p._id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                    {i + 1}
                  </td>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td>
                    <span className={`pos-badge pos-${p.position}`}>{p.position}</span>
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{p.teamAbbr}</span>
                    {p.teamName && p.teamName !== p.teamAbbr && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '12px' }}>
                        {p.teamName}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>{p.age || '—'}</td>
                  <td>
                    <Link to={`/players/${p._id}`} className="btn btn-ghost btn-sm">Stats</Link>
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

export default Players;
