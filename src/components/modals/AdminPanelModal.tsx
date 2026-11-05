import React, { useState, useEffect } from 'react';
import { Spot, ModerationReport, Order, User } from '../../types';
import { api } from '../../services/api';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshSpots: () => void;
  onSelectSpot: (spot: Spot) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onRefreshSpots,
  onSelectSpot,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'metrics' | 'spots' | 'reports' | 'orders'>('metrics');
  const [metrics, setMetrics] = useState<any>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchSpot, setSearchSpot] = useState('');
  const [loading, setLoading] = useState(true);

  // Load admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [m, s, r, o] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminSpots(),
        api.getAdminReports(),
        api.getAdminOrders(),
      ]);
      setMetrics(m);
      setSpots(s.spots || []);
      setReports(r.reports || []);
      setOrders(o.orders || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModerateSpot = async (spotId: string, status: 'published' | 'hidden') => {
    try {
      await api.moderateSpot(spotId, { status });
      await loadData();
      onRefreshSpots();
    } catch (e) {
      alert('Could not update spot');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'hide_spot') => {
    try {
      await api.resolveReport(reportId, action);
      await loadData();
      onRefreshSpots();
    } catch (e) {
      alert('Could not resolve report');
    }
  };

  const filteredSpots = spots.filter(s =>
    s.id.toLowerCase().includes(searchSpot.toLowerCase()) ||
    s.creatorName.toLowerCase().includes(searchSpot.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchSpot.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-yellow-400 text-black text-xs font-black uppercase tracking-wider">
              Admin Console
            </span>
            <h3 className="font-outfit font-bold text-lg text-white">SpotPop Operations & Moderation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'metrics', label: '📊 KPI Metrics' },
            { id: 'spots', label: `🎨 Spots (${spots.length})` },
            { id: 'reports', label: `🚨 Reports (${reports.filter(r => r.status === 'pending').length})` },
            { id: 'orders', label: `💳 Orders (${orders.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <span className="w-6 h-6 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin inline-block mr-2 align-middle" />
              Loading database operations...
            </div>
          ) : activeTab === 'metrics' ? (
            // METRICS DASHBOARD
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Gross Revenue</div>
                  <div className="text-2xl font-extrabold text-[#FF2E93] mt-1">
                    ₹{(metrics?.stats?.totalRevenueINR || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">Real database purchases</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Total Claims</div>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {(metrics?.stats?.claimedCount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {metrics?.stats?.spotsLeft?.toLocaleString('en-IN')} spots left
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Mini Pop (₹29)</div>
                  <div className="text-2xl font-extrabold text-amber-300 mt-1">
                    {(metrics?.stats?.miniPopCount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Sticky & text notes</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Big Pop (₹99)</div>
                  <div className="text-2xl font-extrabold text-[#FF2E93] mt-1">
                    {(metrics?.stats?.bigPopCount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Photo & polaroids</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400">Registered Accounts</div>
                  <div className="text-xl font-bold text-white mt-1">{metrics?.totalUsers || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400">Pending Moderation</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">{metrics?.pendingReports || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400">Canvas Dimensions</div>
                  <div className="text-xl font-bold text-white mt-1">6,000 × 6,000 px</div>
                </div>
              </div>
            </div>
          ) : activeTab === 'spots' ? (
            // SPOTS MANAGEMENT
            <div className="space-y-4">
              <input
                type="text"
                value={searchSpot}
                onChange={(e) => setSearchSpot(e.target.value)}
                placeholder="Filter spots by creator, slug or ID..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-hidden"
              />

              <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                {filteredSpots.map((spot) => (
                  <div
                    key={spot.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{ backgroundColor: spot.background || '#FFF' }}
                      >
                        {spot.tier === 'big_pop' ? '📸' : '📝'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">
                          {spot.content.headline || spot.creatorName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {spot.creatorName} · {spot.tier} · Status: <span className={spot.status === 'published' ? 'text-emerald-400' : 'text-rose-400'}>{spot.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onSelectSpot(spot);
                          onClose();
                        }}
                        className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                      >
                        Locate
                      </button>
                      {spot.status === 'published' ? (
                        <button
                          onClick={() => handleModerateSpot(spot.id, 'hidden')}
                          className="py-1 px-2.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-xs font-semibold"
                        >
                          Hide
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModerateSpot(spot.id, 'published')}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-xs font-semibold"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            // MODERATION REPORTS
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No moderation reports logged. All clear! ✨
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        Reason: {rep.reason}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        rep.status === 'pending' ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <div className="text-xs text-white">
                      Spot ID: <span className="font-mono text-[#FF2E93]">{rep.spotId}</span>
                    </div>
                    {rep.details && (
                      <p className="text-xs text-slate-400 bg-black/30 p-2 rounded-lg">
                        &quot;{rep.details}&quot;
                      </p>
                    )}
                    {rep.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'hide_spot')}
                          className="py-1 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold"
                        >
                          Remove & Hide Spot
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'dismiss')}
                          className="py-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs"
                        >
                          Dismiss Report
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // ORDERS & TRANSACTIONS
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No orders recorded yet.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {ord.productId === 'big_pop' ? 'Big Pop (₹99)' : 'Mini Pop (₹29)'} · <span className="font-mono text-slate-400">{ord.id}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Creator: {ord.spotDraft?.creatorName || 'Anonymous'} · {new Date(ord.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-[#FF2E93]">₹{ord.amountINR}</div>
                      <div className={`text-[10px] font-bold ${ord.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {ord.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
