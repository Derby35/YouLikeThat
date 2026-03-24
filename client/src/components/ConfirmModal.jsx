const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal" style={{ maxWidth: '420px' }}>
      <h3>Confirm Delete</h3>
      <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '24px' }}>
        {message || 'Are you sure you want to delete this? This action cannot be undone.'}
      </p>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
