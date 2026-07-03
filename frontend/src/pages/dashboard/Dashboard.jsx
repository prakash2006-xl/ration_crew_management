import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

import CitizenDashboard from './CitizenDashboard';
import StaffDashboard from './StaffDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setProfile(response.data.user);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading your workspace...</div>;
  }

  // Determine which dashboard to show based on role
  const renderDashboardContent = () => {
    if (!profile) return null;
    
    switch (profile.role) {
      case 'state_admin':
      case 'district_admin':
        return <AdminDashboard profile={profile} />;
      case 'staff':
        return <StaffDashboard profile={profile} />;
      case 'citizen':
      default:
        return <CitizenDashboard profile={profile} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-2xl font-bold">Welcome, {profile?.full_name}</h2>
            <p className="text-blue-100 text-sm uppercase tracking-wide font-semibold mt-1">Role: {profile?.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition shadow-sm"
          >
            Logout
          </button>
        </div>
        
        <div className="p-6">
          {renderDashboardContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
