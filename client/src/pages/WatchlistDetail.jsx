import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const WatchlistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [watchlist,       setWatchlist]       = useState(null);
  const [allPlayers,      setAllPlayers]      = useState([]);
  const [selectedPlayer,  setSelectedPlayer]  = useState('');
  const [editing,         setEditing]         = useState(false);
  const [editForm,        setEditForm]        = useState({ name: '', description: '' });
  const [confirmDelete,   setConfirmDelete]   = useState(false);
  const [removeTarget,    setRemoveTarget]    = useState(null);
  const [msg,             setMsg]             = useState('');
  const [loading,         setLoading]         = useState(true);

  const load = async () => {
    const [wlRes, pRes] = await Promise.all([
      api.get(`/api/watchlists/${id}`),
      api.get('/api/players'),
    ]);
    setWatchlist(wlRes.data);
    setEditForm({ name: wlRes.data.name, description: wlRes.data.description || '' });
    setAllPlayers(pRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const inWatchlist = watchlist?.players?.map((p) => p._id) || [];
  const available   = allPlayers.filter((p) => !inWatchlist.includes(p._id));

  const handleAddPlayer = async () => {
    if (!selectedPlayer) return;
    setMsg('');
    try {
      await api.post(`/api/watchlists/${id}/players`, { playerId: selectedPlayer });
      setSelectedPlayer('');
      setMsg('Player added.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error adding player.');
    }
  };

  const handleRemovePlayer = async () => {
    if (!removeTarget) return;
    await api.delete(`/api/watchlists/${id}/players/${removeTarget}`);
    setRemoveTarget(null);
    load();
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await api.put(`/api/watchlists/${id}`, editForm);
    setEditing(false);
    load();
  };

  const handleDeleteWatchlist = async () => {
    await api.delete(`/api/watchlists/${id}`);
    navigate('/watchlists');
  };

  if (loading) return <div className="loading-state">Loading watchlist...</div>;
  if (!watchlist) return <div className="empty-state"><h3>Watchlist not found</h3></div>;

  return (
    <div>
      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${watchlist.name}"? This cannot be undone.`}
          onConfirm={handleDeleteWatchlist}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {removeTarget && (
        <ConfirmModal
          message="Remove this player from the watchlist?"
          onConfirm={handleRemovePlayer}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      <div style={{ marginBottom: '16px' }}>
        <Link to="/watchlists" className="btn btn-ghost btn-sm">Back to Watchlists</Link>
      </div>

      {editing ? (
        <div className="card mb-24">
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label">Watchlist Name</label>
              <input
                className="form-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="page-header">
          <div>
            <h1>{watchlist.name}</h1>
            {watchlist.description && (
              <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>{watchlist.description}</p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
              {watchlist.players?.length || 0} player{watchlist.players?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-danger  btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
        {/* players table */}
        <div>
          <div className="section-title mb-12">Players in This Watchlist</div>
          <div className="table-wrapper">
            {!watchlist.players?.length ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <p>No players yet. Use the panel on the right to add some.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Position</th>
                    <th>Team</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.players.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: '600' }}>
                        {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name}
                      </td>
                      <td>
                        <span className={`pos-badge pos-${p.position}`}>{p.position}</span>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>
                        {p.teamAbbr || p.teamName || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link to={`/players/${p._id}`} className="btn btn-ghost btn-sm">View</Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setRemoveTarget(p._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* add player */}
        <div>
          <div className="section-title mb-12">Add a Player</div>
          <div className="card">
            {available.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                All players are already in this watchlist.
              </p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select Player</label>
                  <select
                    className="form-select"
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                  >
                    <option value="">Choose a player...</option>
                    {available.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.position} — {p.teamAbbr})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleAddPlayer}
                  disabled={!selectedPlayer}
                >
                  Add to Watchlist
                </button>
                {msg && (
                  <p style={{
                    marginTop: '10px',
                    fontSize: '13px',
                    color: msg.includes('added') ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}>
                    {msg}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchlistDetail;
