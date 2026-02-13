import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- Utility Functions ---

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateReadable = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, options);
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const getLast7Days = (today: string) => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
};

// --- Icons ---
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Undo: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

// --- Components ---

const TapView = ({ count, onUpdate }: { count: number; onUpdate: (amount: number) => void }) => {
  const [pressed, setPressed] = useState(false);
  
  const handleTap = () => {
    setPressed(true);
    if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback
    onUpdate(1);
    setTimeout(() => setPressed(false), 150);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="absolute top-6 left-0 right-0 text-center opacity-70">
         <h2 className="text-sm font-medium tracking-widest text-blue-300 uppercase">Today's Count</h2>
      </div>

      <button
        className={`
          relative w-72 h-72 rounded-full flex items-center justify-center
          transition-all duration-150 cursor-pointer touch-manipulation outline-none
          ${pressed ? 'scale-95 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'scale-100 bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_60px_rgba(59,130,246,0.25)]'}
        `}
        onPointerDown={handleTap}
        aria-label="Tap to count"
      >
        <span className="text-9xl font-bold text-white tracking-tighter select-none pointer-events-none">
          {count}
        </span>
        <div className="absolute bottom-12 text-blue-100/50 text-sm uppercase tracking-widest font-semibold pointer-events-none">Tap</div>
      </button>

      <button 
        onClick={() => {
            if (navigator.vibrate) navigator.vibrate(30);
            onUpdate(-1);
        }}
        disabled={count === 0}
        className="absolute bottom-8 right-8 p-4 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-700 shadow-lg"
        aria-label="Undo tap"
      >
        <Icons.Undo />
      </button>
    </div>
  );
};

const StatsView = ({ history, today }: { history: Record<string, number>, today: string }) => {
  const last7Days = useMemo(() => getLast7Days(today), [today]);
  const maxVal = Math.max(...last7Days.map(d => history[d] || 0), 5);
  const currentMonth = new Date(today);
  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  return (
    <div className="space-y-6 pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-white">Statistics</h2>
      
      {/* Weekly Chart */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Last 7 Days</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {last7Days.map((date) => {
             const val = history[date] || 0;
             const h = Math.max((val / maxVal) * 100, 5);
             const isToday = date === today;
             const dLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {weekday: 'narrow'});
             return (
               <div key={date} className="flex-1 flex flex-col items-center gap-2">
                 <div className="w-full relative group h-full flex items-end justify-center">
                    <div 
                      style={{height: `${h}%`}} 
                      className={`w-full max-w-[12px] rounded-full transition-all duration-500 ${isToday ? 'bg-blue-500' : 'bg-slate-600'}`}
                    ></div>
                    <div className="absolute -top-8 bg-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{val}</div>
                 </div>
                 <span className={`text-[10px] ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>{dLabel}</span>
               </div>
             )
          })}
        </div>
      </div>

      {/* Monthly Heatmap */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
           {currentMonth.toLocaleDateString('default', {month:'long'})}
        </h3>
        <div className="grid grid-cols-7 gap-2">
           {Array.from({length: firstDay}).map((_, i) => <div key={`empty-${i}`} />)}
           {Array.from({length: daysInMonth}).map((_, i) => {
             const day = i + 1;
             const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
             const count = history[key] || 0;
             const intensity = count > 0 ? (count > 20 ? 'bg-blue-500 text-white' : count > 5 ? 'bg-blue-700 text-blue-100' : 'bg-blue-900/50 text-blue-300') : 'bg-slate-800/50 text-slate-600';
             return (
               <div key={day} className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${intensity} ${key === today ? 'ring-1 ring-white' : ''}`}>
                 {day}
               </div>
             )
           })}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
         <span className="text-slate-400 text-sm">Lifetime Taps</span>
         <span className="text-xl font-bold text-white">{Object.values(history).reduce((a,b)=>a+b,0)}</span>
      </div>
    </div>
  );
};

const SettingsView = ({ history, setHistory }: { history: Record<string, number>, setHistory: React.Dispatch<React.SetStateAction<Record<string, number>>> }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tap-history-${getTodayString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object') {
           if (confirm("This will overwrite your current history. Are you sure?")) {
              setHistory(json);
              alert("History imported successfully!");
           }
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  return (
    <div className="space-y-6 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-base font-medium text-white">Data Management</h3>
          <p className="text-xs text-slate-400 mt-1">Export your data to keep a backup or transfer to another device.</p>
        </div>
        <div className="p-2 space-y-1">
          <button onClick={handleExport} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left text-sm text-slate-200">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Icons.Download /></div>
            Export History (JSON)
          </button>
          
          <button onClick={handleImportClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left text-sm text-slate-200">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Icons.Upload /></div>
            Import History
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

          <button 
             onClick={() => {
               if(confirm("Are you sure you want to delete all data? This cannot be undone.")) {
                 setHistory({});
                 localStorage.removeItem('tap-history');
               }
             }}
             className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-900/20 transition-colors text-left text-sm text-red-300"
          >
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><Icons.Trash /></div>
            Clear All Data
          </button>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-xs text-slate-600">TapTrack v2.0 • PWA Enabled</p>
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [history, setHistory] = useState<Record<string, number>>({});
  const [today, setToday] = useState(getTodayString());
  
  // Initialize view from URL query param (handling App Shortcuts)
  const [view, setView] = useState<'home' | 'stats' | 'settings'>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    return (v === 'stats' || v === 'settings') ? v : 'home';
  });

  useEffect(() => {
    const saved = localStorage.getItem('tap-history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(history).length > 0) {
      localStorage.setItem('tap-history', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayString();
      if (current !== today) setToday(current);
    }, 60000);
    return () => clearInterval(interval);
  }, [today]);

  const updateCount = (amount: number) => {
    setHistory(prev => {
      const currentCount = prev[today] || 0;
      const newCount = Math.max(0, currentCount + amount);
      return { ...prev, [today]: newCount };
    });
  };

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col bg-slate-900">
      {/* Viewport Content */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {view === 'home' && <TapView count={history[today] || 0} onUpdate={updateCount} />}
        {view === 'stats' && <StatsView history={history} today={today} />}
        {view === 'settings' && <SettingsView history={history} setHistory={setHistory} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass-panel rounded-2xl flex items-center justify-around shadow-2xl z-50 max-w-md mx-auto">
        <button 
          onClick={() => setView('home')} 
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${view === 'home' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className={`${view === 'home' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}><Icons.Home /></div>
          <span className="text-[10px] font-medium mt-1">Tap</span>
        </button>
        
        <button 
          onClick={() => setView('stats')} 
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${view === 'stats' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className={`${view === 'stats' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}><Icons.Chart /></div>
           <span className="text-[10px] font-medium mt-1">Stats</span>
        </button>
        
        <button 
          onClick={() => setView('settings')} 
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${view === 'settings' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className={`${view === 'settings' ? 'scale-110' : 'scale-100'} transition-transform duration-200`}><Icons.Settings /></div>
           <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>
      </nav>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);