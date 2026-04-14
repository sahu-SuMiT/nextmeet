import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QR from '../QR';

const NotInCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cameraOn, setCameraOn] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [stream]);

    const toggleCamera = async () => {
        if (!cameraOn) {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
                if (stream) stream.getTracks().forEach((t) => t.stop());
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
                setCameraOn(true);
                if (s.getAudioTracks().length > 0) setMicOn(true);
            } catch (e) { console.warn('Camera denied:', e.message); }
        } else {
            if (stream) {
                stream.getVideoTracks().forEach((t) => t.stop());
                if (!micOn) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }
            }
            setCameraOn(false);
        }
    };

    const toggleMic = async () => {
        if (!micOn) {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: cameraOn, audio: true });
                if (stream) stream.getTracks().forEach((t) => t.stop());
                setStream(s);
                if (videoRef.current) videoRef.current.srcObject = s;
                setMicOn(true);
                if (s.getVideoTracks().length > 0) setCameraOn(true);
            } catch (e) { console.warn('Mic denied:', e.message); }
        } else {
            if (stream) {
                stream.getAudioTracks().forEach((t) => t.stop());
                if (!cameraOn) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }
            }
            setMicOn(false);
        }
    };

    const handleJoin = () => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        navigate(`/call/${id}`);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${window.location.origin}/${id}`);
    };

    return (
        <div style={{
            width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#0a0a1a', fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{
                backgroundColor: '#12122a', borderRadius: 24, padding: '40px 36px',
                width: '100%', maxWidth: 520, border: '1px solid #1e1e3a',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        fontSize: 28, fontWeight: 800,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>NextMeet</div>
                    <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Ready to join?</div>
                </div>

                <div style={{
                    position: 'relative', width: '100%', height: 240, borderRadius: 16,
                    overflow: 'hidden', backgroundColor: '#0a0a1a', border: '1px solid #1e1e3a',
                    marginBottom: 20,
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            display: cameraOn ? 'block' : 'none',
                            transform: 'scaleX(-1)',
                        }}
                    />
                    {!cameraOn && (
                        <div style={{
                            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%)',
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', backgroundColor: '#2a2a4a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '3px solid #667eea', fontSize: 32, color: '#888',
                            }}>👤</div>
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: 12,
                    }}>
                        <button onClick={toggleMic} style={{
                            width: 44, height: 44, borderRadius: '50%',
                            backgroundColor: micOn ? 'rgba(102,126,234,0.2)' : 'rgba(239,68,68,0.2)',
                            border: micOn ? '2px solid #667eea' : '2px solid #ef4444',
                            color: micOn ? '#667eea' : '#ef4444',
                            cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {micOn ? '🎤' : '🔇'}
                        </button>
                        <button onClick={toggleCamera} style={{
                            width: 44, height: 44, borderRadius: '50%',
                            backgroundColor: cameraOn ? 'rgba(102,126,234,0.2)' : 'rgba(239,68,68,0.2)',
                            border: cameraOn ? '2px solid #667eea' : '2px solid #ef4444',
                            color: cameraOn ? '#667eea' : '#ef4444',
                            cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {cameraOn ? '📷' : '📷'}
                        </button>
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#0a0a1a', borderRadius: 12, padding: '12px 16px',
                    marginBottom: 20, border: '1px solid #1e1e3a', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 2 }}>Meeting Code</div>
                        <div style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color: '#fff', letterSpacing: 2, marginTop: 2 }}>{id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={copyToClipboard} style={{
                            backgroundColor: '#1a1a35', border: '1px solid #2a2a4a', color: '#888',
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        }}>📋</button>
                        <QR url={`${window.location.origin}/${id}`} />
                    </div>
                </div>

                <button onClick={handleJoin} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff', border: 'none', padding: '15px', borderRadius: 14,
                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(102,126,234,0.3)', letterSpacing: 0.5,
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
                >
                    🎥 Join Call
                </button>

                <button onClick={() => navigate('/')} style={{
                    display: 'block', margin: '14px auto 0', backgroundColor: 'transparent',
                    border: 'none', color: '#555', cursor: 'pointer', fontSize: 13,
                }}>← Back to Home</button>
            </div>
        </div>
    );
};

export default NotInCall;
