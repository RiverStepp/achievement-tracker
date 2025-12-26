import React, { useEffect} from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProfilePage from '@/routes/ProfilePage';
import { HomePage } from '@/routes/HomePage';
import axios from 'axios';
import { NavBar } from '@/components/NavBar';
import { SideBar } from '@/components/SideBar';

const App: React.FC = () => {
  axios.get<string>('https://localhost:7111/WeatherForecast/ping')
  .then(({ data }) => console.log('ping:', data))
  .catch(console.error);
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] grid-cols-[240px_1fr]">
      
      {/* Row 1 – Navbar (spans both columns) */}
      <header className="col-span-2">
        <NavBar />
      </header>

      {/* Row 2 – Left sidebar (always visible) */}
      <aside>
        <SideBar />
      </aside>

      {/* Row 2 – Routed content */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/u/:handle" element={<ProfilePage />} />
        </Routes>
      </main>

      {/* Row 3 – Footer (spans both columns) */}
      <footer className="col-span-2">
        footer
      </footer>

    </div>
  );
};

export default App;
