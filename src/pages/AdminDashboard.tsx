import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, PawPrint, HeartHandshake, Home, LogOut,
  RefreshCw, Check, X, MapPin, Phone, ShieldCheck, AlertTriangle,
  IndianRupee, Download, ArrowUpRight, Receipt,
} from 'lucide-react';
import { downloadReceipt } from '../utils/receipt';
import Logo from '../components/Logo';

type Section = 'overview' | 'users' | 'cats' | 'adoptions' | 'fosters' | 'donations';

const token = () => localStorage.getItem('pawnet_token');
const adminFetch = (path: string, init?: RequestInit) =>
  fetch(`/api/admin${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(init?.headers || {}) },
  });

const fmtDate = (d?: string | number | Date) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtMoney = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

// Restrained, muted palette — one accent per meaning, no loud fills.
const sevColor = (k: string) => (k === 'critical' ? '#e11d48' : k === 'moderate' ? '#d97706' : '#059669');
const healthColor = (k: string) =>
  k === 'Injured' ? '#e11d48' : k === 'Sick' ? '#d97706' : k === 'Mother/Kittens' ? '#db2777' : '#059669';
const statusColor = (k: string) =>
  k === 'approved' ? '#059669' : k === 'rejected' ? '#e11d48' : k === 'reviewing' ? '#2563eb' : '#d97706';

const statusText: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  reviewing: 'text-blue-700 bg-blue-50 border-blue-200',
  approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  rejected: 'text-rose-700 bg-rose-50 border-rose-200',
};
const sevText: Record<string, string> = {
  critical: 'text-rose-700 bg-white/90 border-rose-200',
  moderate: 'text-amber-700 bg-white/90 border-amber-200',
  stable: 'text-emerald-700 bg-white/90 border-emerald-200',
};

const HEALTH_ORDER = ['Injured', 'Sick', 'Mother/Kittens', 'Healthy'];

const CARD = 'rounded-lg border border-zinc-200 bg-white';
const LABEL = 'text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('overview');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[] | null>(null);
  const [cats, setCats] = useState<any[] | null>(null);
  const [adoptions, setAdoptions] = useState<any[] | null>(null);
  const [fosters, setFosters] = useState<any[] | null>(null);
  const [donations, setDonations] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const admin = (() => { try { return JSON.parse(localStorage.getItem('pawnet_user') || '{}'); } catch { return {}; } })();

  const logout = () => {
    localStorage.removeItem('pawnet_token');
    localStorage.removeItem('pawnet_user');
    navigate('/login');
  };

  const load = async (which: Section, force = false) => {
    setError('');
    setLoading(true);
    try {
      const grab = async (path: string) => {
        const r = await adminFetch(path);
        if (r.status === 401 || r.status === 403) { logout(); throw new Error('unauthorized'); }
        return r.json();
      };
      if (which === 'overview' && (force || !stats)) setStats(await grab('/stats'));
      if (which === 'users' && (force || !users)) setUsers((await grab('/users')).users || []);
      if (which === 'cats' && (force || !cats)) setCats((await grab('/cats')).cats || []);
      if (which === 'adoptions' && (force || !adoptions)) setAdoptions((await grab('/adoptions')).adoptions || []);
      if (which === 'fosters' && (force || !fosters)) setFosters((await grab('/fosters')).fosters || []);
      if (which === 'donations' && (force || !donations)) setDonations(await grab('/donations'));
    } catch (e: any) {
      if (e?.message !== 'unauthorized') setError('Failed to load data. ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(section); /* eslint-disable-next-line */ }, [section]);

  const decideAdoption = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const r = await adminFetch(`/adoptions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (!r.ok) return;
      setAdoptions((prev) => (prev || []).map((a) => (a._id === id ? { ...a, status } : a)));
    } catch { /* ignore */ }
  };

  const navItems: { key: Section; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'cats', label: 'Reported Cats', icon: PawPrint },
    { key: 'adoptions', label: 'Adoption Requests', icon: HeartHandshake },
    { key: 'fosters', label: 'Fosters', icon: Home },
    { key: 'donations', label: 'Donations', icon: IndianRupee },
  ];
  const titleMap: Record<Section, string> = {
    overview: 'Overview', users: 'Users', cats: 'Reported Cats',
    adoptions: 'Adoption Requests', fosters: 'Fosters', donations: 'Donations',
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex font-grotesk">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-zinc-200 flex flex-col fixed inset-y-0 left-0 bg-white">
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-zinc-100">
          <Logo className="text-lg" />
          <span className="text-[10px] font-medium text-orange-500 tracking-[0.15em] uppercase border-l border-zinc-200 pl-2.5">Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((it) => {
            const active = section === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setSection(it.key)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${
                  active ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 font-medium'
                }`}
              >
                <it.icon className={`h-4 w-4 ${active ? 'text-orange-500' : 'text-zinc-400'}`} />
                {it.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-100">
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold">
              {(admin.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight">{admin.name || 'Admin'}</p>
              <p className="text-[11px] text-zinc-400 truncate">{admin.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60">
        <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 bg-white/80 backdrop-blur z-10">
          <h1 className="text-lg font-semibold tracking-tight">{titleMap[section]}</h1>
          <button onClick={() => load(section, true)} className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </header>

        <div className="p-8">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 text-rose-600 px-4 py-2.5 text-[13px]">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}
          {loading && !stats && section === 'overview' ? (
            <Loading />
          ) : (
            <>
              {section === 'overview' && <Overview stats={stats} />}
              {section === 'users' && <UsersTable users={users} loading={loading} />}
              {section === 'cats' && <CatsSection cats={cats} loading={loading} />}
              {section === 'adoptions' && <AdoptionsSection adoptions={adoptions} loading={loading} onDecide={decideAdoption} />}
              {section === 'fosters' && <FostersSection fosters={fosters} loading={loading} />}
              {section === 'donations' && <DonationsSection data={donations} loading={loading} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------------- charts ---------------- */
function Donut({ data, colorFor, centerValue, centerLabel }: {
  data: Record<string, number>; colorFor: (k: string) => string; centerValue: string | number; centerLabel: string;
}) {
  const entries = Object.entries(data || {}).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const r = 56, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-7">
      <div className="relative shrink-0">
        <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
          <circle cx="66" cy="66" r={r} fill="none" stroke="#f4f4f5" strokeWidth="10" />
          {total > 0 && entries.map(([k, v]) => {
            const len = (v / total) * C;
            const el = <circle key={k} cx="66" cy="66" r={r} fill="none" stroke={colorFor(k)} strokeWidth="10" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
            offset += len; return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{centerValue}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wide">{centerLabel}</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1">
        {entries.length === 0 && <p className="text-[13px] text-zinc-400">No data yet.</p>}
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 capitalize text-zinc-600">
              <span className="h-2 w-2 rounded-sm" style={{ background: colorFor(k) }} /> {k}
            </span>
            <span className="font-semibold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarBreakdown({ title, data, colorFor }: { title: string; data: Record<string, number>; colorFor: (k: string) => string }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div>
      <p className="text-[13px] font-semibold mb-4">{title}</p>
      {entries.length === 0 ? <p className="text-[13px] text-zinc-400">No data yet.</p> : (
        <div className="space-y-3">
          {entries.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="capitalize text-zinc-600">{k}</span><span className="text-zinc-400 tabular-nums">{v}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: colorFor(k) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- overview ---------------- */
function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-start justify-between">
        <p className={LABEL}>{label}</p>
        <Icon className="h-4 w-4 text-orange-400" />
      </div>
      <p className="text-[28px] leading-none font-semibold tabular-nums mt-4">{value ?? 0}</p>
    </div>
  );
}

function Overview({ stats }: { stats: any }) {
  if (!stats) return <p className="text-zinc-400 text-[13px]">No stats available.</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Total Users" value={stats.users?.total} icon={Users} />
        <Stat label="Volunteers" value={stats.users?.volunteers} icon={HeartHandshake} />
        <Stat label="Fosters" value={stats.users?.fosters} icon={Home} />
        <Stat label="Reported Cats" value={stats.cats?.total} icon={PawPrint} />
        <Stat label="Total Raised" value={fmtMoney(stats.donations?.total)} icon={IndianRupee} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${CARD} p-6`}>
          <p className="text-[13px] font-semibold mb-5">Cats by Severity</p>
          <Donut data={stats.cats?.bySeverity || {}} colorFor={sevColor} centerValue={stats.cats?.total || 0} centerLabel="Cats" />
        </div>
        <div className={`${CARD} p-6`}><BarBreakdown title="Cats by Health" data={stats.cats?.byHealth || {}} colorFor={healthColor} /></div>
        <div className={`${CARD} p-6`}><BarBreakdown title="Adoptions by Status" data={stats.adoptions?.byStatus || {}} colorFor={statusColor} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${CARD} p-5 md:col-span-2 flex items-center gap-4`}>
          <div className="h-9 w-9 rounded-md bg-orange-500 text-white flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{stats.users?.newThisWeek || 0} new users</p>
            <p className="text-[13px] text-zinc-500">joined in the last 7 days</p>
          </div>
        </div>
        <div className={`${CARD} p-5 flex items-center gap-4`}>
          <div className="h-9 w-9 rounded-md border border-zinc-200 text-zinc-500 flex items-center justify-center"><Receipt className="h-4 w-4" /></div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{stats.donations?.count || 0}</p>
            <p className="text-[13px] text-zinc-500">total donations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const TH = `px-5 py-3 ${LABEL} text-left`;

/* ---------------- users ---------------- */
function UsersTable({ users, loading }: { users: any[] | null; loading: boolean }) {
  if (loading && !users) return <Loading />;
  if (!users?.length) return <Empty label="No registered users yet." />;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <table className="w-full text-[13px]">
        <thead><tr className="border-b border-zinc-100">{['Name', 'Email', 'Role', 'Phone', 'City', 'Joined'].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
              <td className="px-5 py-3 font-medium">{u.name}</td>
              <td className="px-5 py-3 text-zinc-500">{u.email}</td>
              <td className="px-5 py-3"><span className="rounded border border-zinc-200 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-600">{u.role}</span></td>
              <td className="px-5 py-3 text-zinc-500">{u.phone || '—'}</td>
              <td className="px-5 py-3 text-zinc-500">{u.location?.city || '—'}</td>
              <td className="px-5 py-3 text-zinc-500">{fmtDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- cats ---------------- */
function CatsSection({ cats, loading }: { cats: any[] | null; loading: boolean }) {
  if (loading && !cats) return <Loading />;
  if (!cats?.length) return <Empty label="No cats have been reported yet." />;
  const groups: Record<string, any[]> = {};
  cats.forEach((c) => { const k = c.healthStatus || 'Healthy'; (groups[k] = groups[k] || []).push(c); });
  const keys = [...HEALTH_ORDER.filter((k) => groups[k]), ...Object.keys(groups).filter((k) => !HEALTH_ORDER.includes(k))];
  return (
    <div className="space-y-9">
      {keys.map((key) => (
        <div key={key}>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-sm" style={{ background: healthColor(key) }} />
            <h3 className="text-[13px] font-semibold">{key}</h3>
            <span className="text-[11px] text-zinc-400 tabular-nums">({groups[key].length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups[key].map((c) => (
              <div key={c._id} className={`${CARD} overflow-hidden hover:border-zinc-300 transition-colors`}>
                <div className="relative h-36 w-full overflow-hidden bg-zinc-100">
                  <img src={c.photos?.[0] || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=500'} alt={c.name} className="h-full w-full object-cover" />
                  <span className={`absolute top-2.5 right-2.5 rounded border px-2 py-0.5 text-[10px] font-medium capitalize backdrop-blur ${sevText[c.severity] || 'bg-white/90 text-zinc-600 border-zinc-200'}`}>{c.severity}</span>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-[14px] truncate">{c.name || 'Unnamed Stray'}</p>
                  <p className="text-[12px] text-zinc-500 line-clamp-2 mt-1 min-h-[2.2rem]">{c.condition || c.aiSeverityReason || 'No description provided.'}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {c.location?.city || c.location?.address || 'Unknown'}</span>
                    <span className="shrink-0">{fmtDate(c.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- adoptions ---------------- */
function AdoptionsSection({ adoptions, loading, onDecide }: {
  adoptions: any[] | null; loading: boolean; onDecide: (id: string, s: 'approved' | 'rejected') => void;
}) {
  if (loading && !adoptions) return <Loading />;
  if (!adoptions?.length) return <Empty label="No adoption requests yet." />;
  return (
    <div className="space-y-3">
      {adoptions.map((a) => (
        <div key={a._id} className={`${CARD} p-4 flex flex-col md:flex-row md:items-center gap-4`}>
          <img src={a.catId?.photos?.[0] || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&q=80&w=200'} alt={a.catId?.name} className="h-14 w-14 rounded-md object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[14px]">{a.adopterName} <span className="text-zinc-400 font-normal">→ {a.catId?.name || 'a cat'}</span></p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-zinc-500 mt-1">
              <span>{a.adopterEmail}</span>
              {a.adopterPhone && <span>{a.adopterPhone}</span>}
              <span>{a.experienceLevel === 'yes' ? 'Experienced' : 'First-time owner'}</span>
              <span>{fmtDate(a.createdAt)}</span>
            </div>
            {a.message && <p className="text-[12px] italic text-zinc-400 mt-1">"{a.message}"</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`rounded border px-2 py-0.5 text-[11px] font-medium capitalize ${statusText[a.status] || 'border-zinc-200 text-zinc-500'}`}>{a.status}</span>
            {(a.status === 'pending' || a.status === 'reviewing') && (
              <>
                <button onClick={() => onDecide(a._id, 'approved')} className="flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-orange-600"><Check className="h-3.5 w-3.5" /> Approve</button>
                <button onClick={() => onDecide(a._id, 'rejected')} className="flex items-center gap-1 rounded-md border border-zinc-200 px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50"><X className="h-3.5 w-3.5" /> Reject</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- fosters ---------------- */
function FostersSection({ fosters, loading }: { fosters: any[] | null; loading: boolean }) {
  if (loading && !fosters) return <Loading />;
  if (!fosters?.length) return <Empty label="No fosters registered yet." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {fosters.map((f) => (
        <div key={f._id} className={`${CARD} p-5 hover:border-zinc-300 transition-colors`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-semibold">{(f.name || 'F').charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="font-semibold text-[14px] truncate">{f.name}</p>
              <p className="text-[12px] text-zinc-400 truncate">{f.email}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-[12px] text-zinc-500">
            <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-zinc-400" /> {f.phone || 'No phone'}</p>
            <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-zinc-400" /> {f.location?.city || 'Location not set'}</p>
            <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-zinc-400" /> ~{f.availability || '—'} hrs/week</p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {(f.volunteerRoles || []).map((r: string) => (
              <span key={r} className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-600">{r}</span>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Joined {fmtDate(f.createdAt)}</span>
            <span className={f.showOnMap ? 'text-emerald-600 font-medium' : 'text-zinc-400'}>{f.showOnMap ? 'On map' : 'Hidden'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- donations ---------------- */
function DonationsSection({ data, loading }: { data: any | null; loading: boolean }) {
  const [selected, setSelected] = useState<any | null>(null);
  if (loading && !data) return <Loading />;
  const donations: any[] = data?.donations || [];
  if (!donations.length) return <Empty label="No donations received yet." />;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
        <Stat label="Total Raised" value={fmtMoney(data.totalAmount)} icon={IndianRupee} />
        <Stat label="Donations" value={data.count} icon={Receipt} />
        <Stat label="Average Gift" value={fmtMoney(Math.round((data.totalAmount || 0) / (data.count || 1)))} icon={ArrowUpRight} />
      </div>
      <div className={`${CARD} overflow-hidden`}>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-zinc-100">{['Donor', 'Amount', 'Transaction ID', 'Date', ''].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d._id || d.transactionId} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 cursor-pointer" onClick={() => setSelected(d)}>
                <td className="px-5 py-3"><p className="font-medium">{d.donorName}</p><p className="text-[11px] text-zinc-400">{d.donorEmail}</p></td>
                <td className="px-5 py-3 font-semibold tabular-nums">{fmtMoney(d.amount)}</td>
                <td className="px-5 py-3 text-zinc-500 font-mono text-[11px]">{d.transactionId}</td>
                <td className="px-5 py-3 text-zinc-500">{fmtDate(d.date)}</td>
                <td className="px-5 py-3 text-right text-orange-400"><ArrowUpRight className="h-4 w-4 inline" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DonationModal donation={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function DonationModal({ donation, onClose }: { donation: any; onClose: () => void }) {
  const rows: [string, string][] = [
    ['Donor Name', donation.donorName || 'Anonymous'],
    ['Donor Email', donation.donorEmail || 'N/A'],
    ['Transaction ID', donation.transactionId],
    ['Billing Address', donation.address || 'N/A'],
    ['Date', new Date(donation.date).toLocaleString()],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-grotesk" onClick={onClose}>
      <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-lg bg-white border border-zinc-200 shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-5 border-b border-zinc-100">
          <div className="flex items-start justify-between">
            <div>
              <p className={LABEL}>Donation</p>
              <p className="text-3xl font-semibold tabular-nums mt-2">{fmtMoney(donation.amount)}</p>
            </div>
            <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-[13px]">
              <span className="text-zinc-400">{k}</span>
              <span className="text-right font-medium break-all">{v}</span>
            </div>
          ))}
          <button
            onClick={() => downloadReceipt(
              { amount: donation.amount, transactionId: donation.transactionId, address: donation.address, date: donation.date },
              { name: donation.donorName, email: donation.donorEmail }
            )}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-md bg-orange-500 py-2.5 text-[13px] font-medium text-white hover:bg-orange-600 transition-colors"
          >
            <Download className="h-4 w-4" /> Download Receipt PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared ---------------- */
function Empty({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-zinc-200 py-16 text-center text-zinc-400 text-[13px]">{label}</div>;
}
function Loading() {
  return <p className="text-zinc-400 text-[13px]">Loading…</p>;
}
