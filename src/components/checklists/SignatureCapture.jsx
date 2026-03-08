import React, { useRef, useEffect, useState } from 'react';

const SignatureCapture = ({ onSave, existingSignature, label, disabled }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#202124';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (existingSignature) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onSave) {
      onSave(null);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!hasSignature) {
      alert('Please provide a signature');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{
        border: '1px solid #dadce0',
        borderRadius: '4px',
        padding: '12px',
        background: disabled ? '#f8f9fa' : 'white'
      }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            startDrawing(e.touches[0]);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e.touches[0]);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
          style={{
            width: '100%',
            height: '200px',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none'
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            style={{ padding: '8px 16px' }}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={saveSignature}
            disabled={disabled || !hasSignature}
            style={{ padding: '8px 16px' }}
          >
            Save Signature
          </button>
        </div>
        {existingSignature && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#10b981' }}>
            ✓ Signature saved
          </p>
        )}
      </div>
    </div>
  );
};

export default SignatureCapture;
