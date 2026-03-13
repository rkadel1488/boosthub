import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  increment, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  Youtube, 
  Coins, 
  PlusCircle, 
  Play, 
  MessageSquare, 
  UserPlus, 
  LayoutDashboard, 
  Clock, 
  AlertCircle, 
  Ticket, 
  Trophy, 
  LogOut, 
  Mail, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight,
  Gift,
  X,
  ExternalLink,
  Info,
  User,
  FlaskConical,
  Lock
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyB742guS0SiWChgUjPt_5of8eRLp0_WW4k",
  authDomain: "boosthub-b7756.firebaseapp.com",
  projectId: "boosthub-b7756",
  storageBucket: "boosthub-b7756.firebasestorage.app",
  messagingSenderId: "505252196645",
  appId: "1:505252196645:web:2b37bc00d280fa34b12acc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'yt-points-production';

const MULTIPLIERS = {
  'watch-time': 1,
  'comments': 2,
  'subscribers': 3
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [profile, setProfile] = useState({ points: 0, hasClaimedBonus: true });
  const [videos, setVideos] = useState([]);
  const [view, setView] = useState('watch-time');
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScratch, setShowScratch] = useState(false);
  const [showMonthlyToast, setShowMonthlyToast] = useState(false);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            // Fallback for environment project mismatch
            if (tokenErr.code === 'auth/custom-token-mismatch' || tokenErr.code === 'auth/invalid-custom-token') {
              await signInAnonymously(auth);
            } else {
              throw tokenErr;
            }
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Video Content Listener
  useEffect(() => {
    if (!user || isDemoMode) return;

    const videosCol = collection(db, 'artifacts', appId, 'public', 'data', 'videos');
    const unsubVideos = onSnapshot(videosCol, (snapshot) => {
      const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(vids);
    }, (err) => {
      console.error("Video listener error:", err);
      if (err.code === 'permission-denied') setPermissionError(true);
    });
    
    return () => unsubVideos();
  }, [user, isDemoMode]);

  // User Profile & Points Listener
  useEffect(() => {
    if (isDemoMode) {
      setProfile({ points: 5000, hasClaimedBonus: true, email: 'demo@example.com' });
      return;
    }
    
    if (!user) {
      setProfile({ points: 0, hasClaimedBonus: true });
      return;
    }

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    
    const unsubUser = onSnapshot(userDocRef, async (docSnap) => {
      const now = new Date();
      const currentMonthKey = `${now.getMonth() + 1}-${now.getFullYear()}`;

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (data.hasClaimedBonus === false) setShowScratch(true);
        if (data.lastBonusMonth !== currentMonthKey) {
          await updateDoc(userDocRef, { points: increment(1000), lastBonusMonth: currentMonthKey });
          setShowMonthlyToast(true);
        }
      } else {
        // Initialize new user profile with 1000 starting points
        await setDoc(userDocRef, {
          points: 1000,
          uid: user.uid,
          hasClaimedBonus: false,
          joinDate: Date.now(),
          lastBonusMonth: currentMonthKey, 
          email: user.email || 'Guest User'
        });
      }
    }, (err) => {
      console.error("Profile permission error:", err);
      if (err.code === 'permission-denied') setPermissionError(true);
    });

    return () => unsubUser();
  }, [user, isDemoMode]);

  const handleLogout = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setUser(null);
      setPermissionError(false);
    } else {
      signOut(auth);
    }
  };

  const handleEarnPoints = async (amount) => {
    if (isDemoMode) {
      setProfile(prev => ({ ...prev, points: prev.points + amount }));
      return;
    }
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await updateDoc(userDocRef, { points: increment(amount) });
  };

  const handleEnterDemo = () => {
    setIsDemoMode(true);
    setPermissionError(false);
    setUser({ uid: 'demo-user', email: 'demo@boosthub.local' });
    setVideos([
      { id: 'd1', youtubeId: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', campaignType: 'watch-time', multiplier: 1, watchSeconds: 60, remainingViews: 5, originalViews: 10, ownerId: 'other' },
      { id: 'd2', youtubeId: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE', campaignType: 'comments', multiplier: 2, watchSeconds: 45, remainingViews: 12, originalViews: 20, ownerId: 'other' }
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Handle Firebase permission errors (likely due to rules not being set in Console)
  if (permissionError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Permissions Required</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Firebase Firestore Rules are currently blocking access. Please update your Rules in the Firebase Console to enable data saving.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleEnterDemo}
              className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
            >
              Continue in Demo Mode
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              Refresh After Fixing Rules
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <LoginScreen auth={auth} onDemo={handleEnterDemo} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      {isDemoMode && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center flex items-center justify-center gap-2">
          <FlaskConical className="w-4 h-4 text-yellow-500" />
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Demo Mode Active (No Cloud Saving)</span>
        </div>
      )}
      
      {showScratch && <ScratchModal onClaim={(p) => { 
        if (isDemoMode) { 
          setProfile(prev => ({...prev, points: prev.points + p, hasClaimedBonus: true})); 
          setShowScratch(false); 
        }
        else handleEarnPoints(p).then(() => {
          const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
          updateDoc(userDocRef, { hasClaimedBonus: true });
          setShowScratch(false);
        });
      }} />}
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('watch-time')}>
            <div className="bg-gradient-to-br from-red-500 to-rose-700 p-1.5 rounded-xl shadow-lg">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg italic uppercase text-white">BoostHub</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700/50">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-sm text-yellow-400 tabular-nums">{profile.points?.toLocaleString()}</span>
            </div>
            <button onClick={() => setView('dashboard')} className={`p-2 rounded-xl transition-all ${view === 'dashboard' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* Main Category Filter & Post Action */}
      {['watch-time', 'comments', 'subscribers'].includes(view) && (
        <div className="bg-slate-900/30 border-b border-slate-800/50 sticky top-[65px] z-40 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 py-2 overflow-x-auto no-scrollbar">
            <NavBtn active={view === 'watch-time'} onClick={() => setView('watch-time')} icon={<Clock className="w-4 h-4" />} label="Watch" multiplier={1} />
            <NavBtn active={view === 'comments'} onClick={() => setView('comments')} icon={<MessageSquare className="w-4 h-4" />} label="Comments" multiplier={2} />
            <NavBtn active={view === 'subscribers'} onClick={() => setView('subscribers')} icon={<UserPlus className="w-4 h-4" />} label="Subs" multiplier={3} />
            <div className="flex-grow"></div>
            <button onClick={() => setView('post')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-600/20 whitespace-nowrap">
              <PlusCircle className="w-4 h-4" /> CREATE
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
        {['watch-time', 'comments', 'subscribers'].includes(view) && (
          <VideoFeed type={view} videos={videos.filter(v => v.remainingViews > 0 && (v.campaignType === view || (!v.campaignType && view === 'watch-time')))} onSelect={(vid) => { setActiveVideo(vid); setView('watch'); }} />
        )}
        {view === 'watch' && activeVideo && (
          <WatchArea video={activeVideo} isDemoMode={isDemoMode} onComplete={handleEarnPoints} onBack={() => setView(activeVideo.campaignType || 'watch-time')} />
        )}
        {view === 'post' && <PostVideo points={profile.points} userId={user?.uid} isDemoMode={isDemoMode} onSuccess={() => setView('dashboard')} />}
        {view === 'dashboard' && <Dashboard userId={user?.uid} videos={videos.filter(v => v.ownerId === user?.uid)} points={profile.points} onBoost={() => setView('post')} />}
      </main>
    </div>
  );
};

// --- AUTH COMPONENTS ---
const LoginScreen = ({ auth, onDemo }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') setError('Enable providers in Firebase Console.');
      else setError(err.message);
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); }
    catch (err) { setError('Enable Anonymous Auth in Firebase Console.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="max-w-md w-full relative z-10 space-y-6">
        <div className="text-center">
          <Youtube className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-black italic uppercase text-white">BoostHub</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Creator Exchange Network</p>
        </div>
        <form onSubmit={handleEmailAuth} className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-sm space-y-4">
          <h2 className="text-2xl font-black italic uppercase text-white">{isSignup ? 'Sign Up' : 'Log In'}</h2>
          <input type="email" placeholder="Email" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-white outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : (isSignup ? 'JOIN NOW' : 'LOG IN')}
          </button>
          <div className="pt-4 flex flex-col items-center gap-4">
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isSignup ? 'Back to Login' : 'Create Account'}</button>
            <div className="flex items-center gap-2 w-full"><div className="h-[1px] bg-slate-800 flex-grow"></div><span className="text-[8px] text-slate-600">OR</span><div className="h-[1px] bg-slate-800 flex-grow"></div></div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button type="button" onClick={handleGuest} className="bg-slate-800 text-slate-300 py-3 rounded-2xl font-bold text-xs">Guest</button>
              <button type="button" onClick={onDemo} className="bg-slate-800 text-yellow-500 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"><FlaskConical className="w-4 h-4" />Demo</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const NavBtn = ({ active, onClick, icon, label, multiplier }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${active ? 'text-white bg-red-500/10 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
    {icon} <span>{label}</span>
    {multiplier && <span className="ml-1 text-[8px] opacity-50">{multiplier}x</span>}
  </button>
);

const VideoFeed = ({ type, videos, onSelect }) => (
  <div className="space-y-6">
    <div className="flex items-baseline gap-2">
      <h2 className="text-2xl font-black italic uppercase text-white">{type.split('-')[0]} To Earn</h2>
      <span className="text-slate-500 text-xs font-bold uppercase">{MULTIPLIERS[type]}x Points Multiplier</span>
    </div>
    {videos.length === 0 ? (
      <div className="py-20 text-center bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 text-slate-600 uppercase font-black text-xs tracking-widest">No active campaigns</div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(vid => (
          <div key={vid.id} onClick={() => onSelect(vid)} className="bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 hover:border-red-500/50 transition-all cursor-pointer group shadow-xl">
            <div className="aspect-video relative overflow-hidden">
              <img src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
            </div>
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-white text-sm line-clamp-2 h-10">{vid.title}</h3>
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className="text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  +{vid.watchSeconds * (vid.multiplier || MULTIPLIERS[vid.campaignType] || 1)} PTS
                </span>
                <span className="text-slate-500 uppercase tracking-widest">{vid.remainingViews} LEFT</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const WatchArea = ({ video, isDemoMode, onComplete, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(video.watchSeconds);
  const [done, setDone] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [activeTab, setActiveTab] = useState('embed');
  
  const multiplier = video.multiplier || MULTIPLIERS[video.campaignType] || 1;
  const reward = video.watchSeconds * multiplier;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timer); setDone(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaim = async () => {
    if (!done || claimed) return;
    setClaimed(true);
    await onComplete(reward);
    
    // Automation: Update count and delete if empty
    if (!isDemoMode) {
      const vidRef = doc(db, 'artifacts', appId, 'public', 'data', 'videos', video.id);
      const vidDoc = await getDoc(vidRef);
      if (vidDoc.exists()) {
        const remaining = vidDoc.data().remainingViews;
        if (remaining <= 1) await deleteDoc(vidRef);
        else await updateDoc(vidRef, { remainingViews: increment(-1) });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-white font-black text-xs uppercase">&larr; Back</button>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setActiveTab('embed')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${activeTab === 'embed' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>In-App</button>
          <button onClick={() => setActiveTab('external')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${activeTab === 'external' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>External Mode</button>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="aspect-video bg-black flex items-center justify-center">
          {activeTab === 'embed' ? (
            <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`} allowFullScreen title="Video"></iframe>
          ) : (
            <div className="text-center p-8 space-y-6">
              <Youtube className="w-16 h-16 text-red-500 mx-auto" />
              <p className="text-slate-400 text-sm font-bold">Open video to watch, then return to claim.</p>
              <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener" className="inline-block bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-sm uppercase">Open in YouTube</a>
            </div>
          )}
        </div>
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">{video.title}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{video.campaignType || 'watch-time'} • {multiplier}x Bonus</p>
          </div>
          <div className="min-w-[200px]">
            {!done ? (
              <div className="text-center p-6 bg-slate-950 border border-slate-800 rounded-3xl text-red-500 font-black text-2xl">{timeLeft}s</div>
            ) : (
              <button onClick={handleClaim} disabled={claimed} className={`w-full py-6 rounded-3xl font-black text-xl shadow-2xl transition-all active:scale-95 ${claimed ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white text-slate-950'}`}>
                {claimed ? 'CLAIMED' : `CLAIM ${reward} PTS`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PostVideo = ({ points, userId, isDemoMode, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [campaignType, setCampaignType] = useState('watch-time');
  const [watchSeconds, setWatchSeconds] = useState(45);
  const [views, setViews] = useState(10);
  const [loading, setLoading] = useState(false);
  
  const currentMultiplier = MULTIPLIERS[campaignType];
  const total = watchSeconds * views * currentMultiplier;

  const handlePost = async () => {
    const ytId = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
    if (!ytId || total > points) return;
    setLoading(true);
    try {
      if (!isDemoMode) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data'), { points: increment(-total) });
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'videos'), { 
          youtubeId: ytId, 
          title: `Boost Campaign ${ytId}`, 
          campaignType, 
          multiplier: currentMultiplier,
          watchSeconds, 
          remainingViews: views, 
          originalViews: views, 
          ownerId: userId, 
          createdAt: Date.now() 
        });
      }
      onSuccess();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-8">
      <h2 className="text-3xl font-black italic uppercase text-white">Promote Video</h2>
      
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-slate-500 pl-2">Promotion Goal</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(MULTIPLIERS).map(type => (
            <button
              key={type}
              onClick={() => setCampaignType(type)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${campaignType === type ? 'bg-red-500/10 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
            >
              {type === 'watch-time' && <Clock className="w-4 h-4" />}
              {type === 'comments' && <MessageSquare className="w-4 h-4" />}
              {type === 'subscribers' && <UserPlus className="w-4 h-4" />}
              <span className="text-[8px] font-black uppercase">{type.split('-')[0]} ({MULTIPLIERS[type]}x)</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-slate-500 pl-2">YouTube URL</label>
        <input type="text" placeholder="https://youtube.com/watch?v=..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-red-500/50" value={url} onChange={e => setUrl(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 pl-2">Duration (Sec)</label>
          <input type="number" min="45" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-black" value={watchSeconds} onChange={e => setWatchSeconds(parseInt(e.target.value) || 45)} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 pl-2">Total Views</label>
          <input type="number" min="1" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-black" value={views} onChange={e => setViews(parseInt(e.target.value) || 1)} />
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase text-slate-500">Total Investment</span>
        <span className={`text-2xl font-black ${total > points ? 'text-red-500' : 'text-yellow-400'}`}>{total.toLocaleString()} PTS</span>
      </div>

      <button onClick={handlePost} disabled={loading || total > points || !url} className="w-full bg-red-600 py-6 rounded-2xl font-black text-xl uppercase italic shadow-2xl active:scale-95 disabled:opacity-20">
        {loading ? 'LAUNCHING...' : 'START CAMPAIGN'}
      </button>
      {total > points && <p className="text-red-500 text-[10px] font-black uppercase text-center">Insufficient point balance</p>}
    </div>
  );
};

const Dashboard = ({ videos, points, onBoost }) => (
  <div className="space-y-10">
    <header className="flex justify-between items-end">
      <div>
        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">Creator Hub</h1>
        <p className="text-slate-500 text-sm">Active Promotions</p>
      </div>
      <div className="bg-slate-900 px-8 py-4 rounded-3xl border border-slate-800 shadow-xl">
        <span className="block text-[8px] font-black text-slate-500 uppercase text-center mb-1">Balance</span>
        <span className="text-2xl font-black text-yellow-400 tabular-nums">{points.toLocaleString()}</span>
      </div>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.length === 0 ? (
        <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 space-y-6">
          <h4 className="text-slate-600 font-black text-xl uppercase">No Campaigns</h4>
          <button onClick={onBoost} className="bg-red-600 px-8 py-4 rounded-2xl font-black text-white">Create First Campaign</button>
        </div>
      ) : (
        videos.map(vid => (
          <div key={vid.id} className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 flex items-center gap-6">
            <div className="w-24 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0">
              <img src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-white text-sm truncate pr-2">Campaign {vid.youtubeId}</h4>
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{vid.campaignType?.split('-')[0]}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-red-600" style={{ width: `${((vid.originalViews - vid.remainingViews) / vid.originalViews) * 100}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[8px] font-black text-slate-500 uppercase">
                <span>{Math.round(((vid.originalViews - vid.remainingViews) / vid.originalViews) * 100)}% Complete</span>
                <span>{vid.originalViews - vid.remainingViews} / {vid.originalViews}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const ScratchModal = ({ onClaim }) => {
  const [revealed, setRevealed] = useState(false);
  const prize = 500;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-[3rem] max-w-sm w-full text-center shadow-2xl relative space-y-6">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
        <h2 className="text-2xl font-black italic uppercase text-white">Welcome Gift!</h2>
        {!revealed ? (
          <div onClick={() => setRevealed(true)} className="aspect-square w-full bg-slate-800 rounded-[2rem] border-4 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 transition-all">
            <Ticket className="w-12 h-12 text-slate-600 mb-2" />
            <span className="font-bold text-slate-500 text-xs">TAP TO REVEAL</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="aspect-square w-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-[2rem] border-4 border-yellow-500/50 flex flex-col items-center justify-center shadow-2xl">
              <span className="text-6xl font-black text-yellow-400">500</span>
              <span className="text-yellow-600 font-bold uppercase text-[10px]">Points</span>
            </div>
            <button onClick={() => onClaim(prize)} className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm uppercase">Claim Bonus</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;