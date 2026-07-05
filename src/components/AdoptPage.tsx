import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, CheckCircle2, Heart, HeartOff, Mail, Phone, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { StrayCat } from '../types';

export default function AdoptPage() {
  const [cats, setCats] = useState<StrayCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<StrayCat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'stray' | 'rehoming'>('stray');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/cats');
        if (res.ok) {
          const data = await res.json();
          const adoptable = data.cats.map((cat: any) => ({
            id: cat._id,
            name: cat.name || 'Unnamed Stray',
            age: cat.estimatedAge || 'Adult',
            breed: cat.colorMarkings || 'Mixed Breed',
            gender: 'Male', // Mocked as DB schema doesn't have gender
            status: cat.severity === 'critical' ? 'Urgent' : cat.status === 'ready_for_adoption' ? 'Fostered' : 'Stable',
            image: cat.photos?.[0] || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=800',
            description: cat.aiSeverityReason || cat.condition || 'Needs a loving home.',
            location: cat.location?.address || 'Unknown',
            reportedAt: new Date(cat.createdAt).toLocaleDateString(),
            tags: cat.tags || [cat.healthStatus],
          }));
          setCats(adoptable);
        }
      } catch (err) {
        console.error('Failed to fetch cats for adoption', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMyInquiries = async () => {
      const token = localStorage.getItem('pawnet_token');
      if (token) {
        try {
          const res = await fetch('/api/adoptions/my-inquiries', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setMyInquiries(await res.json());
          }
        } catch (err) {}
      }
    };

    fetchCats();
    fetchMyInquiries();
  }, []);

  // Inquiry Form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userExperience, setUserExperience] = useState('yes');
  const [userMessage, setUserMessage] = useState('');

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Get unique tags across all cats to use as filter pills
  const allTags = Array.from(
    new Set(cats.flatMap((cat) => cat.tags))
  ).slice(0, 6);

  const filteredCats = cats.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || cat.tags.includes(selectedTag);
    
    // Categorization: stray are Urgent/Stable/reported ones. Rehoming are Fostered/Adopted ones.
    const isStray = cat.status === 'Urgent' || cat.status === 'Stable' || cat.id.startsWith('reported');
    const matchesCategory = categoryFilter === 'stray' ? isStray : !isStray;

    return matchesSearch && matchesTag && matchesCategory;
  });

  // Calculate items per page based on view split
  const ITEMS_PER_PAGE = selectedCat ? 6 : 8;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCats = filteredCats.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredCats.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTag, categoryFilter]);

  // Handle selected cat reset if category changes and the selected cat is filtered out
  useEffect(() => {
    if (selectedCat && !filteredCats.some(c => c.id === selectedCat.id)) {
      setSelectedCat(null);
    }
  }, [categoryFilter, filteredCats, selectedCat]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || !selectedCat) return;
    
    try {
      const res = await fetch('/api/adoptions/inquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('pawnet_token') ? { 'Authorization': `Bearer ${localStorage.getItem('pawnet_token')}` } : {})
        },
        body: JSON.stringify({
          catId: selectedCat.id,
          adopterName: userName,
          adopterEmail: userEmail,
          adopterPhone: userPhone,
          experienceLevel: userExperience,
          message: userMessage
        })
      });

      if (res.ok) {
        setInquirySubmitted(true);
        setMyInquiries(prev => {
          // If overriding, it's fine to just push again for UI purposes
          return [...prev, { catId: { _id: selectedCat.id } }];
        });
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again later.');
    }
  };

  const handleResetInquiry = () => {
    setInquirySubmitted(false);
    setSelectedCat(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserMessage('');
    setUserExperience('yes');
  };

  return (
    <div id="adopt-view-container" className="bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen pb-16 transition-colors duration-300">
      
      {/* ================= HERO TEXT BLOCK BANNER ================= */}
      <section className="relative overflow-hidden pt-28 pb-8 px-8 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 dark:opacity-5 pointer-events-none bg-[url('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center" />
        <div className="relative z-10 max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1 bg-[#FDF2EC] dark:bg-brand-primary/10 text-brand-primary dark:text-brand-primary-hover px-3 py-1 text-xs font-extrabold tracking-wider uppercase">
            Adoption Portal
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
            Find Your <br />
            <span className="text-brand-primary">Purr-fect Companion.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium max-w-2xl">
            Browse our rescue gallery and find a furry friend ready for their forever home. 
            Every adoption saves a life, gives a second chance, and opens a cage for another animal in need.
          </p>
        </div>
      </section>

      {/* ================= CONTROLS & FILTERING ROW ================= */}
      <div className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 mb-8 px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, breed, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-10 pr-4 py-3 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none transition-all font-semibold"
              />
            </div>

            {/* Stray Cat Rescue | Rehoming Toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 select-none self-start md:self-auto shrink-0">
              <button
                onClick={() => setCategoryFilter('stray')}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  categoryFilter === 'stray'
                    ? 'bg-brand-primary text-zinc-800 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Stray Cat Rescue
              </button>
              <button
                onClick={() => setCategoryFilter('rehoming')}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  categoryFilter === 'rehoming'
                    ? 'bg-brand-primary text-zinc-800 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Rehoming
              </button>
            </div>
          </div>

          {/* Tags list */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mr-2">Filter tags:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                !selectedTag
                  ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PRIMARY GRID & SIDE-PANEL LAYOUT ================= */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start relative">
          
          {/* Left Column: Gallery List */}
          <div className={`transition-all duration-500 ${
            selectedCat 
              ? 'w-full md:w-[58%] lg:w-[62%]' 
              : 'w-full'
          } ${selectedCat ? 'hidden md:block' : 'block'}`}>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-zinc-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mb-4"></div>
                <p>Loading available cats...</p>
              </div>
            ) : filteredCats.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-16 text-center">
                <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
                  <HeartOff className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No cats match your filters</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTag(null);
                  }}
                  className="text-xs font-bold text-brand-primary hover:underline mt-1.5 cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 transition-all duration-500 ${
                selectedCat 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' 
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {paginatedCats.map((cat) => (
                  <motion.div
                    key={cat.id}
                    layoutId={`adopt-card-${cat.id}`}
                    onClick={() => setSelectedCat(cat)}
                    className={`group cursor-pointer overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border transition-all flex flex-col hover:shadow-md ${
                      selectedCat?.id === cat.id
                        ? 'border-brand-primary ring-2 ring-brand-primary/20 z-10'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-brand-primary/50'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        onClick={(e) => toggleFavorite(cat.id, e)}
                        className="absolute right-3 top-3 bg-white/90 dark:bg-zinc-900/90 p-1.5 backdrop-blur-sm text-brand-primary hover:bg-white dark:hover:bg-zinc-850 hover:scale-105 transition-all cursor-pointer z-10 border border-zinc-200 dark:border-zinc-700"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.includes(cat.id) ? 'fill-brand-primary' : ''
                          }`}
                        />
                      </button>
                      {cat.status === 'Urgent' && (
                        <span className="absolute left-3 top-3 bg-red-500 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-brand-primary transition-colors text-sm">
                            {cat.name}
                          </h4>
                          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">{cat.age}</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{cat.breed}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-4">
                        {cat.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-4 px-6 flex items-center justify-center gap-2 shadow-sm select-none">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-brand-primary text-zinc-800 dark:text-white shadow-md'
                        : 'border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Inquiry/Form Panel */}
          <AnimatePresence>
            {selectedCat && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 150 }}
                className="w-full md:w-[42%] lg:w-[38%] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden shrink-0 self-start sticky top-24"
              >
                <div className="w-full flex flex-col relative">
                  
                  {/* Deselect Cat Button */}
                  <button
                    onClick={() => setSelectedCat(null)}
                    className="absolute right-4 top-4 z-10 p-2 bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-xs cursor-pointer border border-zinc-600"
                    aria-label="Back to gallery"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Cat Detail Hero */}
                  <div className="relative aspect-video w-full bg-zinc-50 dark:bg-zinc-950 shrink-0">
                    <img src={selectedCat.image} alt={selectedCat.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-zinc-800 dark:text-white">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-xl font-extrabold tracking-tight">{selectedCat.name}</h3>
                        <span className="bg-white/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-md">
                          {selectedCat.gender}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-800 dark:text-white/85 mt-1 font-medium">{selectedCat.breed} • {selectedCat.age}</p>
                    </div>
                  </div>

                  {/* Cat Info & Details */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1.5">About Me</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{selectedCat.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 dark:border-zinc-800 py-4 bg-zinc-50 dark:bg-zinc-950 px-4">
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Shelter Location</span>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1">{selectedCat.location}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Reported Date</span>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1">{selectedCat.reportedAt}</p>
                      </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="space-y-4">
                      <div className="border-t border-zinc-150 dark:border-zinc-800 pt-5">
                        <h4 className="font-heading text-sm font-black text-zinc-800 dark:text-zinc-100">Send Adoption Inquiry</h4>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">Start your matching journey. It is completely non-binding!</p>
                      </div>

                      {myInquiries.some(inq => inq.catId?._id === selectedCat.id) && !inquirySubmitted && (
                        <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3 text-xs text-brand-primary font-medium">
                          <strong>Note:</strong> You have already submitted an application for {selectedCat.name}. Submitting this form again will override your previous application.
                        </div>
                      )}

                      {inquirySubmitted ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 text-center space-y-3"
                        >
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h5 className="font-heading text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Inquiry Submitted!</h5>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                              We received your request for <strong>{selectedCat.name}</strong>. A matching manager will contact you within 24 hours.
                            </p>
                          </div>
                          <button
                            onClick={handleResetInquiry}
                            className="text-xs font-black text-brand-primary hover:underline uppercase tracking-wider text-[10px] cursor-pointer"
                          >
                            Inquire about another cat
                          </button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleInquirySubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Your Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Emma Watson"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <input
                                  type="email"
                                  required
                                  placeholder="emma@example.com"
                                  value={userEmail}
                                  onChange={(e) => setUserEmail(e.target.value)}
                                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 pl-9 pr-3 py-2 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all font-semibold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Phone</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <input
                                  type="tel"
                                  placeholder="(555) 0192"
                                  value={userPhone}
                                  onChange={(e) => setUserPhone(e.target.value)}
                                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 pl-9 pr-3 py-2 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all font-semibold"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Do you have cat experience?</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setUserExperience('yes')}
                                className={`rounded-xl py-2 text-xs font-bold border transition-all cursor-pointer ${
                                  userExperience === 'yes'
                                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary font-black'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                              >
                                Yes, experienced
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserExperience('no')}
                                className={`rounded-xl py-2 text-xs font-bold border transition-all cursor-pointer ${
                                  userExperience === 'no'
                                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary font-black'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                              >
                                First-time owner
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Message (optional)</label>
                            <textarea
                              rows={2}
                              placeholder="Tell us a little about your home environment..."
                              value={userMessage}
                              onChange={(e) => setUserMessage(e.target.value)}
                              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20 transition-all font-semibold resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-brand-primary py-3 font-extrabold uppercase tracking-widest text-white text-[10px] hover:bg-brand-primary-hover shadow-md shadow-brand-primary/10 transition-colors cursor-pointer"
                          >
                            Submit Adoption Inquiry
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
