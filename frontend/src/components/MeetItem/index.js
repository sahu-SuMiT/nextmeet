import React from 'react';
import { Box, Typography } from '@mui/material';
import { BsFillMicMuteFill } from 'react-icons/bs';

const MeetCard = ({ user, peer }) => {
    const videoRef = React.useRef();
    const [showVideo, setShowVideo] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(true);

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

            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                setIsMuted(!audioTrack.enabled || audioTrack.readyState !== 'live');
                audioTrack.onmute = () => setIsMuted(true);
                audioTrack.onunmute = () => setIsMuted(false);
                audioTrack.onended = () => setIsMuted(true);
            }

            stream.onaddtrack = (event) => {
                if (event.track.kind === 'video') {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    setShowVideo(event.track.enabled && event.track.readyState === 'live');
                    event.track.onmute = () => setShowVideo(false);
                    event.track.onunmute = () => setShowVideo(true);
                    event.track.onended = () => setShowVideo(false);
                }
                if (event.track.kind === 'audio') {
                    setIsMuted(!event.track.enabled || event.track.readyState !== 'live');
                    event.track.onmute = () => setIsMuted(true);
                    event.track.onunmute = () => setIsMuted(false);
                    event.track.onended = () => setIsMuted(true);
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
            if (track.kind === 'audio') {
                setIsMuted(!track.enabled || track.readyState !== 'live');
                track.onmute = () => setIsMuted(true);
                track.onunmute = () => setIsMuted(false);
                track.onended = () => setIsMuted(true);
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
            {isMuted && (
                <Box sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'rgba(239,68,68,0.8)',
                    borderRadius: '50%',
                    p: '4px',
                    display: 'flex',
                    zIndex: 2,
                }}>
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
                    {user?.name}
                </Typography>
            </Box>
        </>
    );
};
export default MeetCard;
