import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QR from '../QR';

const NotInCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const handleOnClickJoin = () => {
        navigate(`/call/${id}`);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${id}`);
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a1a',
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{
                backgroundColor: '#12122a',
                borderRadius: 24,
                padding: '48px 40px',
                width: '100%',
                maxWidth: 440,
                border: '1px solid #1e1e3a',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: 32,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 8,
                }}>
                    NextMeet
                </div>

                <div style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
                    Ready to join the call?
                </div>

                <div style={{
                    backgroundColor: '#0a0a1a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 24,
                    border: '1px solid #1e1e3a',
                }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 2 }}>
                        Meeting Code
                    </div>
                    <div style={{
                        fontSize: 22,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: 3,
                    }}>
                        {id}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <button
                        onClick={copyToClipboard}
                        style={{
                            flex: 1,
                            backgroundColor: '#1a1a35',
                            border: '1px solid #2a2a4a',
                            color: '#888',
                            padding: '12px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontSize: 13,
                            transition: 'all 0.2s',
                        }}
                    >
                        📋 Copy Link
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <QR url={`${window.location.origin}/${id}`} />
                    </div>
                </div>

                <button
                    onClick={handleOnClickJoin}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '16px',
                        borderRadius: 14,
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
                        letterSpacing: 0.5,
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
                >
                    🎥 Join Call
                </button>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: 14,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#555',
                        cursor: 'pointer',
                        fontSize: 13,
                    }}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
};

export default NotInCall;
