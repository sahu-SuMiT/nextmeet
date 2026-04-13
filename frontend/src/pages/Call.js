import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Grid, Typography, Box, Button } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import withAuth from '../utils/withAuth';
import MeetCard from '../components/MeetItem';
import { TiMicrophone } from 'react-icons/ti';
import { FaCamera } from 'react-icons/fa';
import { MdCallEnd } from 'react-icons/md';
import { BsFillMicMuteFill } from 'react-icons/bs';
import { RiCameraOffFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import Participant from '../components/Participant';
import QR from '../components/QR';
import Clock from 'react-live-clock';
import Search from '../components/Participant/search';
import SERVER from '../config';

const styles = {
    MeetCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 450,
        height: 270,
        mt: 3,
        position: 'relative',
    },
    singleCenter: {
        display: 'grid',
        placeItems: 'center',
        borderRadius: 3,
    },
};

const JoinCall = () => {
    const { id } = useParams();
    const [mic, setMic] = useState(false);
    const [camera, setCamera] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState([]);
    const localVideo = useRef(null);
    const socket = useRef();
    const peersRef = useRef([]);
    const roomID = id;
    const navigate = useNavigate();
    const [user] = useAuthState(auth);
    const [search, setSearch] = useState('');
    const [mediaInitialized, setMediaInitialized] = useState(false);

    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    const localStreamRef = useRef(null);
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

    const createPeer = useCallback((userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream || undefined,
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
            stream: stream || undefined,
        });
        peer.on('signal', (signal) => {
            socket.current.emit('returning signal', { signal, callerID });
        });
        peer.signal(incomingSignal);
        return peer;
    }, []);

    useEffect(() => {
        socket.current = io.connect(SERVER);
        if (!user) return;

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
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
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

        socket.current.on('video permission', (payload) => {
            console.log(payload);
        });

        socket.current.on('user joined', (payload) => {
            const peer = addPeer(payload.signal, payload.callerID, localStreamRef.current);
            peersRef.current.push({
                peerID: payload.callerID,
                peer,
                user: payload.user,
            });
            setPeers((prev) => [...prev, {
                peerID: payload.callerID,
                peer,
                user: payload.user,
            }]);
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

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
        // eslint-disable-next-line
    }, [user, roomID]);

    const initializeMedia = async () => {
        if (mediaInitialized) return localStream;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setMediaInitialized(true);
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }
            peersRef.current.forEach(({ peer }) => {
                if (peer && !peer.destroyed) {
                    try {
                        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
                    } catch (e) { /* ignore */ }
                }
            });
            return stream;
        } catch (err) {
            console.warn('Camera/mic access denied:', err.message);
            return null;
        }
    };

    const handleCamera = async () => {
        if (!camera) {
            try {
                let stream = localStream;
                if (!stream) {
                    stream = await initializeMedia();
                    if (stream) {
                        setMic(true);
                        setCamera(true);
                    }
                    return;
                } else {
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) videoTrack.enabled = true;
                }
                setCamera(true);
            } catch (err) {
                console.error('Camera access denied:', err.message);
            }
        } else {
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) videoTrack.stop();
            }
            setCamera(false);
        }

        socket.current.emit('video permission', {
            video: !camera,
            user: user
                ? {
                      uid: user?.uid,
                      email: user?.email,
                      name: user?.displayName,
                      photoURL: user?.photoURL,
                  }
                : null,
        });
    };

    const handleMic = async () => {
        if (!mic) {
            try {
                let stream = localStream;
                if (!stream) {
                    stream = await initializeMedia();
                    if (stream) {
                        setMic(true);
                        setCamera(true);
                    }
                    return;
                } else {
                    const audioTrack = stream.getAudioTracks()[0];
                    if (audioTrack) audioTrack.enabled = true;
                }
                setMic(true);
            } catch (err) {
                console.error('Mic access denied:', err.message);
            }
        } else {
            if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                if (audioTrack) audioTrack.stop();
            }
            setMic(false);
        }
    };

    const handleEnd = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        navigate('/');
        window.location.reload();
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(e.target.value);
    };

    const filteredPeers = (peerList) =>
        peerList.filter((peer) => peer.user?.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <Grid container columns={12} sx={{ minHeight: '100vh' }}>
            <Grid
                item
                xs={12}
                md={9}
                lg={9}
                className="video-grid"
                sx={{ height: '90vh', padding: 3, overflow: 'auto' }}
            >
                <Box sx={styles.MeetCard}>
                     <video
                        muted
                        playsInline
                        autoPlay
                        controls={false}
                        ref={localVideo}
                        className="object-cover rounded-lg"
                        style={{
                            width: styles.MeetCard.width,
                            height: styles.MeetCard.height,
                            display: camera ? 'block' : 'none',
                        }}
                    />
                    {!camera && (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                backgroundColor: '#303030',
                                ...styles.singleCenter,
                            }}
                        >
                            <img
                                className="h-[35%] max-h-[150px] w-auto rounded-full aspect-square object-cover"
                                src={
                                    user?.photoURL ||
                                    'https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png'
                                }
                                alt={user?.displayName}
                            />
                        </Box>
                    )}

                    <Typography variant="body1" className="absolute bottom-4 left-4">
                        {user?.displayName}
                    </Typography>
                </Box>

                {peers.map((peer) => (
                    <MeetCard key={peer?.peerID} user={peer.user} peer={peer?.peer} />
                ))}
            </Grid>

            <Grid item xs={12} md={3} lg={3}>
                <Grid container columns={12}>
                    <Grid
                        item
                        xs={12}
                        md={12}
                        lg={12}
                        className="lightGrayBorder"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '90vh',
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                                display: 'none',
                            },
                        }}
                    >
                        <Typography variant="h6" className="mt-4" sx={{ mb: 3 }}>
                            Participants {1 + peers.length}
                        </Typography>
                        <Search search={search} setSearch={setSearch} handleSearch={handleSearch} />
                        <Participant user={user} you={true} />
                        {filteredPeers(peers).map((peer) => (
                            <Participant key={peer.peerID} user={peer} />
                        ))}
                    </Grid>
                </Grid>
            </Grid>
            <Grid container columns={12}>
                <Grid item xs={2} md={2} lg={2} className="h-16 flex items-center justify-center">
                    <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                        <Clock format={'HH:mm:ss'} ticking={true} />
                    </Typography>
                </Grid>
                <Grid item xs={8} md={8} lg={8} className="h-16 control-panel">
                    <Button variant="outlined" sx={{ borderRadius: 20 }} onClick={handleMic}>
                        {mic ? (
                            <TiMicrophone size={30} color="#b1e1fc" />
                        ) : (
                            <BsFillMicMuteFill size={30} color="#a3a3a3" />
                        )}
                    </Button>
                    <Button variant="outlined" sx={{ borderRadius: 20 }} onClick={handleCamera}>
                        {camera ? (
                            <FaCamera size={30} color="#b1e1fc" />
                        ) : (
                            <RiCameraOffFill size={30} color="gray" />
                        )}
                    </Button>
                    <Button variant="outlined" sx={{ borderRadius: 20 }} onClick={handleEnd}>
                        {' '}
                        <MdCallEnd size={35} color="red" />
                    </Button>
                    <QR url={window.location.href} />
                </Grid>
            </Grid>
            <Grid item xs={2} md={2} lg={2}></Grid>
        </Grid>
    );
};
export default withAuth(JoinCall);
