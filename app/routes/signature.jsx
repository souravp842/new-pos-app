import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

export default function Signature() {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: '#fff',
        penColor: 'black',
      });
      signaturePadRef.current = pad;
    }
  }, []);

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('Please sign before submitting.');
      return;
    }

    const orderId = new URLSearchParams(window.location.search).get('orderId');
    const dataURL = signaturePadRef.current.toDataURL();

    const response = await fetch('/api/save-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, imageData: dataURL }),
    });

    if (response.ok) {
      setSubmitted(true);
    } else {
      alert('Error saving signature.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Customer Contract</h2>
      <p>By signing below, you agree to the terms of the contract.</p>

      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        style={{ border: '1px solid black', display: 'block', marginBottom: 10 }}
      />

      <button onClick={handleClear}>Clear</button>
      <button onClick={handleSubmit} style={{ marginLeft: 10 }}>Submit</button>

      {submitted && <p style={{ color: 'green' }}>✅ Signature submitted!</p>}
    </div>
  );
}
