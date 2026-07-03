import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Store, Plus, History, BarChart2, ShieldAlert, Thermometer } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('shops');
  
  // Shops tab states
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', district: '', area: '', address: '' });

  // Analytics & Logs states
  const [selectedShopId, setSelectedShopId] = useState(1);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'logs') {
      fetchAnalytics(selectedShopId);
    }
  }, [activeTab, selectedShopId]);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops/');
      setShops(res.data.shops);
      if (res.data.shops.length > 0) {
        setSelectedShopId(res.data.shops[0].id);
      }
    } catch (err) {
      toast.error('Failed to load shops');
    } finally {
      setLoadingShops(false);
    }
  };

  const fetchAnalytics = async (shopId) => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get(`/analytics/overview/${shopId}`);
      setAnalyticsData(res.data);
    } catch (err) {
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shops/', formData);
      toast.success('Shop created successfully');
      setShowForm(false);
      setFormData({ name: '', district: '', area: '', address: '' });
      fetchShops();
    } catch (err) {
      toast.error('Failed to create shop');
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('shops')}
          className={`py-3 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'shops'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Store size={16} /> Manage Shops
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart2 size={16} /> Insights & Analytics
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-6 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} /> Audit & System Logs
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'shops' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">Active Ration Shops</h3>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-sm transition"
            >
              <Plus size={18} /> Add Shop
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-inner">
              <input required type="text" placeholder="Shop Name" className="border border-gray-300 p-2 rounded bg-white" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input required type="text" placeholder="District" className="border border-gray-300 p-2 rounded bg-white" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} />
              <input required type="text" placeholder="Area" className="border border-gray-300 p-2 rounded bg-white" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} />
              <input type="text" placeholder="Address" className="border border-gray-300 p-2 rounded bg-white" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              <button type="submit" className="md:col-span-2 bg-green-600 text-white p-3 rounded font-semibold hover:bg-green-700 shadow-sm">Save Shop</button>
            </form>
          )}

          {loadingShops ? (
            <div className="p-8 text-center text-gray-500">Loading shops...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map(shop => (
                <div key={shop.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
                  <h4 className="font-bold text-lg text-gray-800 mb-2">{shop.name}</h4>
                  <p className="text-sm text-gray-500 mb-1">Shop ID: {shop.id}</p>
                  <p className="text-sm text-gray-600 mb-1">Area: {shop.area}, {shop.district}</p>
                  <p className="text-sm text-gray-600 mb-3">Address: {shop.address || 'N/A'}</p>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${shop.camera_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      Camera: {shop.camera_status ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{shop.working_hours_start} - {shop.working_hours_end}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-sm text-gray-700">Filter by Shop:</label>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(parseInt(e.target.value))}
              className="border border-gray-300 p-2 rounded bg-white text-sm"
            >
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {loadingAnalytics ? (
            <div className="p-8 text-center text-gray-500">Loading analytics...</div>
          ) : analyticsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Peak Hours card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                  <Thermometer className="text-blue-500" /> Peak Hour Crowd Distribution
                </h4>
                {analyticsData.peak_hours.length === 0 ? (
                  <p className="text-center py-12 text-sm text-gray-400">No crowd records logged yet for this shop.</p>
                ) : (
                  <div className="space-y-2">
                    {analyticsData.peak_hours.map(ph => (
                      <div key={ph.hour} className="flex justify-between items-center text-sm">
                        <span className="font-mono">{ph.hour}:00 Hours</span>
                        <div className="w-1/2 bg-gray-100 h-4 rounded overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded"
                            style={{ width: `${Math.min(ph.avg_people * 4, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{ph.avg_people} People</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock status consumption card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                  <BarChart2 className="text-green-500" /> Stock Level Analytics
                </h4>
                {analyticsData.stock_consumption.length === 0 ? (
                  <p className="text-center py-12 text-sm text-gray-400">No stock levels configured yet.</p>
                ) : (
                  <div className="space-y-4">
                    {analyticsData.stock_consumption.map(stock => (
                      <div key={stock.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>{stock.item_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            stock.status === 'Available' ? 'bg-green-100 text-green-800' :
                            stock.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>{stock.status}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded overflow-hidden">
                          <div
                            className={`h-full rounded ${
                              stock.status === 'Available' ? 'bg-green-500' :
                              stock.status === 'Low Stock' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(stock.quantity / 5, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-right text-xs text-gray-400">{stock.quantity} Unit Balance</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> Security Audit & Event Logs
          </h4>

          {loadingAnalytics ? (
            <p className="text-center py-8 text-gray-500">Loading audit trail...</p>
          ) : analyticsData?.system_logs?.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No events logged in this session.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 font-semibold text-gray-600">
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Audit Details</th>
                    <th className="p-3">User ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analyticsData?.system_logs?.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs text-gray-400">{log.id}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-xs text-blue-600 uppercase">{log.action}</td>
                      <td className="p-3 text-gray-600 text-xs">{log.details}</td>
                      <td className="p-3 font-mono text-xs text-gray-500">{log.user_id || 'SYSTEM'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
