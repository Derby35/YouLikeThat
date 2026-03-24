import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const Watchlists = () => {
  const [watchlists,   setWatchlists]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [form,         setForm]         = useState({ name: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error,        setError]        = useState('');

  const load = async () => {
    const res = await api.get('/api/watchlists');
    setWatchlists(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/watchlists', form);
      setForm({ name: '', description: '' });
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create watchlist.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/api/watchlists/${deleteTarget}`);
    setDeleteTarget(null);
    load();
  };

  if (loading) return <div className="loading-state">Loading watchlists...</div>;

  return (
    <div>
      {deleteTarget && (
        <ConfirmModal
          message="Delete this watchlist? All players in it will be removed."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Watchlist</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Top QBs 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  className="form-input"
                  placeholder="What is this watchlist for?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>My Watchlists</h1>
          <p>Group players you want to keep an eye on. A player can appear in multiple watchlists.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          New Watchlist
        </button>
      </div>

      {watchlists.length === 0 ? (
        <div className="empty-state">
          <h3>No watchlists yet</h3>
          <p>Create your first watchlist to start tracking players.</p>
          <button className="btn btn-primary mt-16" onClick={() => setShowCreate(true)}>
            Create Watchlist
          </button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlists.map((wl) => (
            <div key={wl._id} className="watchlist-card">
              <h3>{wl.name}</h3>
              {wl.description && <p>{wl.description}</p>}
              <div className="watchlist-card-footer">
                <span className="player-count">
                  <strong>{wl.playerCount || 0}</strong> player{wl.playerCount !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/watchlists/${wl._id}`} className="btn btn-secondary btn-sm">Open</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(wl._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlists;
