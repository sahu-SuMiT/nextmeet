import React from 'react';
import { Box, Typography } from '@mui/material';
import { io } from 'socket.io-client';
import SERVER from "../../config";

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
        <Box sx={styles.MeetCard}>
            <video
                playsInline
                autoPlay
                controls={false}
                ref={videoRef}
                className="object-cover rounded-lg"
                style={{
                    width: styles.MeetCard.width,
                    height: styles.MeetCard.height,
                    display: showAvatar ? 'none' : 'block',
                }}
            />
            {showAvatar && (
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
                            user?.user?.photoURL ||
                            'https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png'
                        }
                        alt={user?.name}
                    />
                </Box>
            )}
            <Typography variant="body1" className="absolute bottom-4 left-4">
                {user?.name}
            </Typography>
        </Box>
    );
};
export default MeetCard;
