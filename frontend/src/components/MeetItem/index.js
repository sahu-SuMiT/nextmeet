import React from 'react';
import { Box, Typography } from '@mui/material';

const MeetCard = ({ user, peer }) => {
    const videoRef = React.useRef();
    const [showVideo, setShowVideo] = React.useState(false);

    React.useEffect(() => {
        const handleStream = (stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                setShowVideo(videoTrack.enabled && videoTrack.readyState === 'live');

                videoTrack.onmute = () => setShowVideo(false);
                videoTrack.onunmute = () => setShowVideo(true);
                videoTrack.onended = () => setShowVideo(false);
            }

            stream.onaddtrack = (event) => {
                if (event.track.kind === 'video') {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    setShowVideo(event.track.enabled && event.track.readyState === 'live');
                    event.track.onmute = () => setShowVideo(false);
                    event.track.onunmute = () => setShowVideo(true);
                    event.track.onended = () => setShowVideo(false);
                }
            };
        };

        if (peer._remoteStreams && peer._remoteStreams.length > 0) {
            handleStream(peer._remoteStreams[0]);
        }

        peer.on('stream', handleStream);

        peer.on('track', (track, stream) => {
            if (track.kind === 'video') {
                if (videoRef.current) videoRef.current.srcObject = stream;
                setShowVideo(track.enabled && track.readyState === 'live');
                track.onmute = () => setShowVideo(false);
                track.onunmute = () => setShowVideo(true);
                track.onended = () => setShowVideo(false);
            }
        });

        return () => {};
    }, [peer]);

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
                    display: showVideo ? 'block' : 'none',
                }}
            />
            {!showVideo && (
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
