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
import { PopReelsModal } from './components/reels/PopReelsModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { SpotPopLogo } from './components/brand/SpotPopLogo';
import { useGlobalHorizontalScroll } from './hooks/useGlobalHorizontalScroll';

export function App() {
  // Enable PC mouse wheel horizontal scrolling globally across all overflow-x-auto containers
  useGlobalHorizontalScroll();

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
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [authNoticeMessage, setAuthNoticeMessage] = useState<string | null>(null);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; tab: 'terms' | 'privacy' | 'refund' | 'content' }>({
    isOpen: false,
    tab: 'terms',
  });
  const [isReelsOpen, setIsReelsOpen] = useState(false);

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

  // Real-time live synchronization (Server-Sent Events + smart background polling)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const connectLiveStream = () => {
      try {
        eventSource = new EventSource('/api/spots/live');

        eventSource.addEventListener('spot_created', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.spot) {
              setSpots(prev => {
                // If spot is already on the canvas, avoid duplicate
                if (prev.some(s => s.id === data.spot.id)) {
                  return prev.map(s => s.id === data.spot.id ? data.spot : s);
                }
                return [data.spot, ...prev];
              });
              if (data.stats) {
                setStats(data.stats);
              }
              // Flash new spot briefly on the canvas so user notices the live arrival
              setHighlightedSpotId(data.spot.id);
              setTimeout(() => {
                setHighlightedSpotId(prev => prev === data.spot.id ? null : prev);
              }, 4000);
            }
          } catch (err) {
            console.warn('[LiveSync] Error parsing spot_created event:', err);
          }
        });

        eventSource.addEventListener('spot_updated', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.spot) {
              setSpots(prev => prev.map(s => s.id === data.spot.id ? data.spot : s));
              setSelectedSpot(prev => prev?.id === data.spot.id ? data.spot : prev);
            }
          } catch (err) {
            console.warn('[LiveSync] Error parsing spot_updated event:', err);
          }
        });

        eventSource.addEventListener('spot_deleted', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.id) {
              setSpots(prev => prev.filter(s => s.id !== data.id));
              setSelectedSpot(prev => prev?.id === data.id ? null : prev);
              if (data.stats) {
                setStats(data.stats);
              }
            }
          } catch (err) {
            console.warn('[LiveSync] Error parsing spot_deleted event:', err);
          }
        });

        eventSource.onerror = () => {
          // EventSource automatically retries reconnection
        };
      } catch (err) {
        console.warn('[LiveSync] EventSource not available:', err);
      }
    };

    connectLiveStream();

    // Visibility-aware smart background refresh fallback (sync every 15s if visible)
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        loadCanvasData();
      }
    };

    pollInterval = setInterval(handleVisibilitySync, 15000);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
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
    setHighlightedSpotId(spot.id);
    setTargetFocus({
      x: spot.x,
      y: spot.y,
      zoom: 1.25,
      timestamp: Date.now(),
    });
    // Open details if logged in
    if (currentUser) {
      setSelectedSpot(spot);
    }
    setTimeout(() => {
      setHighlightedSpotId(prev => (prev === spot.id ? null : prev));
    }, 3500);
  };

  // Open Creation flow - requires user to be logged in
  const handleStartCreate = (tier?: ProductTier) => {
    if (!currentUser) {
      setAuthNoticeMessage('Sign in or create an account to claim your permanent spot on the wall!');
      setIsAccountOpen(true);
      return;
    }
    const chosen = tier || selectedTier;
    setEditingSpot(null);
    setCreateModalTier(chosen);
    setIsCreateModalOpen(true);
  };

  // Open Edit flow for an owned spot
  const handleEditSpot = (spot: Spot) => {
    if (!currentUser) {
      setAuthNoticeMessage('Sign in to edit your Pop.');
      setIsAccountOpen(true);
      return;
    }
    setSelectedSpot(null);
    setEditingSpot(spot);
    setCreateModalTier(spot.tier);
    setIsCreateModalOpen(true);
  };

  // Permanently delete a spot from canvas and backend
  const handleDeleteSpot = async (spot: Spot) => {
    if (!currentUser) return;
    await api.deleteSpot(spot.id, authToken || undefined);
    setSpots(prev => prev.filter(s => s.id !== spot.id));
    if (selectedSpot?.id === spot.id) {
      setSelectedSpot(null);
    }
    setCurrentUser(prev => prev ? {
      ...prev,
      ownedSpotIds: prev.ownedSpotIds?.filter(id => id !== spot.id) || [],
    } : null);
    loadCanvasData();
  };

  // When spot is created or updated by backend
  const handleSpotSaved = (savedSpot: Spot) => {
    if (editingSpot) {
      // Updated existing spot
      setSpots(prev => prev.map(s => s.id === savedSpot.id ? savedSpot : s));
      if (selectedSpot?.id === savedSpot.id) {
        setSelectedSpot(savedSpot);
      }
      setEditingSpot(null);
      flyToSpot(savedSpot);
    } else {
      // Newly created spot
      setSpots(prev => [savedSpot, ...prev]);
      if (currentUser) {
        setCurrentUser(prev => prev ? {
          ...prev,
          ownedSpotIds: [...(prev.ownedSpotIds || []), savedSpot.id],
        } : null);
      }
      loadCanvasData();

      // Fly smoothly directly to the newly claimed coordinate!
      flyToSpot(savedSpot);

      // Open Viral Share Kit immediately for maximum viral spread
      setTimeout(() => {
        setShareKitSpot(savedSpot);
      }, 850);
    }
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

      {/* Instagram-Style Bottom Navigation Dock */}
      <BottomDock
        activeTab={isReelsOpen ? 'reels' : isSearchOpen ? 'search' : isAccountOpen ? 'profile' : 'home'}
        onTabChange={(tab) => {
          if (tab === 'home') {
            setIsReelsOpen(false);
            setIsSearchOpen(false);
            setIsAccountOpen(false);
          }
        }}
        onStartCreate={handleStartCreate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenReels={() => setIsReelsOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onHomeClick={() => {
          setIsReelsOpen(false);
          setTargetFocus({ x: 0, y: 0, zoom: 0.9, timestamp: Date.now() });
        }}
        selectedTier={selectedTier}
        onChangeSelectedTier={setSelectedTier}
        currentUser={currentUser}
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

      {/* Creation / Edit Modal */}
      {isCreateModalOpen && (
        <CreateSpotModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingSpot(null);
          }}
          initialTier={createModalTier}
          onSuccess={handleSpotSaved}
          editSpot={editingSpot}
          authToken={authToken}
        />
      )}

      {/* Spot Detail Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        currentUser={currentUser}
        authToken={authToken}
        onClose={() => setSelectedSpot(null)}
        onOpenShareKit={(spot) => {
          setSelectedSpot(null);
          setShareKitSpot(spot);
        }}
        onFlyToSpot={flyToSpot}
        onOpenCreatorProfile={(username) => {
          setSelectedCreatorUsername(username);
        }}
        onEditSpot={handleEditSpot}
        onDeleteSpot={handleDeleteSpot}
        onFollowChange={(creatorName) => {
          setSpots(prev => prev.map(s => s.creatorName.toLowerCase() === creatorName.toLowerCase() ? { ...s, isLocked: false } : s));
          if (selectedSpot && selectedSpot.creatorName.toLowerCase() === creatorName.toLowerCase()) {
            setSelectedSpot(prev => prev ? { ...prev, isLocked: false } : null);
          }
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
        currentUser={currentUser}
        authToken={authToken}
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
        onClose={() => {
          setIsAccountOpen(false);
          setAuthNoticeMessage(null);
        }}
        currentUser={currentUser}
        allSpots={spots}
        noticeMessage={authNoticeMessage}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onSelectSpot={flyToSpot}
        onEditSpot={handleEditSpot}
        onDeleteSpot={handleDeleteSpot}
        onStartCreate={() => handleStartCreate()}
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

      {/* Instagram-Style Pop Reels Vertical Feed Modal */}
      <PopReelsModal
        isOpen={isReelsOpen}
        onClose={() => setIsReelsOpen(false)}
        spots={spots}
        onFlyToSpot={flyToSpot}
        onSelectSpot={(spot) => setSelectedSpot(spot)}
        onOpenShareKit={(spot) => setShareKitSpot(spot)}
        onOpenCreatorProfile={(username) => setSelectedCreatorUsername(username)}
        onStartCreate={() => handleStartCreate()}
      />
    </div>
  );
}

export default App;
