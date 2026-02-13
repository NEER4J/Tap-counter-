import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- Types ---
type AppSettings = {
  stepsPerTap: number;
};

type AppData = {
  history: Record<string, number>;
  settings?: AppSettings;
};

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
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Footprint: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 11 3.8 11 8c0 2.85-1.29 5.3-2.3 7.3l-1.42 2.6c-.4.74-.29 1.66.33 2.25.68.65 1.74.6 2.34-.11L14.47 15"></path><path d="M14 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C8.63 6 7 7.8 7 12c0 2.85 1.29 5.3 2.3 7.3l1.42 2.6c.4.74.29 1.66-.33 2.25-.68.65-1.74.6-2.34-.11L3.53 19"></path></svg>
};

// --- Components ---

const TapView = ({ count, onUpdate, stepsPerTap }: { count: number; onUpdate: (amount: number) => void; stepsPerTap: number }) => {
  const [pressed, setPressed] = useState(false);
  const totalSteps = count * stepsPerTap;
  
  const handleTap = () => {
    setPressed(true);
    if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback
    onUpdate(1);
    setTimeout(() => setPressed(false), 150);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="absolute top-6 left-0 right-0 text-center opacity-70">
         <h2 className="text-sm font-medium tracking-widest text-blue-300 uppercase">Today's Progress</h2>
      </div>

      <button
        className={`
          relative w-72 h-72 rounded-full flex flex-col items-center justify-center
          transition-all duration-150 cursor-pointer touch-manipulation outline-none
          ${pressed ? 'scale-95 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'scale-100 bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_60px_rgba(59,130,246,0.25)]'}
        `}
        onPointerDown={handleTap}
        aria-label="Tap to count"
      >
        <div className="flex flex-col items-center transform translate-y-2">
            <span className="text-7xl font-bold text-white tracking-tighter select-none pointer-events-none">
            {totalSteps.toLocaleString()}
            </span>
            <span className="text-blue-200 text-lg font-medium select-none">Steps</span>
        </div>
        
        <div className="absolute bottom-8 flex flex-col items-center opacity-80 pointer-events-none">
            <span className="text-blue-100 text-sm font-semibold">{count} Taps</span>
            <span className="text-blue-200/50 text-[10px] uppercase tracking-wider mt-0.5">TAP HERE</span>
        </div>
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

const StatsView = ({ history, today, stepsPerTap }: { history: Record<string, number>, today: string, stepsPerTap: number }) => {
  const last7Days = useMemo(() => getLast7Days(today), [today]);
  const maxVal = Math.max(...last7Days.map(d => (history[d] || 0) * stepsPerTap), 100);
  const currentMonth = new Date(today);
  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  const lifetimeTaps = Object.values(history).reduce((a,b)=>a+b,0);
  const lifetimeSteps = lifetimeTaps * stepsPerTap;

  return (
    <div className="space-y-6 pb-20 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Statistics <span className="text-sm font-normal text-slate-400 mt-1">(Steps)</span>
      </h2>
      
      {/* Weekly Chart */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wider">Last 7 Days</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {last7Days.map((date) => {
             const taps = history[date] || 0;
             const steps = taps * stepsPerTap;
             const h = Math.max((steps / maxVal) * 100, 5);
             const isToday = date === today;
             const dLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {weekday: 'narrow'});
             return (
               <div key={date} className="flex-1 flex flex-col items-center gap-2">
                 <div className="w-full relative group h-full flex items-end justify-center">
                    <div 
                      style={{height: `${h}%`}} 
                      className={`w-full max-w-[12px] rounded-full transition-all duration-500 ${isToday ? 'bg-blue-500' : 'bg-slate-600'}`}
                    ></div>
                    <div className="absolute -top-8 bg-slate-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                        {steps.toLocaleString()}
                    </div>
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
             const steps = count * stepsPerTap;
             // Intensity based on steps approx (assuming 10k goal roughly)
             // Low: >0, Med: >2000, High: >8000
             const intensity = count > 0 ? (steps > 8000 ? 'bg-blue-500 text-white' : steps > 2000 ? 'bg-blue-700 text-blue-100' : 'bg-blue-900/50 text-blue-300') : 'bg-slate-800/50 text-slate-600';
             return (
               <div key={day} className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${intensity} ${key === today ? 'ring-1 ring-white' : ''}`}>
                 {day}
               </div>
             )
           })}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
         <span className="text-slate-400 text-sm">Lifetime Steps</span>
         <span className="text-xl font-bold text-white">{lifetimeSteps.toLocaleString()}</span>
      </div>
    </div>
  );
};

const SettingsView = ({ 
    history, 
    setHistory, 
    settings, 
    setSettings 
}: { 
    history: Record<string, number>, 
    setHistory: React.Dispatch<React.SetStateAction<Record<string, number>>>,
    settings: AppSettings,
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data: AppData = {
        history,
        settings
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taptrack-backup-${getTodayString()}.json`;
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
              // Support legacy format (just history object) and new format (object with history & settings)
              if (json.history) {
                 setHistory(json.history);
                 if (json.settings && typeof json.settings.stepsPerTap === 'number') {
                    setSettings(json.settings);
                 }
              } else {
                 // Fallback for old backups
                 setHistory(json);
              }
              alert("Data imported successfully!");
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

      {/* Configuration Section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-base font-medium text-white">Configuration</h3>
          <p className="text-xs text-slate-400 mt-1">Adjust how your steps are calculated.</p>
        </div>
        <div className="p-4 flex items-center justify-between">
            <label className="text-sm text-slate-200">Steps per Tap</label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    min="1" 
                    value={settings.stepsPerTap} 
                    onChange={(e) => setSettings(prev => ({ ...prev, stepsPerTap: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-24 text-center focus:outline-none focus:border-blue-500"
                />
            </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-base font-medium text-white">Data Management</h3>
          <p className="text-xs text-slate-400 mt-1">Export your data including history and settings.</p>
        </div>
        <div className="p-2 space-y-1">
          <button onClick={handleExport} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left text-sm text-slate-200">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Icons.Download /></div>
            Export Backup (JSON)
          </button>
          
          <button onClick={handleImportClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors text-left text-sm text-slate-200">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Icons.Upload /></div>
            Import Backup
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
        <p className="text-xs text-slate-600">TapTrack v2.1 • PWA Enabled</p>
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [history, setHistory] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<AppSettings>({ stepsPerTap: 14 });
  const [today, setToday] = useState(getTodayString());
  
  // Initialize view from URL query param (handling App Shortcuts)
  const [view, setView] = useState<'home' | 'stats' | 'settings'>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    return (v === 'stats' || v === 'settings') ? v : 'home';
  });

  // Load History
  useEffect(() => {
    const savedHistory = localStorage.getItem('tap-history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
  }, []);

  // Load Settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('tap-settings');
    if (savedSettings) {
        try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save History
  useEffect(() => {
    if (Object.keys(history).length > 0) {
      localStorage.setItem('tap-history', JSON.stringify(history));
    }
  }, [history]);

  // Save Settings
  useEffect(() => {
    localStorage.setItem('tap-settings', JSON.stringify(settings));
  }, [settings]);

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
        {view === 'home' && <TapView count={history[today] || 0} onUpdate={updateCount} stepsPerTap={settings.stepsPerTap} />}
        {view === 'stats' && <StatsView history={history} today={today} stepsPerTap={settings.stepsPerTap} />}
        {view === 'settings' && <SettingsView history={history} setHistory={setHistory} settings={settings} setSettings={setSettings} />}
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