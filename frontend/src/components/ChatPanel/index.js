import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, TextField } from '@mui/material';
import { IoSend } from 'react-icons/io5';
import { IoMdClose } from 'react-icons/io';

const ChatPanel = ({ open, onClose, socket, user, messages, unreadCount, onResetUnread }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (open) onResetUnread();
    }, [open, onResetUnread]);

    const handleSend = () => {
        if (!input.trim() || !socket?.current) return;
        socket.current.emit('chat message', {
            sender: {
                uid: user?.uid,
                name: user?.displayName || 'Anonymous',
                photoURL: user?.photoURL,
            },
            message: input.trim(),
        });
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        const d = new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!open) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: '#1a1a2e',
                borderLeft: '1px solid #2a2a4a',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: '12px 16px',
                    borderBottom: '1px solid #2a2a4a',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                    💬 In-call messages
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
                    <IoMdClose size={20} />
                </IconButton>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#3a3a5a', borderRadius: '4px' },
                }}
            >
                {messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.5 }}>
                        <Typography variant="body2" color="#888">
                            Messages can only be seen by people in the call and are deleted when the call ends.
                        </Typography>
                    </Box>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender?.uid === user?.uid;
                    return (
                        <Box
                            key={msg.id}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                animation: 'fadeIn 0.3s ease-in',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '2px' }}>
                                {!isMe && (
                                    <img
                                        src={msg.sender?.photoURL || 'https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png'}
                                        alt=""
                                        style={{ width: 18, height: 18, borderRadius: '50%' }}
                                    />
                                )}
                                <Typography variant="caption" sx={{ color: isMe ? '#667eea' : '#aaa', fontWeight: 600 }}>
                                    {isMe ? 'You' : msg.sender?.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#555', fontSize: '10px' }}>
                                    {formatTime(msg.timestamp)}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    backgroundColor: isMe ? '#667eea' : '#2a2a4a',
                                    color: '#fff',
                                    p: '8px 14px',
                                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    maxWidth: '85%',
                                    wordBreak: 'break-word',
                                    fontSize: '14px',
                                    lineHeight: 1.4,
                                }}
                            >
                                {msg.message}
                            </Box>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    p: '10px 12px',
                    borderTop: '1px solid #2a2a4a',
                    backgroundColor: '#16162a',
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Send a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#2a2a4a',
                            borderRadius: '20px',
                            color: '#fff',
                            fontSize: '14px',
                            '& fieldset': { border: 'none' },
                        },
                        '& .MuiInputBase-input::placeholder': { color: '#666' },
                    }}
                />
                <IconButton
                    onClick={handleSend}
                    disabled={!input.trim()}
                    sx={{
                        backgroundColor: input.trim() ? '#667eea' : '#333',
                        color: '#fff',
                        width: 38,
                        height: 38,
                        '&:hover': { backgroundColor: '#5a6fd6' },
                        transition: 'all 0.2s',
                    }}
                >
                    <IoSend size={16} />
                </IconButton>
            </Box>
        </Box>
    );
};

export default ChatPanel;
