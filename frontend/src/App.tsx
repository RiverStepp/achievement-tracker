import React, { useEffect} from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProfilePage from '@/routes/ProfilePage';
import axios from 'axios';

const App: React.FC = () => {
  axios.get<string>('https://localhost:7111/WeatherForecast/ping')
  .then(({ data }) => console.log('ping:', data))
  .catch(console.error);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/u/kaio" replace />} />
      <Route path="/u/:handle" element={<ProfilePage />} />
    </Routes>
  );
};

export default App;
