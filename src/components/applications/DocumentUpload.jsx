import React, { useState } from 'react';

const DocumentUpload = ({ applicationId, documents = [], onUpload, onDelete, disabled = false }) => {
  const [uploading, setUploading] = useState({});

  const documentTypes = [
    { type: 'pay_stub', label: 'Pay Stub', required: true },
    { type: 'bank_statement', label: 'Bank Statement', required: true },
    { type: 'tax_return', label: 'Tax Return', required: false },
    { type: 'id_front', label: 'ID (Front)', required: true },
    { type: 'id_back', label: 'ID (Back)', required: true }
  ];

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ ...uploading, [documentType]: true });
    try {
      await onUpload(file, applicationId, documentType);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading({ ...uploading, [documentType]: false });
      e.target.value = '';
    }
  };

  const getDocumentForType = (type) => {
    return documents.find(doc => doc.document_type === type);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return '🖼️';
    }
    return '📄';
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500', color: '#202124' }}>
        Required Documents
      </h3>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {documentTypes.map(({ type, label, required }) => {
          const document = getDocumentForType(type);
          const isUploading = uploading[type];

          return (
            <div key={type} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {document ? (
                    <>
                      <span style={{ fontSize: '24px' }}>{getFileIcon(document.file_name)}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                          {document.file_name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#10b981' }}>
                          ✓ Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!disabled && (
                        <button
                          className="btn-text"
                          onClick={() => {
                            if (window.confirm('Delete this document?')) {
                              onDelete(document.id, document.file_url);
                            }
                          }}
                          style={{ color: '#ea4335', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '24px', opacity: 0.5 }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#202124' }}>
                          {label} {required && <span style={{ color: '#ea4335' }}>*</span>}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#5f6368' }}>
                          {required ? 'Required' : 'Optional'}
                        </p>
                      </div>
                      {!disabled && (
                        <label
                          className="btn-secondary"
                          style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            fontSize: '13px',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            opacity: isUploading ? 0.5 : 1
                          }}
                        >
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, type)}
                            disabled={isUploading || disabled}
                            style={{ display: 'none' }}
                          />
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </label>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Checklist Summary */}
      <div className="card" style={{ marginTop: '16px', background: '#f8f9fa' }}>
        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#202124' }}>
          Document Checklist
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {documentTypes.map(({ type, label, required }) => {
            const document = getDocumentForType(type);
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {document ? (
                  <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                ) : (
                  <span style={{ color: required ? '#ea4335' : '#9aa0a6', fontSize: '16px' }}>○</span>
                )}
                <span style={{ fontSize: '12px', color: '#5f6368' }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
