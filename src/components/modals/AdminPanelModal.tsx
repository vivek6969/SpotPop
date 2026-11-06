import React, { useState, useEffect } from 'react';
import { Spot, ModerationReport, Order, User, ProductTier, SpotShape } from '../../types';
import { api } from '../../services/api';
import { SpotPopLogo } from '../brand/SpotPopLogo';

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

  const [activeTab, setActiveTab] = useState<'metrics' | 'spots' | 'reports' | 'orders' | 'storage'>('spots');
  const [metrics, setMetrics] = useState<any>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [searchSpot, setSearchSpot] = useState('');
  const [loading, setLoading] = useState(true);

  // Multi-select state for spots
  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<string>>(new Set());

  // Add Spot drawer state
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [newSpotTier, setNewSpotTier] = useState<ProductTier>('big_pop');
  const [newSpotCreator, setNewSpotCreator] = useState('SpotPop Admin');
  const [newSpotHeadline, setNewSpotHeadline] = useState('');
  const [newSpotText, setNewSpotText] = useState('');
  const [newSpotShape, setNewSpotShape] = useState<SpotShape>('polaroid');
  const [newSpotBg, setNewSpotBg] = useState('#FFFFFF');
  const [newSpotImageUrl, setNewSpotImageUrl] = useState(
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
  );
  const [isSubmittingSpot, setIsSubmittingSpot] = useState(false);

  // Load admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [m, s, r, o, st] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminSpots(),
        api.getAdminReports(),
        api.getAdminOrders(),
        api.getStorageStats().catch(() => null),
      ]);
      setMetrics(m);
      setSpots(s.spots || []);
      setReports(r.reports || []);
      setOrders(o.orders || []);
      setStorageStats(st);
      setSelectedSpotIds(new Set());
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

  // Single spot permanent removal
  const handleDeleteSingleSpot = async (spot: Spot) => {
    if (!window.confirm(`Permanently delete "${spot.content.headline || spot.creatorName}"?`)) {
      return;
    }
    try {
      await api.deleteAdminSpot(spot.id);
      await loadData();
      onRefreshSpots();
    } catch (e) {
      alert('Could not delete spot');
    }
  };

  // Multiple spots batch removal
  const handleDeleteSelectedSpots = async () => {
    const ids = Array.from(selectedSpotIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Permanently delete ${ids.length} selected spot(s) from the canvas?`)) {
      return;
    }
    try {
      await api.deleteAdminSpotsBatch(ids);
      setSelectedSpotIds(new Set());
      await loadData();
      onRefreshSpots();
    } catch (e) {
      alert('Could not delete selected spots');
    }
  };

  // Select all & remove all spots
  const handleDeleteAllSpots = async () => {
    if (spots.length === 0) return;
    if (
      !window.confirm(
        `⚠️ DANGER: Are you sure you want to delete ALL ${spots.length} spots from the entire canvas? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api.deleteAllAdminSpots();
      setSelectedSpotIds(new Set());
      await loadData();
      onRefreshSpots();
    } catch (e) {
      alert('Could not delete all spots');
    }
  };

  // Create new spot directly from admin
  const handleCreateAdminSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSpot(true);
    try {
      await api.createAdminSpot({
        tier: newSpotTier,
        creatorName: newSpotCreator || 'SpotPop Admin',
        shape: newSpotShape,
        background: newSpotBg,
        headline: newSpotHeadline || (newSpotTier === 'big_pop' ? 'Admin Spotlight' : 'Official Notice'),
        text: newSpotText,
        imageUrl: newSpotTier === 'big_pop' ? newSpotImageUrl : undefined,
      });
      setShowAddSpot(false);
      setNewSpotHeadline('');
      setNewSpotText('');
      await loadData();
      onRefreshSpots();
    } catch (e) {
      alert('Could not create spot');
    } finally {
      setIsSubmittingSpot(false);
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

  const filteredSpots = spots.filter((s) =>
    s.id.toLowerCase().includes(searchSpot.toLowerCase()) ||
    s.creatorName.toLowerCase().includes(searchSpot.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchSpot.toLowerCase()) ||
    (s.content.headline && s.content.headline.toLowerCase().includes(searchSpot.toLowerCase()))
  );

  // Toggle selection for a single spot
  const toggleSelectSpot = (id: string) => {
    setSelectedSpotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Select All
  const isAllFilteredSelected =
    filteredSpots.length > 0 && filteredSpots.every((s) => selectedSpotIds.has(s.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedSpotIds(new Set());
    } else {
      const allIds = new Set(filteredSpots.map((s) => s.id));
      setSelectedSpotIds(allIds);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2.5">
            <SpotPopLogo variant="icon" size={26} />
            <span className="px-2 py-0.5 rounded-md bg-yellow-400 text-black text-xs font-black uppercase tracking-wider">
              Admin Console
            </span>
            <h3 className="font-outfit font-bold text-lg text-white">SpotPop Operations & Moderation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('spots')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'spots'
                ? 'bg-gradient-to-r from-[#FF2E93] to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📌</span>
            <span>Spots Management ({spots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🚨</span>
            <span>Reports ({reports.filter((r) => r.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💳</span>
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💾</span>
            <span>Storage & Cost</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading operations data...</span>
            </div>
          ) : activeTab === 'spots' ? (
            // =================== SPOTS MANAGEMENT ===================
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={searchSpot}
                    onChange={(e) => setSearchSpot(e.target.value)}
                    placeholder="Search by creator, headline, slug, or spot ID..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#FF2E93] focus:outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddSpot((prev) => !prev)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{showAddSpot ? '✕ Cancel' : '+ Add Spot'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAllSpots}
                    disabled={spots.length === 0}
                    className="px-3 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 disabled:opacity-40 text-rose-200 hover:text-white text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
                    title="Clear/Delete all spots from the canvas"
                  >
                    <span>🗑️</span>
                    <span>Delete All</span>
                  </button>
                </div>
              </div>

              {/* ADD SPOT INLINE CREATOR FORM */}
              {showAddSpot && (
                <form
                  onSubmit={handleCreateAdminSpot}
                  className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-3.5 shadow-xl animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Create New Spot Directly on Canvas (Admin)</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Instant Placement</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Product Tier</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpotTier('big_pop');
                            setNewSpotShape('polaroid');
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            newSpotTier === 'big_pop'
                              ? 'border-[#FF2E93] bg-[#FF2E93]/20 text-white'
                              : 'border-white/10 bg-white/5 text-slate-400'
                          }`}
                        >
                          📸 Big Pop (170×210)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSpotTier('mini_pop');
                            setNewSpotShape('sticky');
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            newSpotTier === 'mini_pop'
                              ? 'border-amber-400 bg-amber-400/20 text-white'
                              : 'border-white/10 bg-white/5 text-slate-400'
                          }`}
                        >
                          📝 Mini Pop (180×180)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Creator Name</label>
                      <input
                        type="text"
                        value={newSpotCreator}
                        onChange={(e) => setNewSpotCreator(e.target.value)}
                        placeholder="e.g. SpotPop Admin"
                        required
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Headline Text</label>
                      <input
                        type="text"
                        value={newSpotHeadline}
                        onChange={(e) => setNewSpotHeadline(e.target.value)}
                        placeholder="e.g. Official Admin Notice ♡"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Subtext / Message</label>
                      <input
                        type="text"
                        value={newSpotText}
                        onChange={(e) => setNewSpotText(e.target.value)}
                        placeholder="e.g. Welcome to the infinite living wall!"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                      />
                    </div>

                    {newSpotTier === 'big_pop' && (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Photo URL</label>
                        <input
                          type="text"
                          value={newSpotImageUrl}
                          onChange={(e) => setNewSpotImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddSpot(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSpot}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md"
                    >
                      {isSubmittingSpot ? 'Placing Spot...' : 'Place Spot on Canvas'}
                    </button>
                  </div>
                </form>
              )}

              {/* BATCH ACTION & MULTI-SELECT BAR */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white font-bold">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-md accent-[#FF2E93] cursor-pointer"
                    />
                    <span>Select All ({filteredSpots.length})</span>
                  </label>

                  {selectedSpotIds.size > 0 && (
                    <span className="text-xs text-pink-400 font-mono font-bold">
                      {selectedSpotIds.size} selected
                    </span>
                  )}
                </div>

                {selectedSpotIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteSelectedSpots}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>✕ Delete Selected ({selectedSpotIds.size})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSpotIds(new Set())}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                )}
              </div>

              {/* Spots List */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto no-scrollbar">
                {filteredSpots.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No spots found matching your search.
                  </div>
                ) : (
                  filteredSpots.map((spot) => {
                    const isChecked = selectedSpotIds.has(spot.id);
                    return (
                      <div
                        key={spot.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'bg-[#FF2E93]/15 border-[#FF2E93]/50 ring-1 ring-[#FF2E93]/40'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Checkbox & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectSpot(spot.id)}
                            className="w-4 h-4 rounded-md accent-[#FF2E93] cursor-pointer shrink-0"
                          />

                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs shadow-inner overflow-hidden"
                            style={{ backgroundColor: spot.background || '#FFF' }}
                          >
                            {spot.content.imageUrl ? (
                              <img
                                src={spot.content.imageUrl}
                                alt="Thumb"
                                className="w-full h-full object-cover"
                              />
                            ) : spot.tier === 'big_pop' ? (
                              '📸'
                            ) : (
                              '📝'
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">
                              {spot.content.headline || spot.creatorName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {spot.creatorName} · {spot.tier === 'big_pop' ? 'Big Pop (190×240)' : 'Mini Pop (180×180)'} · Status:{' '}
                              <span className={spot.status === 'published' ? 'text-emerald-400' : 'text-rose-400'}>
                                {spot.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSpot(spot);
                              onClose();
                            }}
                            className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Locate
                          </button>

                          {spot.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => handleModerateSpot(spot.id, 'hidden')}
                              className="py-1 px-2.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleModerateSpot(spot.id, 'published')}
                              className="py-1 px-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Restore
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteSingleSpot(spot)}
                            className="py-1 px-2.5 rounded-lg bg-rose-600/40 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                            title="Delete this spot permanently"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === 'metrics' ? (
            // =================== METRICS VIEW ===================
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Canvas Spots</div>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    {(metrics?.stats?.totalSpots || spots.length).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">
                    {(metrics?.stats?.activeSpots || spots.filter((s) => s.status === 'published').length)} active on wall
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Gross Revenue</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    ₹{((metrics?.stats?.totalRevenuePaise || 0) / 100).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Direct placements</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Mini Pop (₹29)</div>
                  <div className="text-2xl font-extrabold text-amber-300 mt-1">
                    {(metrics?.stats?.miniPopCount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Sticky notes (180×180)</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Big Pop (₹99)</div>
                  <div className="text-2xl font-extrabold text-[#FF2E93] mt-1">
                    {(metrics?.stats?.bigPopCount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Polaroid cards (190×240)</div>
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
          ) : activeTab === 'reports' ? (
            // =================== MODERATION REPORTS ===================
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  🎉 No reported spots! Canvas is clean.
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {report.reason}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Spot: {report.spotId}</span>
                      </div>
                      {report.details && (
                        <p className="text-xs text-slate-200 mt-1.5 italic">"{report.details}"</p>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1">
                        Status: {report.status} · Reported:{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveReport(report.id, 'hide_spot')}
                          className="py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                        >
                          Takedown Spot
                        </button>
                        <button
                          onClick={() => handleResolveReport(report.id, 'dismiss')}
                          className="py-1 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'storage' ? (
            // =================== STORAGE & COST INTELLIGENCE ===================
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Storage</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {storageStats ? `${(storageStats.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {storageStats?.uniqueAssets || 0} unique assets
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Duplicate Saved</span>
                  <span className="text-xl font-bold font-mono text-pink-400 mt-1 block">
                    {storageStats ? `${(storageStats.duplicateBytesSaved / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {storageStats?.duplicateAvoidedCount || 0} duplicates avoided
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Avg WebP Preview</span>
                  <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                    {storageStats ? `${(storageStats.avgImageSizeBytes / 1024).toFixed(1)} KB` : '0 KB'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">target: 20-60 KB</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Est. Monthly Cost</span>
                  <span className="text-xl font-bold font-mono text-yellow-400 mt-1 block">
                    ${storageStats?.estimatedMonthlyCostUSD?.toFixed(3) || '0.000'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Cloudflare R2 ($0 egress)</span>
                </div>
              </div>

              {/* Variant Storage Breakdown */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>📦</span> Multi-Resolution Variant Storage Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 font-bold mb-1">🔍 Thumbnails (100×130)</div>
                    <div className="text-white font-mono font-bold text-sm">
                      {storageStats ? `${(storageStats.thumbStorageBytes / 1024).toFixed(1)} KB` : '0 KB'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Zoomed-out canvas overview</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 font-bold mb-1">🖼️ Canvas Previews (340×420)</div>
                    <div className="text-white font-mono font-bold text-sm">
                      {storageStats ? `${(storageStats.previewStorageBytes / 1024).toFixed(1)} KB` : '0 KB'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Standard card view (2x retina)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-slate-400 font-bold mb-1">✨ High-Res Previews (800×1000)</div>
                    <div className="text-white font-mono font-bold text-sm">
                      {storageStats ? `${(storageStats.highResStorageBytes / 1024).toFixed(1)} KB` : '0 KB'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Detail modal & share kit</div>
                  </div>
                </div>
              </div>

              {/* Cost & Architecture Information */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <span>🛡️</span> Zero-Egress Storage & Database Protection Active
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Zero Base64 in Database:</strong> Images are stored as content-addressed files. Database records only store lightweight URL pointers and dimensions.<br />
                  • <strong>Automatic Content Hashing:</strong> Uploads are hashed with SHA-256. Duplicate images are automatically detected and reused, saving storage and bandwidth.<br />
                  • <strong>WebP Compression & Metadata Stripping:</strong> Automatic EXIF stripping and adaptive quality compression keep preview sizes between 20–55 KB.<br />
                  • <strong>Scale Target:</strong> Supports up to 1,000,000 spots for under $5.00/month on Cloudflare R2 storage.
                </p>
              </div>
            </div>
          ) : (
            // =================== ORDERS LOG ===================
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">No orders recorded yet.</div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white font-mono">{order.id}</div>
                      <div className="text-[10px] text-slate-400">
                        {order.spotDraft?.creatorName || 'Anonymous'} · {order.productId} ·{' '}
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400 font-mono">
                        ₹{(order.amountINR || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {order.status}
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
