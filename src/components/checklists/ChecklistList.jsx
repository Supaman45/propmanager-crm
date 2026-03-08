import React, { useState } from 'react';

const ChecklistList = ({ checklists, onView, onEdit, onDelete, onCreate, properties = [] }) => {
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChecklists = checklists.filter(checklist => {
    // Filter by type
    if (filter !== 'all' && checklist.inspection_type !== filter) {
      return false;
    }

    // Filter by status
    if (statusFilter !== 'all' && checklist.status !== statusFilter) {
      return false;
    }

    // Filter by property
    if (propertyFilter !== 'all' && checklist.property_id !== parseInt(propertyFilter)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const property = checklist.property_id 
        ? properties.find(p => p.id === checklist.property_id || p.id === parseInt(checklist.property_id) || p.id.toString() === checklist.property_id.toString())
        : null;
      return (
        (checklist.unit_number && checklist.unit_number.toLowerCase().includes(query)) ||
        (property?.address?.toLowerCase().includes(query)) ||
        (checklist.property_id === null && 'no property selected'.includes(query))
      );
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      draft: { background: '#f3f4f6', color: '#6b7280' },
      in_progress: { background: '#dbeafe', color: '#1e40af' },
      completed: { background: '#d1fae5', color: '#065f46' }
    };
    const style = styles[status] || styles.draft;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        ...style
      }}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        background: type === 'move_in' ? '#dbeafe' : '#fef3c7',
        color: type === 'move_in' ? '#1e40af' : '#92400e'
      }}>
        {type === 'move_in' ? 'Move-in' : 'Move-out'}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '500', marginBottom: '4px', margin: 0, color: '#202124' }}>Inspection Checklists</h1>
          <p style={{ color: '#5f6368', fontSize: '14px', margin: '4px 0 0' }}>
            {filteredChecklists.length} checklist{filteredChecklists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={onCreate}>
          + New Checklist
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by unit number or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 16px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All Types' },
            { value: 'move_in', label: 'Move-in' },
            { value: 'move_out', label: 'Move-out' }
          ].map(option => (
            <button
              key={option.value}
              className={filter === option.value ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter(option.value)}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {option.label}
            </button>
          ))}
          {[
            { value: 'all', label: 'All Status' },
            { value: 'draft', label: 'Draft' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' }
          ].map(option => (
            <button
              key={option.value}
              className={statusFilter === option.value ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setStatusFilter(option.value)}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {option.label}
            </button>
          ))}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '13px',
              background: 'white'
            }}
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.address}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredChecklists.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#5f6368' }}>
            {searchQuery ? 'No checklists found matching your search' : 'No checklists yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredChecklists.map(checklist => {
            // Find property - handle both number and string ID comparisons
            const property = checklist.property_id 
              ? properties.find(p => p.id === checklist.property_id || p.id === parseInt(checklist.property_id) || p.id.toString() === checklist.property_id.toString())
              : null;
            
            const propertyDisplay = property 
              ? property.address 
              : (checklist.property_id ? 'Property Not Found' : 'No Property Selected');
            
            return (
              <div key={checklist.id} className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {getTypeBadge(checklist.inspection_type)}
                      {getStatusBadge(checklist.status)}
                    </div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '500', color: '#202124' }}>
                      {propertyDisplay} {checklist.unit_number && `- Unit ${checklist.unit_number}`}
                    </h3>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#5f6368' }}>
                      Inspector: {checklist.inspector_name || 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9aa0a6' }}>
                      {new Date(checklist.inspection_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(checklist.id);
                      }}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      View
                    </button>
                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(checklist.id);
                      }}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this checklist?')) {
                          onDelete(checklist.id);
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: '13px', color: '#ea4335' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {checklist.checklist_items && checklist.checklist_items.length > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5f6368' }}>
                      {checklist.checklist_items.length} item{checklist.checklist_items.length !== 1 ? 's' : ''} inspected
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChecklistList;
