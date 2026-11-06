import React, { useState, useEffect, useCallback } from 'react';
import { Spot, CanvasStats, ProductTier, User } from './types';
import { api } from './services/api';
import { SpotCanvas } from './components/canvas/SpotCanvas';
import { Header } from './components/header/Header';
import { ExploreBar } from './components/explore/ExploreBar';
import { BottomDock } from './components/dock/BottomDock';
import { CreateSpotModal } from './components/modals/CreateSpotModal';
import { SpotDetailModal } from './components/modals/SpotDetailModal';
import { ViralShareKitModal } from './components/modals/ViralShareKitModal';
import { SearchDrawer } from './components/modals/SearchDrawer';
import { ActivityDrawer } from './components/modals/ActivityDrawer';
import { CreatorProfileModal } from './components/modals/CreatorProfileModal';
import { UserAccountModal } from './components/modals/UserAccountModal';
import { AdminPanelModal } from './components/modals/AdminPanelModal';
import { PolicyModal } from './components/modals/PolicyModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { SpotPopLogo } from './components/brand/SpotPopLogo';

export function App() {
  // Main Data States
  const [spots, setSpots] = useState<Spot[]>([]);
  const [stats, setStats] = useState<CanvasStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Canvas Camera and Target
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [highlightedSpotId, setHighlightedSpotId] = useState<string | null>(null);
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
  const [selectedCreatorUsername, setSelectedCreatorUsername] = useState<string | null>(null);
  const [unreadActivityCount, setUnreadActivityCount] = useState<number>(0);
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

      // Check deep link via URL query param: ?spot=slug or ?creator=username or /@username
      const urlParams = new URLSearchParams(window.location.search);
      const spotParam = urlParams.get('spot');
      const creatorParam = urlParams.get('creator');

      if (creatorParam) {
        setSelectedCreatorUsername(creatorParam);
      } else {
        const pathMatch = window.location.pathname.match(/^\/@([a-zA-Z0-9_-]+)/);
        if (pathMatch) {
          setSelectedCreatorUsername(pathMatch[1]);
        }
      }

      if (spotParam && data.spots) {
        const found = data.spots.find(s => s.id === spotParam || s.slug === spotParam);
        if (found) {
          setSelectedSpot(found);
          setHighlightedSpotId(found.id);
          setTargetFocus({ x: found.x, y: found.y, zoom: 1.25, timestamp: Date.now() });
          setTimeout(() => setHighlightedSpotId(null), 3500);
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

  // Flying Camera Helper with dynamic pulsing neon highlight
  const flyToSpot = (spot: Spot) => {
    setSelectedSpot(spot);
    setHighlightedSpotId(spot.id);
    setTargetFocus({
      x: spot.x,
      y: spot.y,
      zoom: 1.25,
      timestamp: Date.now(),
    });
    setTimeout(() => {
      setHighlightedSpotId(prev => (prev === spot.id ? null : prev));
    }, 3500);
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
        highlightedSpotId={highlightedSpotId}
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
        unreadActivityCount={unreadActivityCount}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenActivity={() => setIsActivityOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Canvas Explore Filter Bar */}
      <ExploreBar onSelectSpot={flyToSpot} />

      {/* Bottom Floating Action Dock */}
      <BottomDock
        onStartCreate={handleStartCreate}
        selectedTier={selectedTier}
        onChangeSelectedTier={setSelectedTier}
      />

      {/* Footer Branding (Logo + Text) & Policy Links */}
      <div className="fixed bottom-2 left-4 z-20 hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-slate-400 shadow-lg select-none">
        <div
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.location.href = '/'}
          title="SpotPop Home"
        >
          <SpotPopLogo variant="icon" size={18} />
          <div className="flex items-center font-outfit text-xs font-black tracking-tight leading-none">
            <span className="text-white">Spot</span>
            <span className="text-[#FF1493]">Pop</span>
          </div>
        </div>
        <span className="text-white/20">|</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'terms' })}
          className="hover:text-slate-200 transition-colors"
        >
          Terms
        </button>
        <span>·</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'privacy' })}
          className="hover:text-slate-200 transition-colors"
        >
          Privacy
        </button>
        <span>·</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'refund' })}
          className="hover:text-slate-200 transition-colors"
        >
          Refunds
        </button>
        <span>·</span>
        <button
          onClick={() => setPolicyModal({ isOpen: true, tab: 'content' })}
          className="hover:text-slate-200 transition-colors"
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
        onOpenCreatorProfile={(username) => {
          setSelectedCreatorUsername(username);
        }}
      />

      {/* Viral Share Kit Modal */}
      {shareKitSpot && (
        <ViralShareKitModal
          isOpen={!!shareKitSpot}
          onClose={() => setShareKitSpot(null)}
          spot={shareKitSpot}
        />
      )}

      {/* Universal Search & Discovery Drawer */}
      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSpot={(spot) => {
          flyToSpot(spot);
        }}
        onSelectCreator={(username) => {
          setSelectedCreatorUsername(username);
        }}
      />

      {/* Live Canvas Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        onUpdateUnreadCount={setUnreadActivityCount}
        onSelectSpotById={(spotId) => {
          const spot = spots.find(s => s.id === spotId);
          if (spot) flyToSpot(spot);
        }}
      />

      {/* Creator Profile Modal */}
      {selectedCreatorUsername && (
        <CreatorProfileModal
          username={selectedCreatorUsername}
          currentUser={currentUser}
          authToken={authToken}
          onClose={() => setSelectedCreatorUsername(null)}
          onSelectSpot={flyToSpot}
          onProfileUpdated={(updated) => {
            setCurrentUser(prev => prev ? { ...prev, ...updated } : prev);
          }}
        />
      )}

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
