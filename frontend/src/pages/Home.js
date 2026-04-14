import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const generateMeetCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment()}-${segment()}-${segment()}`;
};

const Home = () => {
    const navigate = useNavigate();
    const [firebaseUser] = useAuthState(auth);
    const [guestName, setGuestName] = useState(localStorage.getItem('guestName') || '');
    const [meetingCode, setMeetingCode] = useState('');
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const [chatName, setChatName] = useState(localStorage.getItem('chatName') || '');
    const [showChatNameInput, setShowChatNameInput] = useState(false);
    const [globalMessages, setGlobalMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);
    const [chatWidth, setChatWidth] = useState(320);
    const isResizing = useRef(false);

    const currentUser = firebaseUser
        ? { name: firebaseUser.displayName, photoURL: firebaseUser.photoURL, uid: firebaseUser.uid }
        : guestName ? { name: guestName, uid: 'guest-' + guestName } : null;

    const chatUser = firebaseUser
        ? firebaseUser.displayName
        : chatName || null;

    useEffect(() => {
        const q = query(collection(db, 'globalChat'), orderBy('createdAt', 'asc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setGlobalMessages(msgs);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [globalMessages]);

    const handleAction = (action) => {
        if (!currentUser) {
            setPendingAction(action);
            setShowGuestInput(true);
            return;
        }
        executeAction(action);
    };

    const executeAction = (action) => {
        if (action === 'create') navigate(`/preview/${generateMeetCode()}`);
        else if (action === 'join' && meetingCode.trim()) navigate(`/preview/${meetingCode.trim()}`);
    };

    const handleGuestSubmit = () => {
        if (!guestName.trim()) return;
        localStorage.setItem('guestName', guestName.trim());
        setShowGuestInput(false);
        if (pendingAction) { executeAction(pendingAction); setPendingAction(null); }
    };

    const handleChatNameSubmit = () => {
        if (!chatName.trim()) return;
        localStorage.setItem('chatName', chatName.trim());
        setShowChatNameInput(false);
    };

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;
        if (!chatUser) { setShowChatNameInput(true); return; }
        try {
            await addDoc(collection(db, 'globalChat'), {
                sender: { name: chatUser, uid: currentUser?.uid || 'chat-' + chatUser },
                message: chatInput.trim(),
                timestamp: new Date().toISOString(),
                createdAt: serverTimestamp(),
            });
        } catch (e) { console.error('Failed to send:', e); }
        setChatInput('');
    };

    const handleChatKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
    };

    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleLogout = () => {
        signOut(auth);
        localStorage.removeItem('guestName');
        localStorage.removeItem('chatName');
        localStorage.removeItem('userName');
        localStorage.removeItem('token');
        window.location.reload();
    };

    const myUid = currentUser?.uid || (chatUser ? 'chat-' + chatUser : null);

    const handleMouseDown = useCallback((e) => {
        isResizing.current = true;
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const newWidth = Math.min(600, Math.max(240, e.clientX));
            setChatWidth(newWidth);
        };
        const handleMouseUp = () => { isResizing.current = false; };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0a0a1a', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

            <div style={{
                width: chatWidth,
                display: 'flex',
                flexDirection: 'column',
                borderRight: 'none',
                backgroundColor: '#0f0f24',
                flexShrink: 0,
                position: 'relative',
            }}>
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: -3,
                        width: 6,
                        height: '100%',
                        cursor: 'col-resize',
                        zIndex: 10,
                        backgroundColor: isResizing.current ? '#667eea' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isResizing.current) e.target.style.backgroundColor = '#667eea44'; }}
                    onMouseLeave={(e) => { if (!isResizing.current) e.target.style.backgroundColor = 'transparent'; }}
                />
                <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #1e1e3a',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>🌍 Global Chat</div>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                }}>
                    {globalMessages.length === 0 && (
                        <div style={{ textAlign: 'center', marginTop: 60, color: '#444', fontSize: 13 }}>
                            No messages yet. Say hi! 👋
                        </div>
                    )}
                    {globalMessages.map((msg) => {
                        const isMe = msg.sender?.uid === myUid;
                        return (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.2s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                                    <span style={{ fontSize: 10, color: isMe ? '#667eea' : '#666', fontWeight: 600, cursor: 'default' }} title={new Date(msg.timestamp).toLocaleString()}>
                                        {isMe ? 'You' : msg.sender?.name}
                                    </span>
                                    <span style={{ fontSize: 9, color: '#444' }}>{formatTime(msg.timestamp)}</span>
                                </div>
                                <div style={{
                                    backgroundColor: isMe ? '#667eea' : '#1a1a35',
                                    color: '#fff',
                                    padding: '7px 12px',
                                    borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                                    maxWidth: '85%',
                                    wordBreak: 'break-word',
                                    fontSize: 13,
                                    lineHeight: 1.4,
                                }}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {showChatNameInput ? (
                    <div style={{
                        padding: '12px',
                        borderTop: '1px solid #1e1e3a',
                        backgroundColor: '#0f0f24',
                    }}>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>You are visible as:</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleChatNameSubmit(); }}
                                autoFocus
                                style={{
                                    flex: 1,
                                    backgroundColor: '#1a1a35',
                                    border: '1px solid #2a2a4a',
                                    borderRadius: 10,
                                    padding: '9px 14px',
                                    color: '#fff',
                                    fontSize: 13,
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={handleChatNameSubmit}
                                disabled={!chatName.trim()}
                                style={{
                                    backgroundColor: chatName.trim() ? '#667eea' : '#333',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '0 16px',
                                    cursor: chatName.trim() ? 'pointer' : 'default',
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                            >
                                Go
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        padding: '10px 12px',
                        borderTop: '1px solid #1e1e3a',
                        backgroundColor: '#0a0a1a',
                    }}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleChatKeyDown}
                            style={{
                                flex: 1,
                                backgroundColor: '#1a1a35',
                                border: 'none',
                                borderRadius: 18,
                                padding: '9px 16px',
                                color: '#fff',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleSendChat}
                            disabled={!chatInput.trim()}
                            style={{
                                backgroundColor: chatInput.trim() ? '#667eea' : '#333',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 36,
                                height: 36,
                                cursor: chatInput.trim() ? 'pointer' : 'default',
                                fontSize: 15,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            ➤
                        </button>
                    </div>
                )}
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                position: 'relative',
            }}>
                {currentUser && (
                    <div style={{ position: 'absolute', top: 20, right: 30, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: '#888', fontSize: 14 }}>
                            {currentUser.photoURL && <img src={currentUser.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }} />}
                            {currentUser.name}
                        </span>
                        <button onClick={handleLogout} style={{
                            backgroundColor: 'transparent', border: '1px solid #333', color: '#888',
                            padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        }}>Logout</button>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <div style={{
                        fontSize: 56,
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: -2,
                    }}>
                        NextMeet
                    </div>
                    <div style={{ fontSize: 17, color: '#777', marginTop: 8, fontWeight: 300, letterSpacing: 1 }}>
                        One Step towards Closer Globe
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}>
                    <button onClick={() => handleAction('create')} style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff', border: 'none', padding: '15px 24px', borderRadius: 14,
                        fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 28px rgba(102,126,234,0.5)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(102,126,234,0.3)'; }}
                    >
                        ✨ Create a Meeting
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e3a' }} />
                        <span style={{ color: '#444', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>or join</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e3a' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            placeholder="abc-def-ghi"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAction('join'); }}
                            style={{
                                flex: 1, backgroundColor: '#12122a', border: '1px solid #2a2a4a',
                                borderRadius: 12, padding: '13px 18px', color: '#fff', fontSize: 15,
                                outline: 'none', fontFamily: 'monospace', letterSpacing: 2,
                            }}
                        />
                        <button onClick={() => handleAction('join')} disabled={!meetingCode.trim()} style={{
                            backgroundColor: meetingCode.trim() ? '#42e695' : '#12122a',
                            color: meetingCode.trim() ? '#000' : '#444',
                            border: meetingCode.trim() ? 'none' : '1px solid #2a2a4a',
                            padding: '13px 28px', borderRadius: 12, fontSize: 15,
                            fontWeight: 700, cursor: meetingCode.trim() ? 'pointer' : 'default',
                            transition: 'all 0.3s',
                        }}>Join</button>
                    </div>

                    {!currentUser && (
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <button onClick={() => navigate('/login')} style={{
                                backgroundColor: 'transparent', color: '#667eea', border: 'none',
                                cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
                            }}>Or sign in with your account</button>
                        </div>
                    )}
                </div>

                {showGuestInput && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                        backdropFilter: 'blur(4px)',
                    }}>
                        <div style={{
                            backgroundColor: '#14142a', borderRadius: 20, padding: 32, width: 360,
                            border: '1px solid #2a2a4a', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Join as Guest</div>
                            <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Enter your name to continue</div>
                            <input
                                type="text"
                                placeholder="Your name"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleGuestSubmit(); }}
                                autoFocus
                                style={{
                                    width: '100%', backgroundColor: '#0f0f24', border: '1px solid #2a2a4a',
                                    borderRadius: 12, padding: '13px 18px', color: '#fff', fontSize: 15,
                                    outline: 'none', marginBottom: 14, boxSizing: 'border-box',
                                }}
                            />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => { setShowGuestInput(false); setPendingAction(null); }} style={{
                                    flex: 1, backgroundColor: 'transparent', border: '1px solid #333',
                                    color: '#888', padding: '11px', borderRadius: 12, cursor: 'pointer', fontSize: 14,
                                }}>Cancel</button>
                                <button onClick={handleGuestSubmit} disabled={!guestName.trim()} style={{
                                    flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none', color: '#fff', padding: '11px', borderRadius: 12,
                                    cursor: guestName.trim() ? 'pointer' : 'default', fontSize: 14, fontWeight: 700,
                                }}>Continue</button>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ position: 'absolute', bottom: 20, color: '#222', fontSize: 11 }}>
                    © 2026 NextMeet
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default Home;
