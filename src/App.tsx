import React, { useState, useEffect, useCallback } from 'react';
import { Spot, CanvasStats, ProductTier, User } from './types';
import { api } from './services/api';
import { SpotCanvas } from './components/canvas/SpotCanvas';
import { Header } from './components/header/Header';
import { BottomDock } from './components/dock/BottomDock';
import { CreateSpotModal } from './components/modals/CreateSpotModal';
import { SpotDetailModal } from './components/modals/SpotDetailModal';
import { ViralShareKitModal } from './components/modals/ViralShareKitModal';
import { SearchDrawer } from './components/modals/SearchDrawer';
import { ActivityDrawer } from './components/modals/ActivityDrawer';
import { UserAccountModal } from './components/modals/UserAccountModal';
import { AdminPanelModal } from './components/modals/AdminPanelModal';
import { PolicyModal } from './components/modals/PolicyModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export function App() {
  // Main Data States
  const [spots, setSpots] = useState<Spot[]>([]);
  const [stats, setStats] = useState<CanvasStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Canvas Camera and Target
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [targetFocus, setTargetFocus] = useState<{ x: number; y: number; zoom?: number; timestamp: number } | null>(null);

  // Selected tier for bottom dock
  const [selectedTier, setSelectedTier] = useState<ProductTier>('big_pop');

  // Modal Visibility States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTier, setCreateModalTier] = useState<ProductTier>('big_pop');
  const [shareKitSpot, setShareKitSpot] = useState<Spot | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: 'terms' | 'privacy' | 'refund' | 'content' }>({
    isOpen: false,
    tab: 'terms',
  });

  // Fetch Spots and Stats on Mount
  const loadCanvasData = useCallback(async () => {
    try {
      const data = await api.getSpots();
      setSpots(data.spots || []);
      setStats(data.stats || null);

      // Check deep link via URL query param: ?spot=slug
      const urlParams = new URLSearchParams(window.location.search);
      const spotParam = urlParams.get('spot');
      if (spotParam && data.spots) {
        const found = data.spots.find(s => s.id === spotParam || s.slug === spotParam);
        if (found) {
          setSelectedSpot(found);
          setTargetFocus({ x: found.x, y: found.y, zoom: 1.25, timestamp: Date.now() });
        }
      }
    } catch (e) {
      console.error('Failed to load spots', e);
    }
  }, []);

  useEffect(() => {
    loadCanvasData();

    // Check saved session in localStorage
    const savedToken = localStorage.getItem('spotpop_token');
    if (savedToken) {
      setAuthToken(savedToken);
      api.getMe(savedToken)
        .then(res => setCurrentUser(res.user))
        .catch(() => localStorage.removeItem('spotpop_token'));
    }
  }, [loadCanvasData]);

  // Auth Callbacks
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('spotpop_token', token);
    setIsAccountOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('spotpop_token');
    setIsAccountOpen(false);
  };

  // Flying Camera Helper
  const flyToSpot = (spot: Spot) => {
    setSelectedSpot(spot);
    setTargetFocus({
      x: spot.x,
      y: spot.y,
      zoom: 1.25,
      timestamp: Date.now(),
    });
  };

  // Open Creation flow
  const handleStartCreate = (tier?: ProductTier) => {
    const chosen = tier || selectedTier;
    setCreateModalTier(chosen);
    setIsCreateModalOpen(true);
  };

  // When spot is created and verified by backend
  const handleSpotCreated = (newSpot: Spot) => {
    setSpots(prev => [newSpot, ...prev]);
    loadCanvasData();

    // Fly smoothly directly to the newly claimed coordinate!
    flyToSpot(newSpot);

    // Open Viral Share Kit immediately for maximum viral spread
    setTimeout(() => {
      setShareKitSpot(newSpot);
    }, 850);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090A0F] text-slate-100 font-sans">
      {/* Offline Status Warning Indicator */}
      <OfflineIndicator />

      {/* Main Interactive Canvas */}
      <SpotCanvas
        spots={spots}
        selectedSpotId={selectedSpot?.id}
        onSelectSpot={(spot) => {
          setSelectedSpot(spot);
        }}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(prev => !prev)}
        targetFocus={targetFocus}
      />

      {/* Top Header Bar with Logo and Stats */}
      <Header
        stats={stats}
        currentUser={currentUser}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenActivity={() => setIsActivityOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Bottom Floating Action Dock */}
      <BottomDock
        onStartCreate={handleStartCreate}
        selectedTier={selectedTier}
        onChangeSelectedTier={setSelectedTier}
      />

      {/* Subtle Policy Links in Corner */}
      <div className="fixed bottom-1.5 left-4 z-20 hidden md:flex items-center gap-3 text-[10px] text-slate-500">
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
          className="hover:text-slate-300 transition-colors"
        >
          Terms
        </button>
        <span>·</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'privacy' })}
          className="hover:text-slate-300 transition-colors"
        >
          Privacy
        </button>
        <span>·</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'refund' })}
          className="hover:text-slate-300 transition-colors"
        >
          Refunds
        </button>
        <span>·</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'content' })}
          className="hover:text-slate-300 transition-colors"
        >
          Content Policy
        </button>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* Creation Modal */}
      <CreateSpotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialTier={createModalTier}
        onSuccess={handleSpotCreated}
      />

      {/* Spot Detail Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        onOpenShareKit={(spot) => {
          setSelectedSpot(null);
          setShareKitSpot(spot);
        }}
        onFlyToSpot={flyToSpot}
      />

      {/* Viral Share Kit Modal */}
      {shareKitSpot && (
        <ViralShareKitModal
          isOpen={!!shareKitSpot}
          onClose={() => setShareKitSpot(null)}
          spot={shareKitSpot}
        />
      )}

      {/* Search & Discovery Drawer */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSpot={(spot) => {
          flyToSpot(spot);
        }}
      />

      {/* Live Canvas Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        onSelectSpotById={(spotId) => {
          const spot = spots.find(s => s.id === spotId);
          if (spot) flyToSpot(spot);
        }}
      />

      {/* User Account / Login Drawer */}
      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        allSpots={spots}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onSelectSpot={flyToSpot}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshSpots={loadCanvasData}
        onSelectSpot={flyToSpot}
      />

      {/* Transparency Policies Modal */}
      <PolicyModal
        isOpen={policyModal.isOpen}
        initialTab={policyModal.tab}
        onClose={() => setPolicyModal({ isOpen: false, tab: 'terms' })}
      />
    </div>
  );
}

export default App;
