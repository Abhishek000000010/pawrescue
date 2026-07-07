import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Image, 
  MapPin, 
  AlertCircle, 
  Calendar, 
  Home, 
  BookOpen, 
  Sparkles, 
  Send, 
  Smile,
  CheckCircle,
  Plus,
  Flame,
  Award,
  ChevronRight,
  UserCheck,
  Trophy,
  Activity,
  HeartHandshake,
  Trash2
} from 'lucide-react';

import { Post } from '../types';

interface CommunityFeedProps {
  posts?: Post[];
  setPosts?: React.Dispatch<React.SetStateAction<Post[]>>;
}

export default function CommunityFeed({ posts: propPosts, setPosts: propSetPosts }: CommunityFeedProps = {}) {
  // Active state for posts
  const [localPosts, setLocalPosts] = useState<Post[]>([
    {
      id: 'post-1',
      author: {
        name: 'Sara Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        title: 'Maple Street Sanctuary',
        time: '4h ago'
      },
      title: 'The Journey Home: From the rain to the fireplace.',
      content: "Meet Oliver. Six weeks ago, he was found shivering in a damp box during a storm. Today, he's the king of his new forever home. Thank you everyone for the support!",
      isSuccessStory: true,
      beforeAfter: {
        beforeImg: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
        afterImg: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400',
        beforeLabel: 'BEFORE: LIFE ON THE STREETS',
        afterLabel: 'AFTER: HOME & HEALTH'
      },
      likes: 1240,
      commentsCount: 84,
      isLiked: false,
      isBookmarked: false,
      comments: [
        {
          author: 'Mark T.',
          text: 'This is why we do what we do! Beautiful transformation. ❤️',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
        }
      ],
      tags: ['Success Story', 'Adopted'],
      reactions: { '❤️': 82, '🎉': 45, '🙌': 31 }
    },
    {
      id: 'post-2',
      author: {
        name: 'Dr. Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
        title: 'Veterinary Volunteer',
        time: '2h ago'
      },
      title: "Kitten Nutrition Tip: Say No to Cow's Milk",
      content: "When feeding stray kittens under 4 weeks, avoid cow's milk as it causes severe dehydration. Use a specific Kitten Milk Replacer (KMR) and always feed them while they are on their tummies, never on their backs!",
      image: 'https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=600',
      likes: 856,
      commentsCount: 45,
      isLiked: false,
      isBookmarked: false,
      comments: [],
      tags: ['KittenCare', 'VetAdvice'],
      reactions: { '❤️': 35, '💡': 24, '🙌': 18 }
    },
    {
      id: 'post-3',
      author: {
        name: 'Elena Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
        title: 'Downtown Colony Caretaker',
        time: 'Today at 8:30 AM'
      },
      content: '"Breakfast is served! All 12 residents accounted for today and looking healthy."',
      image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
      likes: 342,
      commentsCount: 18,
      isLiked: false,
      isBookmarked: false,
      comments: [],
      tags: ['CommunityFeeding', 'StrayCare'],
      reactions: { '❤️': 15, '😂': 2, '🙌': 12 }
    }
  ]);

  const posts = propPosts !== undefined ? propPosts : localPosts;
  const setPosts = propSetPosts !== undefined ? propSetPosts : setLocalPosts;


  // Posting new update state
  const [newPostText, setNewPostText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [urgentTag, setUrgentTag] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Category selection for filtering
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'success' | 'vet' | 'urgent'>('all');

  // Interactive profile state ('none' | 'rescues' | 'missions' | 'points')
  const [activeProfileTab, setActiveProfileTab] = useState<'none' | 'rescues' | 'missions' | 'points'>('none');

  // Comments in-progress
  const [activeCommentTexts, setActiveCommentTexts] = useState<Record<string, string>>({});

  // Dynamic metrics
  const [userRescues, setUserRescues] = useState(12);
  const [userPoints, setUserPoints] = useState(450);
  const [userMissions, setUserMissions] = useState(8);

  // Logged-in user profile — read instantly from localStorage (same data as login/header), then refresh from API
  const [currentUser, setCurrentUser] = useState<{ name: string; avatar: string; role: string } | null>(() => {
    try {
      const stored = localStorage.getItem('pawnet_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          name: u.name || u.firstName || 'Guardian',
          avatar: u.avatar || '',
          role: u.role || 'user'
        };
      }
    } catch (_) {}
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('pawnet_token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCurrentUser({
            name: data.name || data.firstName || 'Guardian',
            avatar: data.avatar || '',
            role: data.role || 'user'
          });
        }
      })
      .catch(() => {});
  }, []);

  const userDisplayName = currentUser?.name || 'Guardian';
  const DEFAULT_AVATAR = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=FF5A5F&color=fff&size=150`;
  const userAvatar = currentUser?.avatar || DEFAULT_AVATAR;

  // Registering colony modal simulation
  const [showRegisterColony, setShowRegisterColony] = useState(false);
  const [colonyName, setColonyName] = useState('');
  const [colonyLocation, setColonyLocation] = useState('');
  const [colonyCount, setColonyCount] = useState('5');
  const [colonySubmitted, setColonySubmitted] = useState(false);

  // Leaderboard modal state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Fetch live community posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/community' + (selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''));
        if (response.ok) {
          const data = await response.json();
          const formattedPosts = data.map((p: any) => ({
            id: p._id,
            author: {
              name: p.author?.name || 'Unknown User',
              avatar: p.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
              title: p.author?.role === 'admin' ? 'PawNet Admin' : 'Guardian',
              time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just Now'
            },
            title: p.title,
            content: p.content || '',
            image: p.image,
            isSuccessStory: p.isSuccessStory || false,
            likes: p.likes?.length || 0,
            commentsCount: p.comments?.length || 0,
            comments: (p.comments || []).map((c: any) => ({
              author: c.author?.name || 'Unknown User',
              avatar: c.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
              text: c.text || ''
            })),
            isLiked: false, 
            tags: p.tags || [],
            reactions: p.reactions || {}
          }));
          if (propSetPosts) propSetPosts(formattedPosts);
          else setLocalPosts(formattedPosts);
        }
      } catch (err) {
        console.error('Failed to fetch posts', err);
      }
    };
    fetchPosts();
  }, [selectedCategory, propSetPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedPhoto) return;

    const token = localStorage.getItem('pawnet_token');
    if (!token) {
      alert("Please login to post");
      return;
    }

    setIsPosting(true);

    try {
      const formData = new FormData();
      formData.append('content', newPostText);
      formData.append('isSuccessStory', 'false');
      if (urgentTag) {
        formData.append('tags', JSON.stringify(['UrgentCase', 'Reported']));
      } else {
        formData.append('tags', JSON.stringify(['CommunityUpdate']));
      }

      // In a real app we'd append actual files. For the mock preset photos, 
      // we'll just skip it or send as text if the backend allowed it.
      // Since this is a demo, we will bypass the actual file upload if selectedPhoto is a string URL
      // by temporarily disabling backend image processing for strings.

      const response = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData // Using FormData for future file upload support
      });

      if (response.ok) {
        const newP = await response.json();
        
        const newlyCreated: Post = {
          id: newP._id,
          author: {
            name: newP.author.name,
            avatar: newP.author.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            title: 'Guardian',
            time: 'Just Now'
          },
          content: newP.content,
          image: selectedPhoto || undefined, // Fallback to our selected mock photo
          likes: 0,
          commentsCount: 0,
          isLiked: false,
          isBookmarked: false,
          comments: [],
          tags: newP.tags,
          reactions: { '❤️': 0, '🎉': 0, '🙌': 0 }
        };

        setPosts([newlyCreated, ...posts]);
        setNewPostText('');
        setSelectedPhoto(null);
        setUrgentTag(false);
        setUserPoints(prev => prev + 15);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    const token = localStorage.getItem('pawnet_token');
    if (!token) {
      alert("Please login to perform this action");
      return;
    }

    try {
      const response = await fetch(`/api/community/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        const data = await response.json();
        alert(data.message || "You are not authorized to delete this post.");
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert("Failed to delete the post.");
    }
  };

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem('pawnet_token');
    
    // Optimistic UI update
    setPosts(prev => 
      prev.map(p => {
        if (p.id === postId) {
          const isLikedNow = !p.isLiked;
          return {
            ...p,
            isLiked: isLikedNow,
            likes: isLikedNow ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      })
    );

    if (!token) return;

    try {
      await fetch(`/api/community/${postId}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  // Custom multi-emoji reaction handler
  const handleEmojiReaction = (postId: string, emoji: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const reactions = { ...(p.reactions || { '❤️': 0, '🎉': 0, '🙌': 0, '😂': 0, '😢': 0 }) };
          
          if (p.userReaction === emoji) {
            // Undo reaction
            reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
            return {
              ...p,
              reactions,
              userReaction: undefined
            };
          } else {
            // If they had a previous reaction, undo that one first
            if (p.userReaction) {
              const oldEmoji = p.userReaction;
              reactions[oldEmoji] = Math.max(0, (reactions[oldEmoji] || 1) - 1);
            }
            // Add new reaction
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            return {
              ...p,
              reactions,
              userReaction: emoji
            };
          }
        }
        return p;
      })
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts(prev => 
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isBookmarked: !p.isBookmarked
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = async (postId: string) => {
    const text = activeCommentTexts[postId];
    if (!text || !text.trim()) return;

    const token = localStorage.getItem('pawnet_token');

    setPosts(prev => 
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [
              ...(p.comments || []),
              {
                author: 'You',
                text: text,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
              }
            ]
          };
        }
        return p;
      })
    );

    setActiveCommentTexts(prev => ({
      ...prev,
      [postId]: ''
    }));

    if (!token) return;

    try {
      await fetch(`/api/community/${postId}/comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ text })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Submit simulated colony site
  const handleRegisterColonySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colonyName.trim() || !colonyLocation.trim()) return;

    setColonySubmitted(true);
    setUserPoints(prev => prev + 50);
    setUserMissions(prev => prev + 1);

    setTimeout(() => {
      setShowRegisterColony(false);
      setColonySubmitted(false);
      setColonyName('');
      setColonyLocation('');
      alert(`Colony feeding site "${colonyName}" registered successfully! Earned +50 XP and registered in sector system.`);
    }, 1200);
  };

  // Filter posts based on category state
  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'success') return post.isSuccessStory;
    if (selectedCategory === 'vet') {
      return post.tags?.some(tag => 
        tag.toLowerCase().includes('vet') || 
        tag.toLowerCase().includes('nutrition') || 
        tag.toLowerCase().includes('care')
      );
    }
    if (selectedCategory === 'urgent') {
      return post.tags?.some(tag => 
        tag.toLowerCase().includes('urgent') || 
        tag.toLowerCase().includes('report')
      );
    }
    return true;
  });

  // Mock preset images for custom updates to simulate real photo uploading
  const presetPhotos = [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=80&w=400'
  ];

  return (
    <section className="pt-6 pb-16 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 min-h-[calc(100vh-80px)]">
      {/* Subtle ambient decorative backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 relative z-10">
        
        {/* Dynamic Navigation Indicator & Premium Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-brand-primary/10 text-brand-primary dark:text-brand-primary-hover px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="h-3 w-3" />
              Social Hub
            </div>
            <h1 className="font-heading text-4xl font-black text-brand-dark dark:text-brand-light tracking-tight leading-none">
              Community Portal
            </h1>
            <p className="text-sm text-brand-muted dark:text-brand-light/75 font-medium">
              Connect with fellow guardians, read real-time logs, and celebrate stories of transformation.
            </p>
          </div>
          
          <div className="self-start sm:self-center bg-white dark:bg-brand-muted/10 border border-zinc-200 dark:border-zinc-800/60 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-heading font-bold text-xs text-zinc-700 dark:text-brand-light/90 tracking-wide uppercase">
              42 Active Guardians Nearby
            </span>
          </div>
        </div>

        {/* Triple Grid Layout exactly like the design spec image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMN 1: Profile & Navigation Widgets (3/12 cols) ================= */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Profile widget card with high fidelity interactive sub-sections */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800 text-center relative overflow-hidden">
              {/* Card top abstract graphic banner */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-brand-primary/15 to-amber-500/10 dark:from-brand-primary/20 dark:to-amber-500/15" />
              
              <div className="relative inline-block mb-4 mt-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-md mx-auto relative z-10">
                  <img 
                    src={userAvatar}
                    alt={userDisplayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white dark:border-zinc-900 z-20 shadow-sm hover:scale-110 transition-transform">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
              
              <h2 className="font-heading text-lg font-extrabold text-brand-dark dark:text-brand-light leading-snug">
                {userDisplayName}
              </h2>
              <span className="inline-block text-[9px] text-brand-primary bg-brand-primary/10 dark:text-amber-400 dark:bg-amber-400/10 font-black tracking-widest px-2.5 py-0.5 rounded-full mt-1 uppercase">
                LEVEL 4 GUARDIAN
              </span>

              {/* Three Stat counters inside Profile Widget (Now fully interactive!) */}
              <div className="grid grid-cols-3 gap-1 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-center">
                <button 
                  onClick={() => setActiveProfileTab(activeProfileTab === 'rescues' ? 'none' : 'rescues')}
                  className={`py-2 rounded-xl transition-all duration-200 ${activeProfileTab === 'rescues' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <p className="text-base font-black text-brand-dark dark:text-brand-light">{userRescues}</p>
                  <p className="text-[9px] text-brand-muted dark:text-brand-light/50 font-bold uppercase tracking-wide mt-0.5">Rescues</p>
                </button>
                <button 
                  onClick={() => setActiveProfileTab(activeProfileTab === 'points' ? 'none' : 'points')}
                  className={`py-2 border-x border-zinc-100 dark:border-zinc-800/60 transition-all duration-200 ${activeProfileTab === 'points' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <p className="text-base font-black text-brand-primary">{userPoints}</p>
                  <p className="text-[9px] text-brand-muted dark:text-brand-light/50 font-bold uppercase tracking-wide mt-0.5">Points</p>
                </button>
                <button 
                  onClick={() => setActiveProfileTab(activeProfileTab === 'missions' ? 'none' : 'missions')}
                  className={`py-2 rounded-xl transition-all duration-200 ${activeProfileTab === 'missions' ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <p className="text-base font-black text-brand-dark dark:text-brand-light">{userMissions}</p>
                  <p className="text-[9px] text-brand-muted dark:text-brand-light/50 font-bold uppercase tracking-wide mt-0.5">Missions</p>
                </button>
              </div>

              {/* Collapsible Interactive Drawer Panels */}
              <AnimatePresence mode="wait">
                {activeProfileTab !== 'none' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800/60 mt-4 pt-4 text-left"
                  >
                    {activeProfileTab === 'rescues' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-brand-dark dark:text-brand-light uppercase tracking-wider flex items-center gap-1.5">
                            <HeartHandshake className="h-3.5 w-3.5 text-brand-primary" /> Active Rescues
                          </h4>
                          <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">4 Saved</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { name: 'Whiskers', status: 'Stable', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=150' },
                            { name: 'Mochi', status: 'In Foster', img: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&q=80&w=150' },
                            { name: 'Cookie', status: 'Adopted!', img: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&q=80&w=150' }
                          ].map((cat, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl text-xs border border-zinc-100 dark:border-zinc-800/30">
                              <img src={cat.img} alt={cat.name} className="h-7 w-7 rounded-full object-cover border border-white dark:border-zinc-800" />
                              <div className="flex-1">
                                <p className="font-extrabold text-brand-dark dark:text-brand-light">{cat.name}</p>
                              </div>
                              <span className={`text-[8px] px-2 py-0.5 rounded-md font-black tracking-wide ${cat.status === 'Adopted!' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                                {cat.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeProfileTab === 'missions' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-brand-dark dark:text-brand-light uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-brand-green" /> Operations List
                          </h4>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">2 Active</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { desc: 'Refill Colony #42', xp: '+150 XP', active: true },
                            { desc: 'Emergency Vet Pick-up', xp: '+150 XP', active: true },
                            { desc: 'Subway Spotter Survey', xp: '+50 XP', active: false }
                          ].map((mis, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl text-xs border border-zinc-100 dark:border-zinc-800/30">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${mis.active ? 'bg-brand-primary animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                                <span className="font-bold text-brand-dark dark:text-brand-light text-xs truncate w-32">{mis.desc}</span>
                              </div>
                              <span className="text-[9px] font-black text-brand-muted dark:text-zinc-400">{mis.xp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeProfileTab === 'points' && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-brand-dark dark:text-brand-light uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" /> XP Milestones
                        </h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-extrabold text-brand-muted">
                            <span>Level 4 Progress</span>
                            <span className="text-brand-primary font-black">{userPoints} / 600 XP</span>
                          </div>
                          {/* Beautiful custom progress bar */}
                          <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative shadow-inner border border-zinc-200/30 dark:border-zinc-700/30">
                            <div className="h-full bg-gradient-to-r from-brand-primary to-amber-500 rounded-full" style={{ width: `${(userPoints / 600) * 100}%` }} />
                          </div>
                        </div>
                        {/* Dynamic Achievement Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            { name: '🥇 First Responder', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
                            { name: '🍼 Foster Care', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
                          ].map((b, idx) => (
                            <span key={idx} className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${b.color}`}>
                              {b.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



          </div>

          {/* ================= COLUMN 2: Community News/Updates Social Feed (6/12 cols) ================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Create Rescue Update Box Widget */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800 space-y-5">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-brand-primary/20 shrink-0 shadow-inner bg-zinc-100">
                    <img 
                      src={userAvatar}
                      alt={userDisplayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="Share a rescue update or ask for community advice..."
                      className="w-full border-0 focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-500 text-brand-dark dark:text-brand-light bg-transparent resize-none h-20 text-sm focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Selected preset photo preview if clicked */}
                {selectedPhoto && (
                  <div className="relative rounded-2xl overflow-hidden h-52 border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <img src={selectedPhoto} alt="Upload preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setSelectedPhoto(null)} 
                      className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-base font-black transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Bottom line controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex flex-wrap items-center gap-1">
                    {/* Choose dynamic preset photo to simulate file picker upload */}
                    <button
                      type="button"
                      onClick={() => {
                        const randomPhoto = presetPhotos[Math.floor(Math.random() * presetPhotos.length)];
                        setSelectedPhoto(randomPhoto);
                      }}
                      className="px-3 py-2 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:text-brand-primary hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 flex items-center gap-2 text-xs font-bold"
                    >
                      <Image className="h-4.5 w-4.5 text-brand-primary" />
                      <span>Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert('Location auto-detected to Downtown Ward')}
                      className="px-3 py-2 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:text-brand-primary hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 flex items-center gap-2 text-xs font-bold"
                    >
                      <MapPin className="h-4.5 w-4.5 text-zinc-400" />
                      <span>Location</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUrgentTag(!urgentTag)}
                      className={`px-3 py-2 rounded-2xl transition-all duration-200 flex items-center gap-2 text-xs font-bold ${
                        urgentTag 
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200/50 dark:border-red-500/25 shadow-xs' 
                          : 'text-zinc-600 dark:text-zinc-300 hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <AlertCircle className="h-4.5 w-4.5" />
                      <span>Urgent Tag</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isPosting || (!newPostText.trim() && !selectedPhoto)}
                    className="rounded-2xl bg-[#2D221C] hover:bg-[#3d312a] dark:bg-brand-primary dark:hover:bg-brand-primary-hover px-6 py-2.5 text-xs font-black text-white shadow-md disabled:opacity-50 transition-all uppercase tracking-wider flex items-center gap-2 hover:translate-y-[-1px]"
                  >
                    {isPosting ? 'Posting...' : 'Post Update'}
                  </button>
                </div>
              </form>
            </div>

            {/* Category Filter Tabs Menu */}
            <div className="bg-zinc-100/80 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-inner relative">
              {[
                { id: 'all', label: 'All Feed', icon: '✨' },
                { id: 'success', label: 'Success Stories', icon: '🏆' },
                { id: 'vet', label: 'Vet Advice', icon: '🩺' },
                { id: 'urgent', label: 'Alerts', icon: '🚨' }
              ].map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id as any)}
                    className="relative flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors duration-250 text-zinc-500 dark:text-brand-light/70"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterTab"
                        className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-xs border border-zinc-200/30 dark:border-zinc-700/30"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.icon}</span>
                    <span className={`relative z-10 ${isActive ? 'text-brand-dark dark:text-white font-black' : 'font-bold'}`}>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Social Post Feed Items */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-10 shadow-sm border border-zinc-200/60 dark:border-zinc-800 text-center text-xs text-brand-muted"
                  >
                    No community updates match this category yet. Be the first to post one!
                  </motion.div>
                ) : (
                  filteredPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800 space-y-5"
                    >
                      {/* Header: Author info, title */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-brand-primary/10 bg-brand-cream shrink-0">
                            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading text-sm font-black text-brand-dark dark:text-brand-light leading-tight">
                                {post.author.name}
                              </h4>
                              {post.isSuccessStory && (
                                <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Success Story
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-brand-muted dark:text-brand-light/60 font-bold flex items-center gap-1.5 mt-0.5">
                              <span>{post.author.title}</span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="font-medium">{post.author.time}</span>
                            </p>
                          </div>
                        </div>

                        {/* Three dot menu button */}
                        <button className="text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-800 dark:text-white p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-50 dark:bg-zinc-800 transition-colors">
                          <ChevronRight className="h-4.5 w-4.5 rotate-90" />
                        </button>
                      </div>

                      {/* Content text */}
                      <div className="space-y-1.5">
                        {post.title && (
                          <h3 className="font-heading text-base font-black text-brand-dark dark:text-brand-light leading-snug tracking-tight">
                            {post.title}
                          </h3>
                        )}
                        <p className="text-sm text-zinc-600 dark:text-brand-light/80 leading-relaxed font-medium">
                          {post.content}
                        </p>
                      </div>

                      {/* BEFORE / AFTER Photo Slider Component exactly like the visual mockup */}
                      {post.beforeAfter && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          {/* Before image panel */}
                          <div className="relative rounded-2xl overflow-hidden h-52 border border-zinc-100 dark:border-zinc-800 group shadow-sm">
                            <img 
                              src={post.beforeAfter.beforeImg} 
                              alt="Before story" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-3 left-3">
                              <span className="text-[8px] font-black tracking-widest uppercase text-white bg-red-600/90 px-2.5 py-1 rounded-md backdrop-blur-xs border border-red-500/20">
                                {post.beforeAfter.beforeLabel}
                              </span>
                            </div>
                          </div>

                          {/* After image panel */}
                          <div className="relative rounded-2xl overflow-hidden h-52 border border-zinc-100 dark:border-zinc-800 group shadow-sm">
                            <img 
                              src={post.beforeAfter.afterImg} 
                              alt="After story" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-3 left-3">
                              <span className="text-[8px] font-black tracking-widest uppercase text-white bg-emerald-600/90 px-2.5 py-1 rounded-md backdrop-blur-xs border border-emerald-500/20">
                                {post.beforeAfter.afterLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Simple Standard Post Image */}
                      {post.image && !post.beforeAfter && (
                        <div className="relative rounded-2xl overflow-hidden h-64 border border-zinc-100 dark:border-zinc-800 shadow-sm group">
                          <img 
                            src={post.image} 
                            alt="Rescue update attachment" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" 
                          />
                        </div>
                      )}

                      {/* Hashtags & categories */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.tags.map((tg, idx) => (
                            <span 
                              key={idx}
                              className="text-[9px] font-black uppercase tracking-wider text-brand-primary dark:text-brand-primary bg-brand-primary/5 px-2.5 py-0.5 rounded-full"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Social actions bar exactly like layout mockup */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                        <div className="flex flex-wrap items-center gap-4">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 font-extrabold transition-colors duration-200 ${
                              post.isLiked 
                                ? 'text-red-500 scale-105' 
                                : 'text-zinc-500 dark:text-brand-light/70 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-4.5 w-4.5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="font-bold text-xs">{post.likes.toLocaleString()}</span>
                          </button>

                          <button className="flex items-center gap-1.5 font-extrabold text-zinc-500 dark:text-brand-light/70 hover:text-brand-primary transition-colors duration-200">
                            <MessageCircle className="h-4.5 w-4.5" />
                            <span className="font-bold text-xs">{post.commentsCount}</span>
                          </button>

                          {/* Interactive Emojis popover container */}
                          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-850 px-2 py-0.5 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/40 shadow-xs">
                            {['❤️', '🎉', '🙌', '💡', '😢'].map((em) => {
                              const count = post.reactions?.[em] || 0;
                              const hasReacted = post.userReaction === em;
                              return (
                                <button
                                  key={em}
                                  onClick={() => handleEmojiReaction(post.id, em)}
                                  className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all duration-200 hover:scale-125 ${
                                    hasReacted 
                                      ? 'bg-brand-primary/10 border border-brand-primary/20 scale-110' 
                                      : 'opacity-75 hover:opacity-100'
                                  }`}
                                  title={`React with ${em}`}
                                >
                                  <span className="text-sm">{em}</span>
                                  {count > 0 && (
                                    <span className="text-[9px] font-black text-brand-dark dark:text-brand-light/70">{count}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              alert('Link copied to clipboard!');
                            }}
                            className="flex items-center justify-center p-1.5 rounded-lg text-zinc-400 hover:text-brand-primary hover:bg-zinc-50 dark:hover:bg-zinc-50 dark:bg-zinc-800 transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {post.isSuccessStory && (
                            <button 
                              onClick={() => alert('Initiating adoption process... Please fill the application!')}
                              className="rounded-xl bg-brand-primary text-[9px] font-black text-white px-4 py-2 hover:bg-brand-primary-hover shadow-xs uppercase tracking-wider transition-colors"
                            >
                              Adopt this cat
                            </button>
                          )}
                          <button 
                            onClick={() => handleBookmark(post.id)}
                            className={`p-2 rounded-xl border transition-all duration-250 ${
                              post.isBookmarked 
                                ? 'border-brand-primary/20 bg-brand-primary/5 text-brand-primary' 
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-brand-primary hover:border-brand-primary/40'
                            }`}
                          >
                            <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                          {/* Delete button: accessible to anyone for the demo, but backend validates it. */}
                          {localStorage.getItem('pawnet_token') && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-250"
                              title="Delete Post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Success story layout full read-out story button */}
                      {post.isSuccessStory && (
                        <button 
                          onClick={() => alert('Full transformation journal is loading... Includes vet checkpoints, medical clearances, and adoption logs!')}
                          className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 py-3 text-xs font-black text-zinc-600 dark:text-brand-light/80 hover:border-brand-primary hover:text-brand-primary transition-all duration-200 text-center uppercase tracking-wider"
                        >
                          Read Full Story
                        </button>
                      )}

                      {/* Comments Feed list */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="bg-zinc-50/80 dark:bg-zinc-850/50 rounded-2xl p-4 space-y-3 border border-zinc-100 dark:border-zinc-800/30">
                          {post.comments.map((comment, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-3 text-xs pb-3 last:pb-0 last:border-b-0 border-b border-zinc-100/50 dark:border-zinc-800/20">
                              <div className="h-8 w-8 rounded-full overflow-hidden border border-brand-primary/10 bg-brand-cream shrink-0">
                                <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <p className="font-black text-brand-dark dark:text-brand-light">{comment.author}</p>
                                  <span className="text-[9px] text-zinc-400">Just now</span>
                                </div>
                                <p className="text-zinc-600 dark:text-brand-light/75 leading-relaxed font-medium">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick input field to append comments live */}
                      <div className="flex items-center gap-3 relative pt-1">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-brand-primary/15 bg-brand-cream shrink-0">
                          <img 
                            src={userAvatar}
                            alt={userDisplayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={activeCommentTexts[post.id] || ''}
                            onChange={(e) => setActiveCommentTexts({
                              ...activeCommentTexts,
                              [post.id]: e.target.value
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Write a warm comment..."
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-transparent pl-4 pr-12 py-2.5 text-xs text-brand-dark dark:text-brand-light placeholder-zinc-400 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 focus:outline-none"
                          />
                          <button 
                            onClick={() => handleAddComment(post.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-primary p-1 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* ================= COLUMN 3: Top Guardians / Active Leaders (3/12 cols) ================= */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Top Guardians Widget List exactly matches layout mockup */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200/60 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-black text-brand-dark dark:text-brand-light uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-amber-500" />
                  Top Guardians
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'g1', name: 'John M.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', rank: '🥇', xp: '2,840 XP', streak: '24d' },
                  { id: 'g2', name: 'Anna K.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', rank: '🥈', xp: '2,110 XP', streak: '18d' },
                  { id: 'g3', name: 'Priya S.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', rank: '🥉', xp: '1,950 XP', streak: '12d' }
                ].map((guardian, i) => (
                  <div key={guardian.id} className="flex items-center justify-between text-xs py-1 group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden border border-white dark:border-zinc-800 shrink-0 bg-brand-cream relative">
                        <img src={guardian.avatar} alt={guardian.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {i === 0 && (
                          <div className="absolute inset-0 border-2 border-amber-400 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-brand-dark dark:text-brand-light leading-snug">
                          {guardian.name}
                        </p>
                        <p className="text-[9px] text-brand-primary dark:text-amber-400 font-black uppercase tracking-wider mt-0.5">
                          {guardian.xp}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base block filter drop-shadow-sm leading-none mb-1">
                        {guardian.rank}
                      </span>
                      <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 justify-end">
                        <Flame className="h-3 w-3 fill-current" />
                        {guardian.streak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Leaderboard action */}
              <button 
                onClick={() => setShowLeaderboard(true)}
                className="w-full pt-3.5 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-center text-[10px] text-brand-muted dark:text-brand-light/60 hover:text-brand-primary dark:hover:text-brand-primary font-black uppercase tracking-widest block transition-colors duration-200"
              >
                View Leaderboard
              </button>
            </div>



          </div>

        </div>

      </div>

      {/* ================= REGISTER COLONY HIGH FIDELITY MODAL OVERLAY ================= */}
      <AnimatePresence>
        {showRegisterColony && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegisterColony(false)}
              className="absolute inset-0 bg-brand-dark/65 backdrop-blur-sm"
            />

            {/* Form dialog box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-lg font-black text-brand-dark dark:text-brand-light flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                  Register Feral Colony
                </h3>
                <button
                  onClick={() => setShowRegisterColony(false)}
                  className="text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-800 dark:text-white font-black text-base transition-colors h-7 w-7 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterColonySubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider block">
                    Colony Identifier / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={colonyName}
                    onChange={(e) => setColonyName(e.target.value)}
                    placeholder="e.g. Oak Street Alley Felines"
                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-transparent px-4 py-2.5 text-xs text-brand-dark dark:text-brand-light placeholder-zinc-400 focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider block">
                    Geographic Spot / Sector Location
                  </label>
                  <input
                    type="text"
                    required
                    value={colonyLocation}
                    onChange={(e) => setColonyLocation(e.target.value)}
                    placeholder="e.g. Behind Sector 4 Warehouse"
                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-transparent px-4 py-2.5 text-xs text-brand-dark dark:text-brand-light placeholder-zinc-400 focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider block">
                      Estimated Cat Count
                    </label>
                    <select
                      value={colonyCount}
                      onChange={(e) => setColonyCount(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-transparent px-4 py-2.5 text-xs text-brand-dark dark:text-brand-light focus:border-brand-primary focus:outline-none font-bold"
                    >
                      <option value="1-3">1 to 3 cats</option>
                      <option value="4-7">4 to 7 cats</option>
                      <option value="8-12">8 to 12 cats</option>
                      <option value="12+">More than 12 cats</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider block">
                      Registration Reward
                    </label>
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>+50 XP Points</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={colonySubmitted}
                  className="w-full mt-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover py-3 text-xs font-black text-white shadow-md disabled:opacity-50 transition-all uppercase tracking-wider"
                >
                  {colonySubmitted ? 'Registering Site...' : 'Confirm Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CITY LEADERBOARD HIGH FIDELITY MODAL OVERLAY ================= */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboard(false)}
              className="absolute inset-0 bg-brand-dark/65 backdrop-blur-sm"
            />

            {/* Dialog box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden z-10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-black text-brand-dark dark:text-brand-light flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  City Guardian League
                </h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-800 dark:text-white font-black text-base transition-colors h-7 w-7 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-brand-muted dark:text-brand-light/75 mb-4 leading-relaxed font-medium">
                Real-time regional rankings. Feed colonies, rescue strays, and upload verified updates to advance!
              </p>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                {[
                  { rank: 1, name: 'John M.', xp: '2,840 XP', streak: '24d', badges: ['🥇 First Responder', '🍼 Foster'], avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', self: false },
                  { rank: 2, name: 'Anna K.', xp: '2,110 XP', streak: '18d', badges: ['📍 Pro Spotter'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', self: false },
                  { rank: 3, name: 'Priya S.', xp: '1,950 XP', streak: '12d', badges: ['🥗 Feeder Elite'], avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', self: false },
                  { rank: 4, name: `${userDisplayName} (You)`, xp: `${userPoints} XP`, streak: '8d', badges: ['🥇 First Responder', '🍼 Foster'], avatar: userAvatar, self: true },
                  { rank: 5, name: 'Marcus L.', xp: '410 XP', streak: '3d', badges: ['🥗 Feeder'], avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', self: false }
                ].map((guardian) => (
                  <div
                    key={guardian.rank}
                    className={`flex items-center justify-between p-3 rounded-2xl text-xs transition-all ${
                      guardian.self 
                        ? 'bg-brand-primary/10 border border-brand-primary/20 shadow-inner' 
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 font-black text-center ${guardian.rank <= 3 ? 'text-amber-500 text-sm' : 'text-zinc-400'}`}>
                        {guardian.rank === 1 ? '🥇' : guardian.rank === 2 ? '🥈' : guardian.rank === 3 ? '🥉' : guardian.rank}
                      </span>
                      <img src={guardian.avatar} alt={guardian.name} className="h-8 w-8 rounded-full object-cover border border-white dark:border-brand-dark shadow-xs" />
                      <div>
                        <p className={`font-extrabold ${guardian.self ? 'text-brand-primary' : 'text-brand-dark dark:text-brand-light'}`}>
                          {guardian.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {guardian.badges.map((b, bIdx) => (
                            <span key={bIdx} className="text-[7px] font-bold bg-zinc-200/50 dark:bg-zinc-700/50 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-brand-dark dark:text-brand-light">{guardian.xp}</p>
                      <span className="text-[8px] text-amber-600 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                        <Flame className="h-2.5 w-2.5 fill-current" />
                        {guardian.streak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full mt-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 py-2.5 text-xs font-black text-brand-muted hover:bg-zinc-50 dark:hover:bg-zinc-50 dark:bg-zinc-800 transition-colors text-center uppercase tracking-wider"
              >
                Close Leaderboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
