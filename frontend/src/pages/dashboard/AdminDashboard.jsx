import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Store, Plus } from 'lucide-react';

const AdminDashboard = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', district: '', area: '', address: '' });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops');
      setShops(res.data.shops);
    } catch (err) {
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shops', formData);
      toast.success('Shop created');
      setShowForm(false);
      setFormData({ name: '', district: '', area: '', address: '' });
      fetchShops();
    } catch (err) {
      toast.error('Failed to create shop');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading shops...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Store className="text-blue-600" /> Manage Shops</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Add Shop
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200 grid grid-cols-2 gap-4">
          <input required type="text" placeholder="Shop Name" className="border p-2 rounded" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input required type="text" placeholder="District" className="border p-2 rounded" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} />
          <input required type="text" placeholder="Area" className="border p-2 rounded" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} />
          <input type="text" placeholder="Address" className="border p-2 rounded" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          <button type="submit" className="col-span-2 bg-green-600 text-white p-2 rounded hover:bg-green-700">Save Shop</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map(shop => (
          <div key={shop.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-bold text-lg mb-2">{shop.name}</h4>
            <p className="text-sm text-gray-600 mb-1">ID: {shop.id}</p>
            <p className="text-sm text-gray-600 mb-1">Location: {shop.area}, {shop.district}</p>
            <p className="text-sm text-gray-600 mb-1">Hours: {shop.working_hours_start} - {shop.working_hours_end}</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${shop.camera_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Camera: {shop.camera_status ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
