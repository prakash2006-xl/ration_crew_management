import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, MapPin, Store, Users, Eye } from 'lucide-react';
import StockStatus from '../../components/StockStatus';

const CitizenDashboard = ({ profile }) => {
  const [stocks, setStocks] = useState([]);
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.assigned_shop) {
      const fetchData = async () => {
        try {
          const [stockRes, crowdRes] = await Promise.all([
            api.get(`/stocks/${profile.assigned_shop}`),
            api.get(`/shops/${profile.assigned_shop}/crowd/live`)
          ]);
          setStocks(stockRes.data.stocks);
          setCrowdData(crowdRes.data);
        } catch (err) {
          console.error('Failed to load shop details', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
      
      // Auto-refresh crowd status every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [profile]);

  const getCrowdLevelColor = (level, status) => {
    if (status && status.includes("Disabled")) return 'bg-gray-100 text-gray-500 border-gray-300';
    if (level === 'Low') return 'bg-green-100 text-green-800 border-green-300';
    if (level === 'Medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Crowd Monitoring Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Users className="text-blue-600" /> Live Shop Crowd Status
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Real-time queue length monitoring. Updated automatically. Strictly respects citizen privacy.
          </p>
          
          {crowdData?.status && crowdData.status.includes("Disabled") ? (
            <p className="text-sm font-semibold text-red-500 mt-4 bg-red-50 p-2 rounded inline-block">
              {crowdData.status} (Active: 8 AM - 8 PM)
            </p>
          ) : (
            <div className="flex gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 rounded border">
                <span className="text-2xl font-extrabold text-gray-800 block">
                  {crowdData?.people_count ?? 0}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">People Inside</span>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded border">
                <span className="text-2xl font-extrabold text-gray-800 block">
                  {crowdData?.status === "Active" ? "Online" : "Offline"}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Camera Health</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center justify-center p-6 border-l md:border-t-0 border-t border-gray-200">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Crowd Density</span>
          <span className={`px-6 py-2 rounded-full border text-lg font-bold uppercase tracking-wider ${getCrowdLevelColor(crowdData?.crowd_level, crowdData?.status)}`}>
            {crowdData?.status && crowdData.status.includes("Disabled") ? "Offline" : crowdData?.crowd_level || "Unknown"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">Profile Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded shadow-sm text-gray-600"><User /></div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-800">{profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded shadow-sm text-gray-600"><User /></div>
              <div>
                <p className="text-sm text-gray-500">Phone / Ration Card</p>
                <p className="font-medium text-gray-800">{profile?.phone_number} / {profile?.ration_card || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded shadow-sm text-gray-600"><MapPin /></div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-800">{profile?.area}, {profile?.district}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded shadow-sm text-gray-600"><Store /></div>
              <div>
                <p className="text-sm text-gray-500">Assigned Shop ID</p>
                <p className="font-medium text-gray-800">{profile?.assigned_shop || 'Not Assigned Yet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Status */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">Current Stock Status</h3>
          
          {!profile?.assigned_shop ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              You are not assigned to a ration shop yet. Contact admin.
            </div>
          ) : loading ? (
            <div className="text-center py-6 text-gray-500">Checking stock...</div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              No stock information available for this shop right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stocks.map((stock, idx) => (
                <StockStatus key={idx} item_name={stock.item_name} status={stock.status} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
