import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Call from './pages/Call';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { useSelector } from 'react-redux';
import Loading from './pages/Loading';
import Preview from "./components/JoinCall/NotInCall"
import { useParams } from 'react-router-dom';

const RedirectToPreview = () => {
    const { id } = useParams();
    return <Navigate to={`/preview/${id}`} replace />;
};

const App = () => {
    const { isLoading } = useSelector((state) => state.hackathon);

    if (isLoading) return <Loading />;

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/preview/:id" element={<Preview />} />
                <Route path="/call/:id" element={<Call />} />
                <Route path="/:id" element={<RedirectToPreview />} />
            </Routes>
        </BrowserRouter>
    );
};
export default App;
