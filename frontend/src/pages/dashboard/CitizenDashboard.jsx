import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, MapPin, Store } from 'lucide-react';
import StockStatus from '../../components/StockStatus';

const CitizenDashboard = ({ profile }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.assigned_shop) {
      const fetchStock = async () => {
        try {
          const res = await api.get(`/stocks/${profile.assigned_shop}`);
          setStocks(res.data.stocks);
        } catch (err) {
          console.error('Failed to load stock');
        } finally {
          setLoading(false);
        }
      };
      fetchStock();
    } else {
      setLoading(false);
    }
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  );
};

export default CitizenDashboard;
