import React, { useEffect} from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProfilePage from '@/routes/ProfilePage';
import { HomePage } from '@/routes/HomePage';
import axios from 'axios';
import { NavBar } from '@/components/NavBar';

const App: React.FC = () => {
  axios.get<string>('https://localhost:7111/WeatherForecast/ping')
  .then(({ data }) => console.log('ping:', data))
  .catch(console.error);
  return (
    <>
    <div className="grid grid-cols-1 grid-rows-3">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/u/:handle" element={<ProfilePage />} />
        </Routes>
      </main>
      <p>hello</p>
    </div>
    </>
  );
};

export default App;
