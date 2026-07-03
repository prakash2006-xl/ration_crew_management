import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Package, Save } from 'lucide-react';

const StaffDashboard = ({ profile }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-fill some standard items if empty
  const defaultItems = [
    { item_name: 'Rice', quantity: 0 },
    { item_name: 'Sugar', quantity: 0 },
    { item_name: 'Wheat', quantity: 0 },
    { item_name: 'Oil', quantity: 0 }
  ];

  useEffect(() => {
    if (profile?.assigned_shop) {
      fetchStock();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchStock = async () => {
    try {
      const res = await api.get(`/stocks/${profile.assigned_shop}`);
      if (res.data.stocks.length > 0) {
        setStocks(res.data.stocks);
      } else {
        setStocks(defaultItems);
      }
    } catch (err) {
      toast.error('Failed to load stock');
      setStocks(defaultItems);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!profile.assigned_shop) {
      toast.error("You are not assigned to a shop!");
      return;
    }
    
    try {
      const itemsToUpdate = stocks.map(s => ({ item_name: s.item_name, quantity: parseFloat(s.quantity) }));
      await api.post(`/stocks/${profile.assigned_shop}`, { items: itemsToUpdate });
      toast.success('Morning stock updated successfully!');
      fetchStock();
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  const handleChange = (index, value) => {
    const newStocks = [...stocks];
    newStocks[index].quantity = value;
    setStocks(newStocks);
  };

  if (loading) return <div className="p-8 text-center">Loading stock...</div>;

  if (!profile?.assigned_shop) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">You must be assigned to a shop by an admin to manage stock.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Package className="text-blue-600" /> Morning Stock Entry</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">Shop ID: {profile.assigned_shop}</span>
      </div>

      <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {stocks.map((stock, index) => (
            <div key={index} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">{stock.item_name} (kg/L)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                value={stock.quantity}
                onChange={(e) => handleChange(index, e.target.value)}
              />
              {stock.status && (
                <span className={`text-xs mt-1 ${stock.status === 'Available' ? 'text-green-600' : 'text-red-600'}`}>
                  Current status: {stock.status}
                </span>
              )}
            </div>
          ))}
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-semibold p-3 rounded flex items-center justify-center gap-2 hover:bg-blue-700">
          <Save size={18} /> Update Stock
        </button>
      </form>
    </div>
  );
};

export default StaffDashboard;
