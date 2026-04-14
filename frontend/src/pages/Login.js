import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { continueWithGoogle, signIn } from '../features/hackathon/hackathonSlice';
import { useDispatch } from 'react-redux';
import withoutAuth from '../utils/withoutAuth';
import { useState } from 'react';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleOnClickGoogle = async () => { await dispatch(continueWithGoogle()); };
    const handleOnClickLogin = async () => { await dispatch(signIn({ email, password })); };

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
                maxWidth: 420,
                border: '1px solid #1e1e3a',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
                <div style={{
                    fontSize: 28,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 4,
                }}>
                    NextMeet
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 16 }}>
                    Welcome back
                </div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 6, marginBottom: 32, lineHeight: 1.5 }}>
                    Sign in to stay connected with your world. <br />
                    <span style={{ color: '#667eea' }}>Every great conversation starts here.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%', backgroundColor: '#0a0a1a', border: '1px solid #2a2a4a',
                            borderRadius: 12, padding: '14px 18px', color: '#fff', fontSize: 14,
                            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#2a2a4a'}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleOnClickLogin(); }}
                        style={{
                            width: '100%', backgroundColor: '#0a0a1a', border: '1px solid #2a2a4a',
                            borderRadius: 12, padding: '14px 18px', color: '#fff', fontSize: 14,
                            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#2a2a4a'}
                    />
                </div>

                <button
                    onClick={handleOnClickLogin}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff', border: 'none', padding: '14px', borderRadius: 12,
                        fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; }}
                >
                    Sign In
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e3a' }} />
                    <span style={{ color: '#444', fontSize: 12 }}>or</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e3a' }} />
                </div>

                <button
                    onClick={handleOnClickGoogle}
                    style={{
                        width: '100%',
                        backgroundColor: '#1a1a35',
                        border: '1px solid #2a2a4a',
                        color: '#ccc', padding: '12px', borderRadius: 12,
                        fontSize: 14, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#252545'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a35'}
                >
                    <FcGoogle size={20} /> Continue with Google
                </button>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <span style={{ color: '#555', fontSize: 13 }}>Don't have an account? </span>
                    <button
                        onClick={() => navigate('/register')}
                        style={{
                            backgroundColor: 'transparent', border: 'none',
                            color: '#667eea', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        }}
                    >
                        Register
                    </button>
                </div>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'block', margin: '16px auto 0', backgroundColor: 'transparent',
                        border: 'none', color: '#444', cursor: 'pointer', fontSize: 12,
                    }}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
};
export default withoutAuth(Login);
