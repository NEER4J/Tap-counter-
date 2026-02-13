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
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, options); // T00:00:00 to prevent timezone shift
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

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
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Minus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  ),
  Chart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
};

// --- Components ---

const TapButton = ({ count, onClick }: { count: number; onClick: () => void }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = () => {
    setIsPressed(true);
    onClick();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`
        relative w-64 h-64 rounded-full flex flex-col items-center justify-center 
        transition-all duration-100 select-none touch-manipulation
        ${isPressed ? 'scale-95 bg-blue-600 shadow-inner' : 'scale-100 bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:bg-blue-400'}
      `}
      aria-label="Increment counter"
    >
      <div className="text-8xl font-bold text-white tracking-tighter drop-shadow-md">
        {count}
      </div>
      <div className="text-blue-100 font-medium mt-2 uppercase tracking-widest text-sm opacity-80">
        Tap to count
      </div>
    </button>
  );
};

const WeeklyChart = ({ history, today }: { history: Record<string, number>, today: string }) => {
  const last7Days = useMemo(() => getLast7Days(today), [today]);
  const maxVal = Math.max(...last7Days.map(d => history[d] || 0), 10); // Minimum scale of 10

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Icons.Chart /> Weekly Trends
        </h3>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">Last 7 Days</span>
      </div>
      <div className="flex items-end justify-between h-40 gap-2">
        {last7Days.map((date, idx) => {
          const count = history[date] || 0;
          const heightPercent = Math.max((count / maxVal) * 100, 4); // Min height visual
          const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
          const isToday = date === today;

          return (
            <div key={date} className="flex flex-col items-center flex-1 group">
              <div className="relative w-full flex items-end justify-center h-full">
                <div 
                  className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 ease-out ${isToday ? 'bg-blue-500' : 'bg-slate-600 group-hover:bg-slate-500'}`}
                  style={{ height: `${heightPercent}%` }}
                ></div>
                {/* Tooltip */}
                <div className="absolute -top-8 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {count} taps
                </div>
              </div>
              <span className={`text-xs mt-3 ${isToday ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                {dayLabel.charAt(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarView = ({ history, currentYear, currentMonth }: { history: Record<string, number>, currentYear: number, currentMonth: number }) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  // Determine max taps in this month for color scaling
  const maxTaps = useMemo(() => {
    let max = 0;
    days.forEach(day => {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (history[dateKey] > max) max = history[dateKey];
    });
    return Math.max(max, 1);
  }, [history, currentYear, currentMonth]);

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/50 text-slate-500';
    const intensity = count / maxTaps;
    if (intensity < 0.25) return 'bg-blue-900/40 text-blue-200 border-blue-900';
    if (intensity < 0.5) return 'bg-blue-800/60 text-blue-100 border-blue-700';
    if (intensity < 0.75) return 'bg-blue-600 text-white border-blue-500';
    return 'bg-blue-500 text-white border-blue-400 font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]';
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Icons.Calendar /> {monthName} {currentYear}
        </h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2 text-center mb-2">
        {['S','M','T','W','T','F','S'].map(d => (
          <div key={d} className="text-xs font-bold text-slate-500">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanks.map(b => <div key={`blank-${b}`} className="aspect-square"></div>)}
        {days.map(day => {
          const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = history[dateKey] || 0;
          const isToday = dateKey === getTodayString();
          
          return (
            <div 
              key={day} 
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm relative border border-transparent
                ${getIntensityColor(count)}
                ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}
              `}
              title={`${dateKey}: ${count} taps`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Instructions = () => (
  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-slate-300 text-sm space-y-3">
    <h3 className="text-white font-semibold flex items-center gap-2 text-base">
       How it works
    </h3>
    <ol className="list-decimal list-inside space-y-2 marker:text-blue-500">
      <li>Tap the large blue button to increment your daily counter.</li>
      <li>Each day (at midnight), the counter resets to 0 automatically.</li>
      <li>Your history is saved automatically.</li>
      <li>Use the <strong>-</strong> button to correct accidental taps.</li>
      <li>Scroll down to see your weekly performance and monthly calendar.</li>
    </ol>
  </div>
);

// --- Main App Component ---

const App = () => {
  const [history, setHistory] = useState<Record<string, number>>({});
  const [today, setToday] = useState(getTodayString());
  const [view, setView] = useState<'tracker' | 'stats'>('tracker');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('tap-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save to local storage whenever history changes
  useEffect(() => {
    if (Object.keys(history).length > 0) {
      localStorage.setItem('tap-history', JSON.stringify(history));
    }
  }, [history]);

  // Check date periodically to handle day rollover while app is open
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayString();
      if (current !== today) {
        setToday(current);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [today]);

  const updateCount = (amount: number) => {
    setHistory(prev => {
      const currentCount = prev[today] || 0;
      const newCount = Math.max(0, currentCount + amount);
      return { ...prev, [today]: newCount };
    });
  };

  const currentCount = history[today] || 0;
  const d = new Date(today);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 pb-20 selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-xl tracking-tight text-white">TapTrack</h1>
          <button 
            onClick={() => setView(view === 'tracker' ? 'stats' : 'tracker')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {view === 'tracker' ? 'View Stats' : 'Back to Tracker'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto pt-24 px-4 space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {view === 'tracker' ? (
          <>
            {/* Date Display */}
            <div className="text-center space-y-1">
              <p className="text-blue-400 font-medium tracking-wide text-sm uppercase">Today</p>
              <h2 className="text-2xl font-semibold text-white">{formatDateReadable(today)}</h2>
            </div>

            {/* Main Interaction */}
            <div className="flex justify-center py-8">
              <TapButton count={currentCount} onClick={() => updateCount(1)} />
            </div>

            {/* Quick Controls */}
            <div className="flex justify-center gap-6">
              <button 
                onClick={() => updateCount(-1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95 border border-slate-700"
                disabled={currentCount === 0}
              >
                <Icons.Minus /> Subtract
              </button>
            </div>

            {/* Today's Summary */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-slate-400 text-xs uppercase font-bold mb-1">This Week</div>
                <div className="text-2xl font-bold text-white">
                  {getLast7Days(today).reduce((acc: number, date: string) => acc + (history[date] || 0), 0)}
                </div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                 <div className="text-slate-400 text-xs uppercase font-bold mb-1">Monthly Total</div>
                 <div className="text-2xl font-bold text-white">
                    {Object.keys(history)
                      .filter(k => k.startsWith(today.substring(0, 7)))
                      .reduce((acc: number, k: string) => acc + (history[k] || 0), 0)}
                 </div>
              </div>
            </div>
            
             <div className="pt-8">
                <Instructions />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Statistics</h2>
                <div className="text-sm text-slate-400">
                    Total Taps: {Object.values(history).reduce((a: number, b: number) => a + b, 0)}
                </div>
            </div>
            
            <WeeklyChart history={history} today={today} />
            
            <CalendarView 
              history={history} 
              currentYear={d.getFullYear()} 
              currentMonth={d.getMonth()} 
            />

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mt-8">
               <h3 className="text-white font-semibold mb-4">Data Management</h3>
               <button 
                 onClick={() => {
                   if(confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                     setHistory({});
                     localStorage.removeItem('tap-history');
                   }
                 }}
                 className="w-full py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
               >
                 <Icons.Trash /> Reset All History
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);