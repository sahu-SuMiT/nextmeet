import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Loading from '../../pages/Loading';

const withAuth = (Component) => {
    const Auth = (props) => {
        const [user, loading] = useAuthState(auth);

        if (loading) return <Loading />;

        const guestName = localStorage.getItem('guestName');
        const token = user || guestName;

        if (token) {
            return <Component {...props} />;
        } else {
            return <Navigate to="/" />;
        }
    };

    return Auth;
};

export default withAuth;
