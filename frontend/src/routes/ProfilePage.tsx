import React from 'react';
import { useParams } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      hi
    </div>
  );
};

export default ProfilePage;
