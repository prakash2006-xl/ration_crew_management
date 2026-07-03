import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, MapPin, Store, Users, Bell, MessageSquare, Smartphone, History, Eye, EyeOff, Shield } from 'lucide-react';
import StockStatus from '../../components/StockStatus';

const CitizenDashboard = ({ profile }) => {
  const [stocks, setStocks] = useState([]);
  const [crowdData, setCrowdData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [pref, setPref] = useState(profile?.notification_pref || 'both');
  const [loading, setLoading] = useState(true);

  // Live Feed States
  const [streamUrl, setStreamUrl] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [requestingFeed, setRequestingFeed] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const endpoints = [
        api.get(`/users/notifications`),
      ];
      if (profile?.assigned_shop) {
        endpoints.push(api.get(`/stocks/${profile.assigned_shop}`));
        endpoints.push(api.get(`/shops/${profile.assigned_shop}/crowd/live`));
      }
      
      const responses = await Promise.all(endpoints);
      
      setNotifications(responses[0].data.notifications);
      if (profile?.assigned_shop) {
        setStocks(responses[1].data.stocks);
        setCrowdData(responses[2].data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh crowd status every 10 seconds
    let interval;
    if (profile?.assigned_shop) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/shops/${profile.assigned_shop}/crowd/live`);
          setCrowdData(res.data);
        } catch (e) {
          console.error(e);
        }
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profile]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      setStreamUrl(null);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handlePrefChange = async (newPref) => {
    try {
      await api.put('/users/profile/notifications', { notification_pref: newPref });
      setPref(newPref);
      toast.success('Notification preferences updated!');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to update preferences');
    }
  };

  const handleRequestFeed = async () => {
    if (!profile.assigned_shop) {
      toast.error("No ration shop assigned to your profile.");
      return;
    }
    setRequestingFeed(true);
    try {
      const res = await api.post(`/feed/request/${profile.assigned_shop}`);
      setStreamUrl(res.data.stream_url);
      setTimeLeft(res.data.duration_seconds);
      toast.success("Stream session approved! Auto-disconnects in 60s.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start live stream");
    } finally {
      setRequestingFeed(false);
    }
  };

  const getCrowdLevelColor = (level, status) => {
    if (status && status.includes("Disabled")) return 'bg-gray-100 text-gray-500 border-gray-300';
    if (level === 'Low') return 'bg-green-100 text-green-800 border-green-300';
    if (level === 'Medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Crowd Monitoring & Live Feed */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Users className="text-blue-600" /> Live Shop Crowd Status
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Real-time queue length monitoring. Updated automatically. Respects citizen privacy.
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
          
          {/* Live stream trigger button */}
          <button
            onClick={handleRequestFeed}
            disabled={requestingFeed || timeLeft > 0 || (crowdData?.status && crowdData.status.includes("Disabled"))}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2 text-sm shadow-sm transition disabled:opacity-50"
          >
            <Eye size={16} /> {timeLeft > 0 ? `Streaming (${timeLeft}s)` : 'Request Live Feed'}
          </button>
        </div>
      </div>

      {/* Blurred stream screen when active */}
      {streamUrl && (
        <div className="bg-black rounded-lg overflow-hidden border-2 border-blue-500 shadow-xl relative aspect-video max-w-2xl mx-auto flex flex-col items-center justify-center">
          {/* Face Blurring Simulation Overlay */}
          <div className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-70" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600')" }}></div>
          
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center p-6 text-center z-10">
            <Shield className="text-green-400 mb-3 animate-pulse" size={48} />
            <h4 className="text-white text-lg font-bold uppercase tracking-wider">Privacy-Friendly Verification Stream</h4>
            <p className="text-gray-200 text-xs mt-1 max-w-sm">
              All faces, biometrics, and identity characteristics are masked in real time using automatic blur filters.
            </p>
            <div className="mt-4 bg-red-600 text-white font-mono px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
              LIVE FEED EXPIRES IN: {timeLeft}s
            </div>
          </div>
          <span className="absolute bottom-3 left-3 text-white text-[10px] bg-black bg-opacity-65 px-2 py-1 rounded font-mono z-10 uppercase tracking-widest">
            Camera: Shop {profile.assigned_shop} Feed
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-800">Profile Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Notifications Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 border-b pb-2">
              <Bell className="text-blue-600" size={18} /> Notification Preferences
            </h3>
            
            <div className="space-y-3">
              {[
                { id: 'both', label: 'SMS & Push Notifications', icon: Bell },
                { id: 'sms', label: 'SMS Alerts Only (Feature Phone)', icon: MessageSquare },
                { id: 'push', label: 'App Push Only (Smartphone)', icon: Smartphone },
                { id: 'none', label: 'Disable Notifications', icon: Smartphone }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = pref === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePrefChange(opt.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 border-b pb-2">
              <History className="text-blue-600" size={18} /> Recent Alerts
            </h3>
            
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No alerts received yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-xs text-gray-700">{notif.title}</h4>
                      <span className="text-[10px] text-gray-400">
                        {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{notif.message}</p>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-blue-500 mt-2 block">
                      Sent via {notif.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
