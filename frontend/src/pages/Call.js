import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Typography, Box, IconButton, Badge, Tooltip, Snackbar } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import withAuth from '../utils/withAuth';
import MeetCard from '../components/MeetItem';
import ChatPanel from '../components/ChatPanel';
import { TiMicrophone } from 'react-icons/ti';
import { FaCamera, FaHandPaper } from 'react-icons/fa';
import { MdCallEnd, MdChat } from 'react-icons/md';
import { BsFillMicMuteFill, BsPeopleFill } from 'react-icons/bs';
import { RiCameraOffFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import Participant from '../components/Participant';
import QR from '../components/QR';
import Clock from 'react-live-clock';
import Search from '../components/Participant/search';
import SERVER from '../config';

const videoCardStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#1e1e2e',
    border: '1px solid #2a2a4a',
    transition: 'all 0.3s ease',
};

const createDummyStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const videoTrack = canvas.captureStream(1).getVideoTracks()[0];
    videoTrack.enabled = false;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const dest = audioCtx.createMediaStreamDestination();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(dest);
    oscillator.start();
    const audioTrack = dest.stream.getAudioTracks()[0];
    audioTrack.enabled = false;

    return new MediaStream([videoTrack, audioTrack]);
};

const JoinCall = () => {
    const { id } = useParams();
    const [mic, setMic] = useState(false);
    const [camera, setCamera] = useState(false);
    const [peers, setPeers] = useState([]);

    const [chatOpen, setChatOpen] = useState(false);
    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [handRaised, setHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState({});
    const [handNotification, setHandNotification] = useState('');

    const localVideo = useRef(null);
    const socket = useRef();
    const peersRef = useRef([]);
    const roomID = id;
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const [search, setSearch] = useState('');

    const dummyStreamRef = useRef(null);
    const localStreamRef = useRef(null);
    const realVideoTrackRef = useRef(null);
    const realAudioTrackRef = useRef(null);

    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    const chatOpenRef = useRef(chatOpen);
    useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);

    useEffect(() => {
        dummyStreamRef.current = createDummyStream();
        localStreamRef.current = dummyStreamRef.current;
        if (localVideo.current) {
            localVideo.current.srcObject = dummyStreamRef.current;
        }
    }, []);

    const getUserPayload = useCallback(() => ({
        uid: user?.uid,
        email: user?.email,
        name: user?.displayName,
        photoURL: user?.photoURL,
    }), [user]);

    const createPeer = useCallback((userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });
        peer.on('signal', (signal) => {
            socket.current.emit('sending signal', {
                userToSignal,
                callerID,
                signal,
                user: userRef.current
                    ? {
                          uid: userRef.current?.uid,
                          email: userRef.current?.email,
                          name: userRef.current?.displayName,
                          photoURL: userRef.current?.photoURL,
                      }
                    : null,
            });
        });
        return peer;
    }, []);

    const addPeer = useCallback((incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });
        peer.on('signal', (signal) => {
            socket.current.emit('returning signal', { signal, callerID });
        });
        peer.signal(incomingSignal);
        return peer;
    }, []);

    useEffect(() => {
        socket.current = io.connect(SERVER);
        if (!user || !dummyStreamRef.current) return;

        socket.current.emit('join room', {
            roomID,
            user: {
                uid: user?.uid,
                email: user?.email,
                name: user?.displayName,
                photoURL: user?.photoURL,
            },
        });

        socket.current.on('duplicate session', () => {
            if (realVideoTrackRef.current) realVideoTrackRef.current.stop();
            if (realAudioTrackRef.current) realAudioTrackRef.current.stop();
            alert('⚠️ Session Terminated\n\nYou have joined this meeting from another tab or window.\nThis session has been disconnected.\n\nOnly one active session per account is allowed.');
            navigate('/');
        });

        socket.current.on('all users', (users) => {
            const newPeers = [];
            users.forEach((u) => {
                const peer = createPeer(u.userId, socket.current.id, localStreamRef.current);
                peersRef.current.push({
                    peerID: u.userId,
                    peer,
                    user: u.user,
                });
                newPeers.push({
                    peerID: u.userId,
                    peer,
                    user: u.user,
                });
            });
            setPeers(newPeers);
        });

        socket.current.on('user joined', (payload) => {
            const existingIdx = peersRef.current.findIndex((p) => p.peerID === payload.callerID);
            if (existingIdx !== -1) {
                peersRef.current[existingIdx].peer.destroy();
                peersRef.current.splice(existingIdx, 1);
            }
            const peer = addPeer(payload.signal, payload.callerID, localStreamRef.current);
            peersRef.current.push({
                peerID: payload.callerID,
                peer,
                user: payload.user,
            });
            setPeers((prev) => {
                const filtered = prev.filter((p) => p.peerID !== payload.callerID);
                return [...filtered, {
                    peerID: payload.callerID,
                    peer,
                    user: payload.user,
                }];
            });
        });

        socket.current.on('receiving returned signal', (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) item.peer.signal(payload.signal);
        });

        socket.current.on('user left', (leftId) => {
            const peerObj = peersRef.current.find((p) => p.peerID === leftId);
            if (peerObj) peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter((p) => p.peerID !== leftId);
            setPeers((prev) => prev.filter((p) => p.peerID !== leftId));
        });

        socket.current.on('chat message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            if (!chatOpenRef.current) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        socket.current.on('raise hand', (payload) => {
            setRaisedHands((prev) => ({ ...prev, [payload.uid]: payload.raised }));
            if (payload.raised && payload.uid !== user?.uid) {
                setHandNotification(`✋ ${payload.name} raised their hand`);
            }
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
        // eslint-disable-next-line
    }, [user, roomID]);

    const replaceTrackOnAllPeers = (oldTrack, newTrack) => {
        peersRef.current.forEach(({ peer }) => {
            if (peer && !peer.destroyed) {
                try {
                    peer.replaceTrack(oldTrack, newTrack, localStreamRef.current);
                } catch (e) {
                    console.warn('replaceTrack failed:', e);
                }
            }
        });
    };

    const handleCamera = async () => {
        if (!camera) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = mediaStream.getVideoTracks()[0];

                const dummyVideoTrack = localStreamRef.current.getVideoTracks()[0];
                localStreamRef.current.removeTrack(dummyVideoTrack);
                localStreamRef.current.addTrack(newVideoTrack);

                replaceTrackOnAllPeers(dummyVideoTrack, newVideoTrack);

                if (realVideoTrackRef.current) realVideoTrackRef.current.stop();
                realVideoTrackRef.current = newVideoTrack;

                if (localVideo.current) {
                    localVideo.current.srcObject = localStreamRef.current;
                }
                setCamera(true);
            } catch (err) {
                console.error('Camera access denied:', err.message);
            }
        } else {
            if (realVideoTrackRef.current) {
                const dummyStream = createDummyStream();
                const dummyVideoTrack = dummyStream.getVideoTracks()[0];
                dummyVideoTrack.enabled = false;

                replaceTrackOnAllPeers(realVideoTrackRef.current, dummyVideoTrack);

                localStreamRef.current.removeTrack(realVideoTrackRef.current);
                localStreamRef.current.addTrack(dummyVideoTrack);

                realVideoTrackRef.current.stop();
                realVideoTrackRef.current = null;

                if (localVideo.current) {
                    localVideo.current.srcObject = localStreamRef.current;
                }
            }
            setCamera(false);
        }
        socket.current.emit('video permission', {
            video: !camera,
            user: getUserPayload(),
        });
    };

    const handleMic = async () => {
        if (!mic) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const newAudioTrack = mediaStream.getAudioTracks()[0];

                const dummyAudioTrack = localStreamRef.current.getAudioTracks()[0];
                localStreamRef.current.removeTrack(dummyAudioTrack);
                localStreamRef.current.addTrack(newAudioTrack);

                replaceTrackOnAllPeers(dummyAudioTrack, newAudioTrack);

                if (realAudioTrackRef.current) realAudioTrackRef.current.stop();
                realAudioTrackRef.current = newAudioTrack;
                setMic(true);
            } catch (err) {
                console.error('Mic access denied:', err.message);
            }
        } else {
            if (realAudioTrackRef.current) {
                const dummyStream = createDummyStream();
                const dummyAudioTrack = dummyStream.getAudioTracks()[0];
                dummyAudioTrack.enabled = false;

                replaceTrackOnAllPeers(realAudioTrackRef.current, dummyAudioTrack);

                localStreamRef.current.removeTrack(realAudioTrackRef.current);
                localStreamRef.current.addTrack(dummyAudioTrack);

                realAudioTrackRef.current.stop();
                realAudioTrackRef.current = null;
            }
            setMic(false);
        }
    };

    const handleRaiseHand = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        socket.current.emit('raise hand', {
            uid: user?.uid,
            name: user?.displayName,
            raised: newState,
        });
    };

    const handleEnd = () => {
        if (realVideoTrackRef.current) realVideoTrackRef.current.stop();
        if (realAudioTrackRef.current) realAudioTrackRef.current.stop();
        navigate('/');
        window.location.reload();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(e.target.value);
    };

    const filteredPeers = (peerList) =>
        peerList.filter((peer) => peer.user?.name?.toLowerCase().includes(search.toLowerCase()));

    const totalParticipants = 1 + peers.length;
    const sidebarOpen = chatOpen || participantsOpen;

    const getVideoSize = () => {
        const count = totalParticipants;
        if (count <= 1) return { width: '100%', maxWidth: 640, height: 400 };
        if (count <= 2) return { width: 'calc(50% - 12px)', maxWidth: 580, height: 340 };
        if (count <= 4) return { width: 'calc(50% - 12px)', maxWidth: 480, height: 280 };
        return { width: 'calc(33.33% - 12px)', maxWidth: 400, height: 240 };
    };

    const videoSize = getVideoSize();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f0f1a', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignContent: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        p: 2,
                        overflow: 'auto',
                        transition: 'all 0.3s ease',
                        '&::-webkit-scrollbar': { display: 'none' },
                    }}
                >
                    <Box
                        sx={{
                            ...videoCardStyles,
                            width: videoSize.width,
                            maxWidth: videoSize.maxWidth,
                            height: videoSize.height,
                            position: 'relative',
                        }}
                    >
                        <video
                            muted
                            playsInline
                            autoPlay
                            controls={false}
                            ref={localVideo}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: camera ? 'block' : 'none',
                            }}
                        />
                        {!camera && (
                            <Box sx={{
                                width: '100%',
                                height: '100%',
                                display: 'grid',
                                placeItems: 'center',
                                background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%)',
                            }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <img
                                        src={user?.photoURL || 'https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png'}
                                        alt={user?.displayName}
                                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea' }}
                                    />
                                </Box>
                            </Box>
                        )}
                        {handRaised && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, fontSize: '24px', animation: 'handWave 1s ease-in-out infinite' }}>
                                ✋
                            </Box>
                        )}
                        {!mic && (
                            <Box sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: '50%', p: '4px', display: 'flex' }}>
                                <BsFillMicMuteFill size={14} color="#fff" />
                            </Box>
                        )}
                        <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            p: '16px 12px 8px',
                        }}>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>
                                {user?.displayName} (You)
                            </Typography>
                        </Box>
                    </Box>

                    {peers.map((peer) => (
                        <Box key={peer?.peerID} sx={{ ...videoCardStyles, width: videoSize.width, maxWidth: videoSize.maxWidth, height: videoSize.height, position: 'relative' }}>
                            <MeetCard user={peer.user} peer={peer?.peer} />
                            {raisedHands[peer.user?.uid] && (
                                <Box sx={{ position: 'absolute', top: 8, right: 8, fontSize: '24px', animation: 'handWave 1s ease-in-out infinite' }}>
                                    ✋
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>

                {sidebarOpen && (
                    <Box sx={{
                        width: { xs: '100%', md: 340 },
                        borderLeft: '1px solid #2a2a4a',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#1a1a2e',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                    }}>
                        {participantsOpen && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: chatOpen ? '40%' : '100%',
                                borderBottom: chatOpen ? '1px solid #2a2a4a' : 'none',
                                overflow: 'auto',
                                '&::-webkit-scrollbar': { display: 'none' },
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: '12px 16px',
                                    borderBottom: '1px solid #2a2a4a',
                                    background: 'linear-gradient(135deg, #42e695 0%, #3bb2b8 100%)',
                                }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                                        👥 Participants ({totalParticipants})
                                    </Typography>
                                    <IconButton onClick={() => setParticipantsOpen(false)} size="small" sx={{ color: '#fff' }}>
                                        ✕
                                    </IconButton>
                                </Box>
                                <Box sx={{ p: '8px 12px' }}>
                                    <Search search={search} setSearch={setSearch} handleSearch={handleSearch} />
                                </Box>
                                <Box sx={{ px: '12px', pb: 1 }}>
                                    <Participant user={user} you={true} />
                                    {filteredPeers(peers).map((peer) => (
                                        <Participant key={peer.peerID} user={peer} />
                                    ))}
                                </Box>
                            </Box>
                        )}
                        {chatOpen && (
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                <ChatPanel
                                    open={chatOpen}
                                    onClose={() => setChatOpen(false)}
                                    socket={socket}
                                    user={user}
                                    messages={messages}
                                    unreadCount={unreadCount}
                                    onResetUnread={() => setUnreadCount(0)}
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 1, md: 3 },
                py: 1.5,
                backgroundColor: '#16162a',
                borderTop: '1px solid #2a2a4a',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                    <Typography variant="body2" sx={{ color: '#888', fontWeight: 500, fontFamily: 'monospace', fontSize: '14px' }}>
                        <Clock format={'HH:mm:ss'} ticking={true} />
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>
                    <Tooltip title={mic ? 'Mute mic' : 'Unmute mic'}>
                        <IconButton
                            onClick={handleMic}
                            sx={{
                                width: 48, height: 48,
                                backgroundColor: mic ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.08)',
                                border: mic ? '1px solid #667eea' : '1px solid #333',
                                color: mic ? '#667eea' : '#888',
                                '&:hover': { backgroundColor: mic ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.12)' },
                                transition: 'all 0.2s',
                            }}
                        >
                            {mic ? <TiMicrophone size={22} /> : <BsFillMicMuteFill size={18} />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={camera ? 'Turn off camera' : 'Turn on camera'}>
                        <IconButton
                            onClick={handleCamera}
                            sx={{
                                width: 48, height: 48,
                                backgroundColor: camera ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.08)',
                                border: camera ? '1px solid #667eea' : '1px solid #333',
                                color: camera ? '#667eea' : '#888',
                                '&:hover': { backgroundColor: camera ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.12)' },
                                transition: 'all 0.2s',
                            }}
                        >
                            {camera ? <FaCamera size={18} /> : <RiCameraOffFill size={20} />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={handRaised ? 'Lower hand' : 'Raise hand'}>
                        <IconButton
                            onClick={handleRaiseHand}
                            sx={{
                                width: 48, height: 48,
                                backgroundColor: handRaised ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.08)',
                                border: handRaised ? '1px solid #facc15' : '1px solid #333',
                                color: handRaised ? '#facc15' : '#888',
                                '&:hover': { backgroundColor: handRaised ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.12)' },
                                transition: 'all 0.2s',
                            }}
                        >
                            <FaHandPaper size={18} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="End call">
                        <IconButton
                            onClick={handleEnd}
                            sx={{
                                width: 56, height: 48,
                                backgroundColor: '#ef4444',
                                borderRadius: '16px',
                                color: '#fff',
                                '&:hover': { backgroundColor: '#dc2626' },
                                transition: 'all 0.2s',
                            }}
                        >
                            <MdCallEnd size={24} />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, minWidth: 120, justifyContent: 'flex-end' }}>
                    <Tooltip title="Chat">
                        <IconButton
                            onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setUnreadCount(0); }}
                            sx={{
                                width: 44, height: 44,
                                backgroundColor: chatOpen ? 'rgba(102,126,234,0.15)' : 'transparent',
                                color: chatOpen ? '#667eea' : '#888',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <Badge badgeContent={unreadCount} color="error" max={9}>
                                <MdChat size={22} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Participants">
                        <IconButton
                            onClick={() => setParticipantsOpen(!participantsOpen)}
                            sx={{
                                width: 44, height: 44,
                                backgroundColor: participantsOpen ? 'rgba(102,126,234,0.15)' : 'transparent',
                                color: participantsOpen ? '#667eea' : '#888',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <Badge badgeContent={totalParticipants} color="primary">
                                <BsPeopleFill size={20} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    <QR url={window.location.href} />
                </Box>
            </Box>

            <Snackbar
                open={!!handNotification}
                autoHideDuration={3000}
                onClose={() => setHandNotification('')}
                message={handNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ '& .MuiSnackbarContent-root': { backgroundColor: '#facc15', color: '#000', fontWeight: 600 } }}
            />

            <style>{`
                @keyframes handWave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-20deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Box>
    );
};
export default withAuth(JoinCall);
