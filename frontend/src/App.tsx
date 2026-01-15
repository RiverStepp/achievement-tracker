import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProfilePage from '@/routes/ProfilePage';
import ScraperTestPage from '@/routes/ScraperTestPage';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/u/kaio" replace />} />
            <Route path="/u/:handle" element={<ProfilePage />} />
            <Route path="/test/scraper" element={<ScraperTestPage />} />
        </Routes>
    );
};

export default App;
