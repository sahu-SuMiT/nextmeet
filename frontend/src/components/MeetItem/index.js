import React from 'react';
import { Box, Typography } from '@mui/material';
import { io } from 'socket.io-client';
import SERVER from "../../config";

const MeetCard = ({ user, peer }) => {
    const videoRef = React.useRef();
    const socketRef = React.useRef();
    const [isVideoOff, setIsVideoOff] = React.useState(true);
    const [hasStream, setHasStream] = React.useState(false);

    React.useEffect(() => {
        socketRef.current = io.connect(SERVER);
        socketRef.current.on('video permission', (payload) => {
            if (Boolean(payload) && user?.uid === payload?.user?.uid) {
                setIsVideoOff(!payload.video);
            }
        });

        peer.on('stream', (stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasStream(true);
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                setIsVideoOff(!videoTrack.enabled);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [peer, user?.uid]);

    const showAvatar = isVideoOff || !hasStream;

    return (
        <>
            <video
                playsInline
                autoPlay
                controls={false}
                ref={videoRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: showAvatar ? 'none' : 'block',
                }}
            />
            {showAvatar && (
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a4a 100%)',
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <img
                            src={
                                user?.photoURL ||
                                user?.user?.photoURL ||
                                'https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png'
                            }
                            alt={user?.name}
                            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #667eea' }}
                        />
                    </Box>
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
                    {user?.name}
                </Typography>
            </Box>
        </>
    );
};
export default MeetCard;
