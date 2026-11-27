import React, { useState, useEffect, useMemo } from 'react';
import { Spot, ModerationReport, Order, User, ProductTier, SpotShape, Comment } from '../../types';
import { api } from '../../services/api';
import { SpotPopLogo } from '../brand/SpotPopLogo';
import { ConfirmModal } from '../common/ConfirmModal';
import { DEFAULT_SPOT_FALLBACK_SVG } from './editor/constants';

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

  type AdminTab = 'metrics' | 'users' | 'spots' | 'orders' | 'comments' | 'reports' | 'storage';
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom warning / confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    warningBadge?: string;
    icon?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Core Data
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [comments, setComments] = useState<(Comment & { spotTitle?: string })[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [backups, setBackups] = useState<{ filename: string; sizeBytes: number; createdAt: string }[]>([]);

  // Selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedSpotIds, setSelectedSpotIds] = useState<Set<string>>(new Set());

  // Search & Filter & Sort - USERS
  const [searchUser, setSearchUser] = useState('');
  const [filterUserRole, setFilterUserRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterUserPrivacy, setFilterUserPrivacy] = useState<'all' | 'public' | 'private'>('all');
  const [sortUser, setSortUser] = useState<'newest' | 'oldest' | 'username_asc' | 'display_asc' | 'spots_desc'>('newest');

  // Search & Filter & Sort - SPOTS
  const [searchSpot, setSearchSpot] = useState('');
  const [filterSpotTier, setFilterSpotTier] = useState<'all' | 'mini_pop' | 'big_pop'>('all');
  const [filterSpotShape, setFilterSpotShape] = useState<'all' | SpotShape>('all');
  const [filterSpotStatus, setFilterSpotStatus] = useState<'all' | 'published' | 'hidden'>('all');
  const [filterSpotModeration, setFilterSpotModeration] = useState<'all' | 'approved' | 'pending' | 'flagged' | 'removed'>('all');
  const [filterSpotVisibility, setFilterSpotVisibility] = useState<'all' | 'public' | 'private' | 'friends_only'>('all');
  const [sortSpot, setSortSpot] = useState<'newest' | 'oldest' | 'likes' | 'views' | 'comments' | 'coord_x'>('newest');

  // Search & Filter & Sort - ORDERS
  const [searchOrder, setSearchOrder] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

  // Search & Filter - COMMENTS
  const [searchComment, setSearchComment] = useState('');

  // Search & Filter - REPORTS
  const [filterReportStatus, setFilterReportStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  // Drawers & Modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [showAddSpot, setShowAddSpot] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form inputs for Create User
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserBio, setNewUserBio] = useState('');
  const [newUserWebsite, setNewUserWebsite] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsPrivate, setNewUserIsPrivate] = useState(false);
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState('');

  // Form inputs for Create Spot
  const [newSpotTier, setNewSpotTier] = useState<ProductTier>('big_pop');
  const [newSpotCreator, setNewSpotCreator] = useState('SpotPop Admin');
  const [newSpotHeadline, setNewSpotHeadline] = useState('');
  const [newSpotText, setNewSpotText] = useState('');
  const [newSpotShape, setNewSpotShape] = useState<SpotShape>('polaroid');
  const [newSpotBg, setNewSpotBg] = useState('#FFFFFF');
  const [newSpotImageUrl, setNewSpotImageUrl] = useState(
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load all admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [m, u, s, o, c, r, st, b] = await Promise.all([
        api.getAdminMetrics().catch(() => null),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getAdminSpots().catch(() => ({ spots: [] })),
        api.getAdminOrders().catch(() => ({ orders: [] })),
        api.getAdminComments().catch(() => ({ comments: [] })),
        api.getAdminReports().catch(() => ({ reports: [] })),
        api.getStorageStats().catch(() => null),
        api.getAdminBackups().catch(() => ({ backups: [] })),
      ]);

      setMetrics(m);
      setUsers(u.users || []);
      setSpots(s.spots || []);
      setOrders(o.orders || []);
      setComments(c.comments || []);
      setReports(r.reports || []);
      setStorageStats(st);
      setBackups(b.backups || []);
      setSelectedUserIds(new Set());
      setSelectedSpotIds(new Set());
    } catch (e: any) {
      console.error('Failed to load admin data', e);
      showToast(`Error loading data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =================== FILTERED USERS ===================
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const query = searchUser.trim().toLowerCase();
        if (query) {
          const matchUsername = u.username.toLowerCase().includes(query);
          const matchEmail = u.email.toLowerCase().includes(query);
          const matchDisplay = (u.displayName || '').toLowerCase().includes(query);
          const matchId = u.id.toLowerCase().includes(query);
          if (!matchUsername && !matchEmail && !matchDisplay && !matchId) return false;
        }
        if (filterUserRole !== 'all' && u.role !== filterUserRole) return false;
        if (filterUserPrivacy !== 'all') {
          const isPriv = Boolean(u.isPrivate);
          if (filterUserPrivacy === 'private' && !isPriv) return false;
          if (filterUserPrivacy === 'public' && isPriv) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortUser === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (sortUser === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (sortUser === 'username_asc') return a.username.localeCompare(b.username);
        if (sortUser === 'display_asc') return (a.displayName || '').localeCompare(b.displayName || '');
        if (sortUser === 'spots_desc') return (b.ownedSpotIds?.length || 0) - (a.ownedSpotIds?.length || 0);
        return 0;
      });
  }, [users, searchUser, filterUserRole, filterUserPrivacy, sortUser]);

  // =================== FILTERED SPOTS ===================
  const filteredSpots = useMemo(() => {
    return spots
      .filter((s) => {
        const query = searchSpot.trim().toLowerCase();
        if (query) {
          const matchHeadline = (s.content.headline || '').toLowerCase().includes(query);
          const matchTitle = (s.title || '').toLowerCase().includes(query);
          const matchText = (s.content.text || '').toLowerCase().includes(query);
          const matchCreator = (s.creatorName || '').toLowerCase().includes(query);
          const matchId = s.id.toLowerCase().includes(query);
          const matchSlug = (s.slug || '').toLowerCase().includes(query);
          if (!matchHeadline && !matchTitle && !matchText && !matchCreator && !matchId && !matchSlug) return false;
        }
        if (filterSpotTier !== 'all' && s.tier !== filterSpotTier) return false;
        if (filterSpotShape !== 'all' && s.shape !== filterSpotShape) return false;
        if (filterSpotStatus !== 'all' && s.status !== filterSpotStatus) return false;
        if (filterSpotModeration !== 'all' && s.moderationStatus !== filterSpotModeration) return false;
        if (filterSpotVisibility !== 'all' && (s.visibility || 'public') !== filterSpotVisibility) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortSpot === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (sortSpot === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (sortSpot === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
        if (sortSpot === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
        if (sortSpot === 'comments') return (b.commentsCount || 0) - (a.commentsCount || 0);
        if (sortSpot === 'coord_x') return a.x - b.x;
        return 0;
      });
  }, [spots, searchSpot, filterSpotTier, filterSpotShape, filterSpotStatus, filterSpotModeration, filterSpotVisibility, sortSpot]);

  // =================== FILTERED ORDERS ===================
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const query = searchOrder.trim().toLowerCase();
        if (query) {
          const matchId = o.id.toLowerCase().includes(query);
          const matchUser = (o.userId || '').toLowerCase().includes(query);
          const matchPaymentId = (o.razorpayPaymentId || '').toLowerCase().includes(query);
          const matchCreator = (o.spotDraft?.creatorName || '').toLowerCase().includes(query);
          if (!matchId && !matchUser && !matchPaymentId && !matchCreator) return false;
        }
        if (filterOrderStatus !== 'all' && o.status !== filterOrderStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (sortOrder === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (sortOrder === 'amount_desc') return (b.amountINR || 0) - (a.amountINR || 0);
        if (sortOrder === 'amount_asc') return (a.amountINR || 0) - (b.amountINR || 0);
        return 0;
      });
  }, [orders, searchOrder, filterOrderStatus, sortOrder]);

  // =================== FILTERED COMMENTS ===================
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const query = searchComment.trim().toLowerCase();
      if (!query) return true;
      return (
        c.text.toLowerCase().includes(query) ||
        c.authorName.toLowerCase().includes(query) ||
        c.spotId.toLowerCase().includes(query) ||
        (c.spotTitle || '').toLowerCase().includes(query)
      );
    });
  }, [comments, searchComment]);

  // =================== FILTERED REPORTS ===================
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterReportStatus === 'all') return true;
      return r.status === filterReportStatus;
    });
  }, [reports, filterReportStatus]);

  // =================== USER ACTIONS ===================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserUsername) {
      showToast('Email and username are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createAdminUser({
        email: newUserEmail,
        username: newUserUsername,
        displayName: newUserDisplayName || newUserUsername,
        role: newUserRole,
        bio: newUserBio,
        websiteUrl: newUserWebsite,
        password: newUserPassword || undefined,
        isPrivate: newUserIsPrivate,
        avatarUrl: newUserAvatarUrl || undefined,
      });
      showToast(`User @${newUserUsername} created successfully!`);
      setShowCreateUser(false);
      setNewUserEmail('');
      setNewUserUsername('');
      setNewUserDisplayName('');
      setNewUserBio('');
      setNewUserWebsite('');
      setNewUserPassword('');
      await loadData();
    } catch (err: any) {
      showToast(`Error creating user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await api.updateAdminUser(editingUser.id, {
        email: editingUser.email,
        username: editingUser.username,
        displayName: editingUser.displayName,
        role: editingUser.role,
        bio: editingUser.bio,
        websiteUrl: editingUser.websiteUrl,
        isPrivate: editingUser.isPrivate,
        avatarUrl: editingUser.avatarUrl,
        password: editingUser.passwordHash ? editingUser.passwordHash : undefined,
      });
      showToast(`User @${editingUser.username} updated!`);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      showToast(`Error updating user: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === 'usr_admin') {
      showToast('⚠️ Cannot delete primary root administrator account.');
      return;
    }
    setConfirmDialog({
      title: 'Permanently Delete User?',
      message: `Permanently delete user @${user.username} (${user.email})?`,
      danger: true,
      icon: '👤',
      confirmText: 'Delete User & All Spots',
      warningBadge: 'CRITICAL: All spots, comments, and media owned by this user will be permanently deleted from the canvas.',
      onConfirm: async () => {
        try {
          await api.deleteAdminUser(user.id);
          showToast(`Deleted user @${user.username} and cascade-deleted their spots`);
          await loadData();
          onRefreshSpots();
        } catch (err: any) {
          showToast(`Could not delete user: ${err.message}`);
        }
      },
    });
  };

  const handleDeleteSelectedUsers = async () => {
    const ids = Array.from(selectedUserIds).filter((id) => id !== 'usr_admin');
    if (ids.length === 0) return;
    setConfirmDialog({
      title: `Delete ${ids.length} Selected Users?`,
      message: `Permanently delete ${ids.length} selected user account(s)?`,
      danger: true,
      icon: '👥',
      confirmText: `Delete ${ids.length} Users & Spots`,
      warningBadge: 'All spots, comments, and media owned by these users will be permanently erased.',
      onConfirm: async () => {
        try {
          const res = await api.deleteAdminUsersBatch(ids);
          showToast(`Deleted ${res.deletedCount} user(s) and cascade-deleted their spots`);
          setSelectedUserIds(new Set());
          await loadData();
          onRefreshSpots();
        } catch (err: any) {
          showToast(`Batch delete failed: ${err.message}`);
        }
      },
    });
  };

  // =================== SPOT ACTIONS ===================
  const handleModerateSpot = async (spotId: string, status: 'published' | 'hidden') => {
    try {
      await api.moderateSpot(spotId, { status });
      showToast(`Spot status updated to ${status}`);
      await loadData();
      onRefreshSpots();
    } catch (e: any) {
      showToast(e.message || 'Could not update spot');
    }
  };

  const handleDeleteSingleSpot = async (spot: Spot) => {
    setConfirmDialog({
      title: 'Delete Spot from Canvas?',
      message: `Permanently delete "${spot.content.headline || spot.creatorName}"?`,
      danger: true,
      icon: '🗑️',
      confirmText: 'Delete Spot',
      warningBadge: 'This spot, artwork, audio, and its comments will be permanently erased.',
      onConfirm: async () => {
        try {
          await api.deleteAdminSpot(spot.id);
          showToast('Spot deleted.');
          await loadData();
          onRefreshSpots();
        } catch (e: any) {
          showToast('Could not delete spot: ' + (e.message || 'unknown error'));
        }
      },
    });
  };

  const handleDeleteSelectedSpots = async () => {
    const ids = Array.from(selectedSpotIds);
    if (ids.length === 0) return;
    setConfirmDialog({
      title: `Delete ${ids.length} Selected Spots?`,
      message: `Permanently delete ${ids.length} selected spot(s) from canvas?`,
      danger: true,
      icon: '🗑️',
      confirmText: `Delete ${ids.length} Spots`,
      warningBadge: 'Selected spots and their media will be permanently purged from the canvas.',
      onConfirm: async () => {
        try {
          await api.deleteAdminSpotsBatch(ids);
          showToast(`Deleted ${ids.length} spot(s)`);
          setSelectedSpotIds(new Set());
          await loadData();
          onRefreshSpots();
        } catch (e: any) {
          showToast('Could not delete selected spots: ' + (e.message || 'error'));
        }
      },
    });
  };

  const handleDeleteAllSpots = async () => {
    if (spots.length === 0) return;
    setConfirmDialog({
      title: '⚠️ WIPE ENTIRE CANVAS?',
      message: `Are you sure you want to delete ALL ${spots.length} spots from the entire canvas?`,
      danger: true,
      icon: '💥',
      confirmText: 'Wipe All Canvas Spots',
      warningBadge: 'CRITICAL DANGER: This will delete every single spot created by all users across the world. This action CANNOT be undone.',
      onConfirm: async () => {
        try {
          await api.deleteAllAdminSpots();
          showToast('All spots deleted from canvas.');
          setSelectedSpotIds(new Set());
          await loadData();
          onRefreshSpots();
        } catch (e: any) {
          showToast('Could not delete all spots: ' + (e.message || 'error'));
        }
      },
    });
  };

  const handleUpdateSpotGodMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;
    setIsSubmitting(true);
    try {
      await api.updateAdminSpot(editingSpot.id, {
        title: editingSpot.title,
        creatorName: editingSpot.creatorName,
        ownerId: editingSpot.ownerId,
        tier: editingSpot.tier,
        shape: editingSpot.shape,
        background: editingSpot.background,
        borderColor: editingSpot.borderColor,
        x: editingSpot.x,
        y: editingSpot.y,
        rotation: editingSpot.rotation,
        status: editingSpot.status,
        moderationStatus: editingSpot.moderationStatus,
        visibility: editingSpot.visibility,
        allowComments: editingSpot.allowComments,
        content: editingSpot.content,
      });
      showToast(`Spot ${editingSpot.id} updated!`);
      setEditingSpot(null);
      await loadData();
      onRefreshSpots();
    } catch (err: any) {
      showToast(`Could not update spot: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAdminSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
      showToast('Spot created on canvas!');
      setShowAddSpot(false);
      setNewSpotHeadline('');
      setNewSpotText('');
      await loadData();
      onRefreshSpots();
    } catch (e: any) {
      showToast(`Could not create spot: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =================== ORDER ACTIONS ===================
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await api.updateAdminOrder(orderId, { status });
      showToast(`Order ${orderId} marked as ${status}`);
      await loadData();
    } catch (err: any) {
      showToast(`Could not update order: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmDialog({
      title: 'Delete Order Record?',
      message: `Permanently delete financial order record ${orderId}?`,
      danger: true,
      icon: '🧾',
      confirmText: 'Delete Order',
      warningBadge: 'The financial record will be removed from the database.',
      onConfirm: async () => {
        try {
          await api.deleteAdminOrder(orderId);
          showToast(`Deleted order ${orderId}`);
          await loadData();
        } catch (err: any) {
          showToast(`Could not delete order: ${err.message}`);
        }
      },
    });
  };

  // =================== COMMENT ACTIONS ===================
  const handleDeleteComment = async (commentId: string) => {
    setConfirmDialog({
      title: 'Delete Comment?',
      message: 'Permanently delete this comment from the spot discussion thread?',
      danger: true,
      icon: '💬',
      confirmText: 'Delete Comment',
      onConfirm: async () => {
        try {
          await api.deleteAdminComment(commentId);
          showToast('Comment deleted.');
          await loadData();
          onRefreshSpots();
        } catch (err: any) {
          showToast(`Could not delete comment: ${err.message}`);
        }
      },
    });
  };

  // =================== BACKUP ACTIONS ===================
  const handleCreateBackupNow = async () => {
    try {
      const res = await api.createAdminBackup();
      showToast(`Backup snapshot created: ${res.filename}`);
      await loadData();
    } catch (err: any) {
      showToast(`Failed to create backup: ${err.message}`);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    setConfirmDialog({
      title: '⚠️ Restore Database Snapshot?',
      message: `Are you sure you want to restore snapshot "${filename}"?`,
      danger: true,
      icon: '🔄',
      confirmText: 'Restore Database Snapshot',
      warningBadge: 'Current database spots and users will be replaced by this backup snapshot.',
      onConfirm: async () => {
        try {
          const res = await api.restoreAdminBackup(filename);
          showToast(res.message);
          await loadData();
          onRefreshSpots();
        } catch (err: any) {
          showToast(`Restore failed: ${err.message}`);
        }
      },
    });
  };

  // Total revenue calculated
  const totalRevenueINR = useMemo(() => {
    return orders
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + (o.amountINR || 0), 0);
  }, [orders]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b0d17] border border-white/15 w-full max-w-7xl h-[92vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative text-slate-100 font-sans">
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 px-4 py-2 rounded-xl bg-pink-600/95 text-white font-bold text-xs shadow-lg border border-pink-400 flex items-center gap-2 animate-bounce">
            <span>⚡</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* =================== TOP BAR =================== */}
        <div className="p-4 bg-[#101424] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <SpotPopLogo className="h-6 w-auto" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                ADVANCED GOD-MODE ADMIN
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                Supreme Master Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
              title="Refresh all data"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* =================== QUICK KPI STRIP =================== */}
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs shrink-0">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Total Spots</div>
            <div className="text-pink-400 font-mono font-bold text-base">{spots.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Total Users</div>
            <div className="text-cyan-400 font-mono font-bold text-base">{users.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Revenue</div>
            <div className="text-emerald-400 font-mono font-bold text-base">₹{totalRevenueINR.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Total Orders</div>
            <div className="text-amber-400 font-mono font-bold text-base">{orders.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Comments</div>
            <div className="text-purple-400 font-mono font-bold text-base">{comments.length}</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Pending Reports</div>
            <div className="text-rose-400 font-mono font-bold text-base">
              {reports.filter((r) => r.status === 'pending').length}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Backups</div>
            <div className="text-indigo-400 font-mono font-bold text-base">{backups.length} Saved</div>
          </div>
        </div>

        {/* =================== TABS NAVIGATION =================== */}
        <div className="px-4 py-2 bg-[#0d101e] border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'users', label: '👥 Users', count: users.length },
            { id: 'spots', label: '📍 Spots & Canvas', count: spots.length },
            { id: 'orders', label: '💳 Orders & Revenue', count: orders.length },
            { id: 'comments', label: '💬 Comments', count: comments.length },
            { id: 'reports', label: '🛡️ Reports', count: reports.filter((r) => r.status === 'pending').length },
            { id: 'storage', label: '💾 Storage & Backups', count: backups.length },
            { id: 'metrics', label: '📈 System Metrics', count: undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#FF2E93] to-purple-600 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id ? 'bg-black/40 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* =================== TAB CONTENT BODY =================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: USERS MANAGEMENT                                 */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px]">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by username, email, display name, ID..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  {/* Filter Role */}
                  <select
                    value={filterUserRole}
                    onChange={(e) => setFilterUserRole(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin Only</option>
                    <option value="user">User Only</option>
                  </select>

                  {/* Filter Privacy */}
                  <select
                    value={filterUserPrivacy}
                    onChange={(e) => setFilterUserPrivacy(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Privacy</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortUser}
                    onChange={(e) => setSortUser(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="newest">Newest Joined</option>
                    <option value="oldest">Oldest Joined</option>
                    <option value="username_asc">Username (A-Z)</option>
                    <option value="display_asc">Display Name (A-Z)</option>
                    <option value="spots_desc">Most Owned Spots</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedUserIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedUsers}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🗑️</span>
                      <span>Delete Selected ({selectedUserIds.size})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>➕</span>
                    <span>Create User</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-black/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
                              } else {
                                setSelectedUserIds(new Set());
                              }
                            }}
                            className="rounded accent-pink-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Account Type</th>
                        <th className="p-3">Owned Spots</th>
                        <th className="p-3">Joined</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No users match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelected = selectedUserIds.has(user.id);
                          return (
                            <tr key={user.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-pink-500/10' : ''}`}>
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const next = new Set(selectedUserIds);
                                    if (e.target.checked) next.add(user.id);
                                    else next.delete(user.id);
                                    setSelectedUserIds(next);
                                  }}
                                  className="rounded accent-pink-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                                    alt={user.username}
                                    onError={(e) => {
                                      const el = e.currentTarget;
                                      el.onerror = null;
                                      el.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username || 'user'}`;
                                    }}
                                    className="w-8 h-8 rounded-full border border-white/20 object-cover bg-slate-800"
                                  />
                                  <div>
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>@{user.username}</span>
                                      {user.role === 'admin' && (
                                        <span className="text-[10px] text-amber-300">👑</span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{user.displayName || user.email}</div>
                                    <div className="text-[9px] text-slate-500 font-mono">{user.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    user.role === 'admin'
                                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                      : 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  user.isPrivate ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {user.isPrivate ? '🔒 Private' : '🌍 Public'}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-pink-400">
                                {user.ownedSpotIds?.length || 0}
                              </td>
                              <td className="p-3 text-[11px] text-slate-400">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingUser({ ...user })}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Edit User"
                                  >
                                    ✏️
                                  </button>
                                  {user.id !== 'usr_admin' && (
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                                      title="Delete User"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SPOTS & CANVAS MANAGEMENT                         */}
          {/* ======================================================== */}
          {activeTab === 'spots' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px]">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder="Search headline, creator, slug, spot ID..."
                      value={searchSpot}
                      onChange={(e) => setSearchSpot(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  {/* Filter Tier */}
                  <select
                    value={filterSpotTier}
                    onChange={(e) => setFilterSpotTier(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Tiers</option>
                    <option value="mini_pop">Mini Pop (₹29)</option>
                    <option value="big_pop">Big Pop (₹99)</option>
                  </select>

                  {/* Filter Shape */}
                  <select
                    value={filterSpotShape}
                    onChange={(e) => setFilterSpotShape(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Shapes</option>
                    <option value="polaroid">Polaroid</option>
                    <option value="sticky">Sticky Note</option>
                    <option value="frameless">Frameless</option>
                    <option value="poster">Poster</option>
                    <option value="glass">Glass</option>
                    <option value="gold">Gold</option>
                  </select>

                  {/* Filter Status */}
                  <select
                    value={filterSpotStatus}
                    onChange={(e) => setFilterSpotStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>

                  {/* Filter Moderation */}
                  <select
                    value={filterSpotModeration}
                    onChange={(e) => setFilterSpotModeration(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Moderation</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="flagged">Flagged</option>
                    <option value="removed">Removed</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortSpot}
                    onChange={(e) => setSortSpot(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="likes">Most Likes</option>
                    <option value="views">Most Views</option>
                    <option value="comments">Most Comments</option>
                    <option value="coord_x">X Coordinate</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedSpotIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelectedSpots}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🗑️</span>
                      <span>Delete ({selectedSpotIds.size})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddSpot(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-pink-500/20"
                  >
                    <span>➕</span>
                    <span>Add Spot</span>
                  </button>
                  <button
                    onClick={handleDeleteAllSpots}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-bold text-xs transition-colors cursor-pointer"
                    title="Delete all spots from canvas"
                  >
                    ⚠️ Clear Canvas
                  </button>
                </div>
              </div>

              {/* Spots Table */}
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-black/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={filteredSpots.length > 0 && selectedSpotIds.size === filteredSpots.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSpotIds(new Set(filteredSpots.map((s) => s.id)));
                              } else {
                                setSelectedSpotIds(new Set());
                              }
                            }}
                            className="rounded accent-pink-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Artwork / Headline</th>
                        <th className="p-3">Creator / Owner</th>
                        <th className="p-3">Tier & Shape</th>
                        <th className="p-3">Coordinates</th>
                        <th className="p-3">Stats</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {filteredSpots.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No spots match the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredSpots.map((spot) => {
                          const isSelected = selectedSpotIds.has(spot.id);
                          return (
                            <tr key={spot.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-pink-500/10' : ''}`}>
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const next = new Set(selectedSpotIds);
                                    if (e.target.checked) next.add(spot.id);
                                    else next.delete(spot.id);
                                    setSelectedSpotIds(next);
                                  }}
                                  className="rounded accent-pink-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  {spot.content?.imageUrl ? (
                                    <img
                                      src={spot.content.imageUrl}
                                      alt="thumb"
                                      onError={(e) => {
                                        const el = e.currentTarget;
                                        el.onerror = null;
                                        el.src = DEFAULT_SPOT_FALLBACK_SVG;
                                      }}
                                      className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                                    />
                                  ) : (
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border border-white/10"
                                      style={{ background: spot.background || '#FFF475' }}
                                    >
                                      📝
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-white truncate max-w-[200px]">
                                      {spot.content.headline || spot.title || 'Untitled Spot'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                                      {spot.id} · {spot.slug}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-pink-300">@{spot.creatorName}</div>
                                <div className="text-[9px] text-slate-500 font-mono">{spot.ownerId}</div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${
                                    spot.tier === 'big_pop' ? 'bg-pink-500/20 text-pink-300' : 'bg-amber-400/20 text-amber-300'
                                  }`}>
                                    {spot.tier === 'big_pop' ? 'Big Pop (₹99)' : 'Mini Pop (₹29)'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 capitalize">{spot.shape}</span>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-300">
                                ({spot.x}, {spot.y}) {spot.rotation ? `· ${spot.rotation}°` : ''}
                              </td>
                              <td className="p-3">
                                <div className="text-[10px] text-slate-300 space-y-0.5">
                                  <div>👁️ {spot.viewsCount || 0} views</div>
                                  <div>❤️ {spot.likesCount || 0} · 💬 {spot.commentsCount || 0}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${
                                    spot.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                                  }`}>
                                    {spot.status}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider w-fit ${
                                    spot.moderationStatus === 'approved' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                                  }`}>
                                    {spot.moderationStatus || 'approved'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onSelectSpot(spot)}
                                    className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 transition-colors cursor-pointer"
                                    title="View / Teleport on Canvas"
                                  >
                                    📍
                                  </button>
                                  <button
                                    onClick={() => setEditingSpot({ ...spot, content: { ...spot.content } })}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="God-Mode Edit Spot"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleModerateSpot(spot.id, spot.status === 'published' ? 'hidden' : 'published')}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                                    title={spot.status === 'published' ? 'Hide Spot' : 'Publish Spot'}
                                  >
                                    {spot.status === 'published' ? '👁️‍🗨️' : '👁️'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSingleSpot(spot)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                                    title="Delete Spot"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: ORDERS & REVENUE MANAGEMENT                      */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder="Search order ID, payment ID, customer email..."
                      value={searchOrder}
                      onChange={(e) => setSearchOrder(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <select
                    value={filterOrderStatus}
                    onChange={(e) => setFilterOrderStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 focus:outline-hidden"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_desc">Amount (High to Low)</option>
                    <option value="amount_asc">Amount (Low to High)</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-black/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3">Order ID & Date</th>
                      <th className="p-3">Tier</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Customer / Creator</th>
                      <th className="p-3">Payment Info</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No orders found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3">
                            <div className="font-mono font-bold text-white">{order.id}</div>
                            <div className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              order.productId === 'big_pop' ? 'bg-pink-500/20 text-pink-300' : 'bg-amber-400/20 text-amber-300'
                            }`}>
                              {order.productId}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400 text-sm">
                            ₹{(order.amountINR || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3">
                            <div className="text-white font-medium">{order.spotDraft?.creatorName || 'Spotter'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{order.userId}</div>
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">
                            {order.razorpayPaymentId || order.razorpayOrderId || 'Sandbox Order'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : order.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                                className="px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-[10px] font-bold text-slate-300 focus:outline-hidden cursor-pointer"
                              >
                                <option value="paid">Set Paid</option>
                                <option value="pending">Set Pending</option>
                                <option value="failed">Set Failed</option>
                                <option value="refunded">Set Refunded</option>
                              </select>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                                title="Delete Order"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: COMMENTS & COMMUNITY                             */}
          {/* ======================================================== */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Search comment text, author, spot..."
                    value={searchComment}
                    onChange={(e) => setSearchComment(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
                <div className="text-xs text-slate-400 font-bold">
                  {filteredComments.length} Comments Loaded
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-black/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3">Author</th>
                      <th className="p-3">Comment Text</th>
                      <th className="p-3">Spot</th>
                      <th className="p-3">Likes</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredComments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No comments found.
                        </td>
                      </tr>
                    ) : (
                      filteredComments.map((cmt) => (
                        <tr key={cmt.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white">@{cmt.authorName}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{cmt.id}</div>
                          </td>
                          <td className="p-3 text-slate-200 max-w-sm">
                            <p className="line-clamp-2">{cmt.text}</p>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-pink-300 truncate max-w-[160px]">{cmt.spotTitle}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{cmt.spotId}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-amber-400">
                            ❤️ {cmt.likesCount || 0}
                          </td>
                          <td className="p-3 text-[10px] text-slate-400">
                            {new Date(cmt.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteComment(cmt.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: REPORTS & MODERATION                              */}
          {/* ======================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Filter Status:</span>
                  {(['all', 'pending', 'resolved', 'dismissed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterReportStatus(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                        filterReportStatus === st ? 'bg-pink-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-black/50 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3">Report ID</th>
                      <th className="p-3">Reason & Details</th>
                      <th className="p-3">Spot ID</th>
                      <th className="p-3">Reporter</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No reports match status filter.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono font-bold text-white">{rep.id}</td>
                          <td className="p-3">
                            <div className="font-bold text-red-400 uppercase text-[11px]">{rep.reason}</div>
                            {rep.details && <div className="text-[11px] text-slate-300 mt-0.5">{rep.details}</div>}
                          </td>
                          <td className="p-3 font-mono text-pink-300">{rep.spotId}</td>
                          <td className="p-3 text-slate-400">{rep.reporterEmail || 'Anonymous User'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rep.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                : rep.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {rep.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {rep.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={async () => {
                                    await api.resolveReport(rep.id, 'hide_spot');
                                    showToast('Report resolved & offending spot hidden.');
                                    loadData();
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Hide Spot
                                </button>
                                <button
                                  onClick={async () => {
                                    await api.resolveReport(rep.id, 'dismiss');
                                    showToast('Report dismissed.');
                                    loadData();
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">Reviewed by {rep.reviewedBy || 'Admin'}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: STORAGE & BACKUPS INTELLIGENCE                    */}
          {/* ======================================================== */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Storage Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase">Total Storage Used</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {storageStats ? `${(storageStats.totalStorageBytes / (1024 * 1024)).toFixed(2)} MB` : 'Calculating...'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {storageStats?.totalUploads || 0} files ({storageStats?.uniqueAssets || 0} unique assets)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase">Deduplication Savings</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {storageStats ? `${(storageStats.duplicateBytesSaved / 1024).toFixed(1)} KB` : '0 KB'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {storageStats?.duplicateAvoidedCount || 0} duplicate uploads safely avoided
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase">Estimated Cloud Cost</div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">
                    ${storageStats?.estimatedMonthlyCostUSD?.toFixed(4) || '0.0000'} / mo
                  </div>
                  <div className="text-[11px] text-slate-500">Zero-Egress Tier Supported</div>
                </div>
              </div>

              {/* Backups Section */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>💾</span> Automated & Manual Database Snapshots
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Maintains rolling daily backups with single-click restore capabilities.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateBackupNow}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <span>📸</span>
                    <span>Snapshot Database Now</span>
                  </button>
                </div>

                <div className="rounded-xl bg-black/40 border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-white/5 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                      <tr>
                        <th className="p-3">Snapshot Filename</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Created Timestamp</th>
                        <th className="p-3 text-right">Restore Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {backups.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500">
                            No backup snapshots recorded yet. Click &quot;Snapshot Database Now&quot; to create one.
                          </td>
                        </tr>
                      ) : (
                        backups.map((b) => (
                          <tr key={b.filename} className="hover:bg-white/5">
                            <td className="p-3 font-mono font-bold text-white">{b.filename}</td>
                            <td className="p-3 font-mono text-cyan-400">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                            <td className="p-3 text-[11px] text-slate-400">{new Date(b.createdAt).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRestoreBackup(b.filename)}
                                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-colors cursor-pointer"
                              >
                                ⚡ Restore Snapshot
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: METRICS & HEALTH                                  */}
          {/* ======================================================== */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase">Server Uptime</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {metrics?.stats?.uptimeSeconds ? `${metrics.stats.uptimeSeconds}s` : 'Active'}
                  </div>
                  <div className="text-[11px] text-slate-500">Node.js High-Availability Process</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase">Memory Consumption (RSS)</div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">
                    {metrics?.stats?.memoryUsageMB ? `${metrics.stats.memoryUsageMB} MB` : '307 MB'}
                  </div>
                  <div className="text-[11px] text-slate-500">Ceiling: 512 MB Free-Tier Buffer</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs font-bold uppercase">Community Online</div>
                  <div className="text-2xl font-mono font-bold text-purple-400">
                    {users.length} Authentic Users
                  </div>
                  <div className="text-[11px] text-slate-500">Zero Artificial Sine-Wave Inflation</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* CREATE USER MODAL DRAWER                                */}
        {/* ======================================================== */}
        {showCreateUser && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121629] border border-white/20 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>➕</span> Create New User Account
                </h3>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. johndoe"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Display Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={newUserDisplayName}
                      onChange={(e) => setNewUserDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator (God-Mode)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Set account password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Bio (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Short bio..."
                    value={newUserBio}
                    onChange={(e) => setNewUserBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newPriv"
                    checked={newUserIsPrivate}
                    onChange={(e) => setNewUserIsPrivate(e.target.checked)}
                    className="rounded accent-pink-500 cursor-pointer"
                  />
                  <label htmlFor="newPriv" className="text-slate-300 font-bold cursor-pointer">
                    Private Account (Followers must be approved)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EDIT USER MODAL DRAWER                                  */}
        {/* ======================================================== */}
        {editingUser && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121629] border border-white/20 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>✏️</span> Edit User @{editingUser.username}
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-7 h-7 rounded-full bg-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editingUser.displayName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator (God-Mode)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reset Password (Leave blank to keep existing)</label>
                  <input
                    type="password"
                    placeholder="Enter new password to overwrite..."
                    value={editingUser.passwordHash || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, passwordHash: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Bio</label>
                  <textarea
                    rows={2}
                    value={editingUser.bio || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editPriv"
                    checked={Boolean(editingUser.isPrivate)}
                    onChange={(e) => setEditingUser({ ...editingUser, isPrivate: e.target.checked })}
                    className="rounded accent-pink-500 cursor-pointer"
                  />
                  <label htmlFor="editPriv" className="text-slate-300 font-bold cursor-pointer">
                    Private Account
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-pink-500/20"
                  >
                    {isSubmitting ? 'Saving...' : 'Save User Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* GOD-MODE EDIT SPOT DRAWER                               */}
        {/* ======================================================== */}
        {editingSpot && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121629] border border-white/20 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>⚡</span> God-Mode Spot Editor ({editingSpot.id})
                </h3>
                <button
                  onClick={() => setEditingSpot(null)}
                  className="w-7 h-7 rounded-full bg-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSpotGodMode} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Headline Text</label>
                    <input
                      type="text"
                      value={editingSpot.content.headline || ''}
                      onChange={(e) =>
                        setEditingSpot({
                          ...editingSpot,
                          content: { ...editingSpot.content, headline: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Creator Name</label>
                    <input
                      type="text"
                      value={editingSpot.creatorName}
                      onChange={(e) => setEditingSpot({ ...editingSpot, creatorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">X Coordinate</label>
                    <input
                      type="number"
                      value={editingSpot.x}
                      onChange={(e) => setEditingSpot({ ...editingSpot, x: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Y Coordinate</label>
                    <input
                      type="number"
                      value={editingSpot.y}
                      onChange={(e) => setEditingSpot({ ...editingSpot, y: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Rotation (°)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingSpot.rotation || 0}
                      onChange={(e) => setEditingSpot({ ...editingSpot, rotation: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tier</label>
                    <select
                      value={editingSpot.tier}
                      onChange={(e) => setEditingSpot({ ...editingSpot, tier: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="mini_pop">Mini Pop (₹29)</option>
                      <option value="big_pop">Big Pop (₹99)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Shape</label>
                    <select
                      value={editingSpot.shape}
                      onChange={(e) => setEditingSpot({ ...editingSpot, shape: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="polaroid">Polaroid</option>
                      <option value="sticky">Sticky Note</option>
                      <option value="frameless">Frameless</option>
                      <option value="poster">Poster</option>
                      <option value="glass">Glass</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Status</label>
                    <select
                      value={editingSpot.status}
                      onChange={(e) => setEditingSpot({ ...editingSpot, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Card Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingSpot.background || '#FFFFFF'}
                        onChange={(e) => setEditingSpot({ ...editingSpot, background: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingSpot.background || '#FFFFFF'}
                        onChange={(e) => setEditingSpot({ ...editingSpot, background: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Visibility</label>
                    <select
                      value={editingSpot.visibility || 'public'}
                      onChange={(e) => setEditingSpot({ ...editingSpot, visibility: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private (Only Creator)</option>
                      <option value="friends_only">Friends Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Artwork Image URL</label>
                  <input
                    type="text"
                    value={editingSpot.content.imageUrl || ''}
                    onChange={(e) =>
                      setEditingSpot({
                        ...editingSpot,
                        content: { ...editingSpot.content, imageUrl: e.target.value || undefined },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-[11px] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingSpot(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-pink-500/20"
                  >
                    {isSubmitting ? 'Saving Spot...' : 'Apply God-Mode Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADD SPOT DRAWER                                         */}
        {/* ======================================================== */}
        {showAddSpot && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#121629] border border-white/20 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>➕</span> Create New Canvas Spot
                </h3>
                <button
                  onClick={() => setShowAddSpot(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAdminSpot} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tier</label>
                    <select
                      value={newSpotTier}
                      onChange={(e) => {
                        const t = e.target.value as ProductTier;
                        setNewSpotTier(t);
                        if (t === 'mini_pop') {
                          setNewSpotShape('sticky');
                          setNewSpotBg('#FEF08A');
                        } else {
                          setNewSpotShape('polaroid');
                          setNewSpotBg('#FFFFFF');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    >
                      <option value="big_pop">Big Pop (₹99)</option>
                      <option value="mini_pop">Mini Pop (₹29)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Creator Name</label>
                    <input
                      type="text"
                      value={newSpotCreator}
                      onChange={(e) => setNewSpotCreator(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="Spot headline..."
                    value={newSpotHeadline}
                    onChange={(e) => setNewSpotHeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Message Text</label>
                  <textarea
                    rows={2}
                    placeholder="Short message or story..."
                    value={newSpotText}
                    onChange={(e) => setNewSpotText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-hidden resize-none"
                  />
                </div>

                {newSpotTier === 'big_pop' && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Image URL</label>
                    <input
                      type="text"
                      value={newSpotImageUrl}
                      onChange={(e) => setNewSpotImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-hidden"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddSpot(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-pink-500/20"
                  >
                    {isSubmitting ? 'Placing Spot...' : 'Place Spot on Canvas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Universal Custom Warning / Confirmation Modal */}
        {confirmDialog && (
          <ConfirmModal
            isOpen={true}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText || 'Cancel'}
            danger={confirmDialog.danger}
            warningBadge={confirmDialog.warningBadge}
            icon={confirmDialog.icon}
            isLoading={isConfirmLoading}
            onCancel={() => {
              if (!isConfirmLoading) setConfirmDialog(null);
            }}
            onConfirm={async () => {
              setIsConfirmLoading(true);
              try {
                await confirmDialog.onConfirm();
              } finally {
                setIsConfirmLoading(false);
                setConfirmDialog(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
