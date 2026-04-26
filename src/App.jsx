import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, Globe, Home, Settings, Calendar, Compass, 
  BookOpen, Clock, ChevronLeft, Search, RefreshCw, Bookmark, BookmarkCheck,
  ChevronRight, MapPin, Heart
} from 'lucide-react';

// --- UTILITAS KALENDER HIJRIAH ---
const getHijriDate = (date) => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  
  let jd = 0;
  if (y > 1582 || (y === 1582 && m > 10) || (y === 1582 && m === 10 && d >= 15)) {
    jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
         Math.floor((367 * (m - 2 - 12 * (Math.floor((m - 14) / 12)))) / 12) -
         Math.floor((3 * (Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100))) / 4) + d - 32075;
  } else {
    jd = 367 * y - Math.floor((7 * (y + 5001 + Math.floor((m - 9) / 7))) / 4) + Math.floor((275 * m) / 9) + d + 1729777;
  }

  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  let hm = Math.floor((24 * l) / 709);
  let hd = l - Math.floor((709 * hm) / 24);
  let hy = 30 * n + j - 30;

  const months = [
    "Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir", "Jumadil Ula", "Jumadil Akhira",
    "Rajab", "Sya'ban", "Ramadhan", "Syawwal", "Dzulqa'dah", "Dzulhijjah"
  ];

  return { day: hd, month: months[hm - 1], monthIdx: hm - 1, year: hy };
};

// --- KOMPONEN UTAMA ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [lastRead, setLastRead] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedLastRead = localStorage.getItem('lastReadQuran');
    if (savedLastRead) setLastRead(JSON.parse(savedLastRead));
    const savedTheme = localStorage.getItem('themeQuran');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('themeQuran', newMode ? 'dark' : 'light');
  };

  const saveLastRead = (surah, ayah) => {
    const data = { 
      surahNomor: surah.nomor, 
      surahName: surah.namaLatin, 
      ayahNomor: ayah.nomorAyat 
    };
    localStorage.setItem('lastReadQuran', JSON.stringify(data));
    setLastRead(data);
  };

  const navigateTo = (screen) => setCurrentScreen(screen);

  return (
    <div className={`flex justify-center min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-black' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-[420px] h-screen relative overflow-hidden flex flex-col shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-[#1f1019] text-white' : 'bg-white text-slate-900'}`}>
        
        <div className="flex-1 overflow-y-auto pb-24">
          {currentScreen === 'home' && <HomeScreen navigateTo={navigateTo} lastRead={lastRead} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
          {currentScreen === 'quran' && <QuranScreen navigateTo={navigateTo} lastRead={lastRead} onSaveLastRead={saveLastRead} darkMode={darkMode} />}
          {currentScreen === 'hijriah' && <HijriCalendarScreen navigateTo={navigateTo} darkMode={darkMode} />}
          {currentScreen === 'doa' && <DoaScreen navigateTo={navigateTo} darkMode={darkMode} />}
          {currentScreen === 'tasbih' && <TasbihScreen navigateTo={navigateTo} darkMode={darkMode} />}
          {['kalender', 'kiblat', 'hadis', 'sholat', 'pengaturan'].includes(currentScreen) && (
            <ComingSoonScreen title={currentScreen} navigateTo={navigateTo} darkMode={darkMode} />
          )}
        </div>

        <BottomNav currentScreen={currentScreen} navigateTo={navigateTo} darkMode={darkMode} />
      </div>
    </div>
  );
}

// --- SCREEN: HOME ---
function HomeScreen({ navigateTo, lastRead, darkMode, toggleDarkMode }) {
  const [currentTime, setCurrentTime] = useState('');
  const [hijriToday, setHijriToday] = useState({ day: 1, month: '', year: 1445 });
  const [prayerTimes, setPrayerTimes] = useState(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setHijriToday(getHijriDate(now));
      setCurrentTime(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
    };
    updateClock();
    const timer = setInterval(updateClock, 60000);
    
    // Fetch Prayer Times
    const today = new Date().toISOString().split('T')[0].split('-').join('/');
    fetch(`https://api.myquran.com/v2/sholat/jadwal/1301/${today}`)
      .then(res => res.json())
      .then(data => {
        if (data.status) setPrayerTimes(data.data.jadwal);
      })
      .catch(() => {
        setPrayerTimes({
          subuh: "04:36", dzuhur: "11:54", ashar: "15:14", maghrib: "17:51", isya: "18:59"
        });
      });

    return () => clearInterval(timer);
  }, []);

  // Theme colors for Pink Rose
  const iconColor = darkMode ? 'text-pink-400' : 'text-rose-600';
  const menuBg = darkMode ? 'bg-pink-900/20' : 'bg-rose-50';

  const menuItems = [
    { id: 'quran', name: 'Al-Quran', icon: <BookOpen className={`w-6 h-6 ${iconColor}`} /> },
    { id: 'hijriah', name: 'Hijriah', icon: <Calendar className={`w-6 h-6 ${iconColor}`} /> },
    { id: 'kiblat', name: 'Kiblat', icon: <Compass className={`w-6 h-6 ${iconColor}`} /> },
    { id: 'tasbih', name: 'Tasbih', icon: <div className={`w-5 h-5 rounded-full border-4 ${darkMode ? 'border-pink-400' : 'border-rose-600'} relative`}><div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 ${darkMode ? 'bg-pink-400' : 'bg-rose-600'} rounded-full`}></div></div> },
    { id: 'kalender', name: 'Kalender', icon: <Calendar className={`w-6 h-6 ${iconColor}`} /> },
    { id: 'doa', name: 'Doa', icon: <Heart className={`w-6 h-6 ${iconColor} ${darkMode ? 'fill-pink-400' : 'fill-rose-600'}`} /> },
    { id: 'hadis', name: 'Hadis', icon: <BookOpen className={`w-6 h-6 ${iconColor}`} /> },
    { id: 'sholat', name: 'Sholat', icon: <Clock className={`w-6 h-6 ${iconColor}`} /> },
  ];

  const prayers = [
    { name: 'Subuh', time: prayerTimes?.subuh, icon: 'bg-gradient-to-br from-rose-300 to-orange-300' },
    { name: 'Dzuhur', time: prayerTimes?.dzuhur, icon: 'bg-gradient-to-br from-blue-300 to-rose-300' },
    { name: 'Ashar', time: prayerTimes?.ashar, icon: 'bg-gradient-to-br from-rose-400 to-pink-500' },
    { name: 'Maghrib', time: prayerTimes?.maghrib, icon: 'bg-gradient-to-br from-pink-500 to-rose-700' },
    { name: 'Isya', time: prayerTimes?.isya, icon: 'bg-gradient-to-br from-purple-800 to-pink-900' },
  ];

  return (
    <div className={`min-h-full ${darkMode ? 'bg-[#1f1019]' : 'bg-[#fff5f7]'}`}>
      {/* Header Space - Pink Gradient */}
      <div className={`relative ${darkMode ? 'bg-[#2d1624]' : 'bg-gradient-to-br from-rose-900 to-pink-800'} text-white pt-8 pb-16 px-6 overflow-hidden rounded-b-[45px]`}>
        {/* Background Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 top-20 w-32 h-32 bg-rose-400/20 rounded-full blur-xl"></div>
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           {[...Array(15)].map((_, i) => (
             <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{top: `${Math.random()*100}%`, left: `${Math.random()*100}%`}}></div>
           ))}
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">As-salamu alaykum</h1>
            <span className="text-[11px] text-pink-300 font-bold mt-0.5 tracking-wider uppercase">
              {hijriToday.day} {hijriToday.month} {hijriToday.year} H
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10">
              {darkMode ? <Sun size={20} className="text-pink-300" /> : <Moon size={20} className="text-pink-100" />}
            </button>
            <div className="px-3 py-1.5 rounded-full bg-white/10 flex items-center gap-2 border border-white/10">
               <Globe size={14} className="text-pink-100"/> <span className="text-xs font-bold text-pink-50">ID</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-10 relative z-10">
          <div className="text-[5.5rem] font-bold leading-none tracking-tighter tabular-nums drop-shadow-md">{currentTime}</div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-pink-200/80 mt-4">
            <MapPin size={12} className="text-pink-300" /> Jakarta, Indonesia
          </div>
        </div>
      </div>

      {/* Prayer Times - Bulat Style */}
      <div className="-mt-10 px-4 relative z-20 mb-8">
        <div className={`flex justify-between items-start gap-1 p-2 rounded-3xl overflow-x-auto no-scrollbar`}>
          {prayers.map((p, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[70px]">
              <div className={`w-14 h-14 rounded-full border-4 ${darkMode ? 'border-[#1f1019]' : 'border-[#fff5f7]'} shadow-lg flex items-center justify-center overflow-hidden mb-2 transition-transform hover:scale-110 cursor-pointer`}>
                <div className={`w-full h-full ${p.icon} flex items-center justify-center text-white`}>
                   {p.name === 'Subuh' && <Sun size={18} />}
                   {p.name === 'Dzuhur' && <Sun size={18} />}
                   {p.name === 'Ashar' && <Sun size={18} />}
                   {p.name === 'Maghrib' && <Moon size={18} />}
                   {p.name === 'Isya' && <Moon size={18} />}
                </div>
              </div>
              <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-rose-400'} uppercase tracking-tighter`}>{p.name}</span>
              <span className={`text-[11px] font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{p.time || '--:--'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Menu Icons */}
      <div className="px-6 grid grid-cols-4 gap-x-4 gap-y-6 mb-10">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => navigateTo(item.id)} className="flex flex-col items-center gap-2 group">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all group-active:scale-90 ${menuBg}`}>
              {item.icon}
            </div>
            <span className={`text-[11px] font-bold ${darkMode ? 'text-pink-200' : 'text-slate-600'}`}>{item.name}</span>
          </button>
        ))}
      </div>

      {/* Target Tilawah Widget */}
      <div className="px-6 mb-8">
        <div className={`p-6 rounded-[2.5rem] border shadow-sm ${darkMode ? 'bg-[#2d1624] border-pink-900/30' : 'bg-white border-rose-100'}`}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-pink-900/50 text-pink-400' : 'bg-rose-100 text-rose-600'}`}><Search size={18}/></div>
              <h3 className="font-bold text-sm">Target Tilawah</h3>
            </div>
            <span className={`${darkMode ? 'text-pink-400' : 'text-rose-600'} font-black text-lg`}>0%</span>
          </div>
          <div className={`h-2 w-full rounded-full overflow-hidden mb-4 ${darkMode ? 'bg-[#1f1019]' : 'bg-rose-50'}`}>
             <div className={`h-full w-0 rounded-full ${darkMode ? 'bg-pink-500' : 'bg-rose-500'}`}></div>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-gray-400">
             <span className={darkMode ? 'text-pink-200/50' : 'text-rose-400/80'}>Mulai mengaji hari ini</span>
             <span className={darkMode ? 'text-pink-100' : 'text-slate-800'}>0 / 6236 Ayat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SCREEN: KALENDER HIJRIAH ---
function HijriCalendarScreen({ navigateTo, darkMode }) {
  const [viewDate, setViewDate] = useState(new Date());
  const hijri = getHijriDate(viewDate);
  
  const changeMonth = (offset) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(next);
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayIdx = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className={`min-h-full transition-colors duration-300 ${darkMode ? 'bg-[#1f1019]' : 'bg-[#fff5f7]'}`}>
      <div className={`px-4 py-4 sticky top-0 shadow-sm z-10 flex items-center gap-3 transition-colors duration-300 ${darkMode ? 'bg-[#2d1624]' : 'bg-white'}`}>
        <button onClick={() => navigateTo('home')} className={`p-2 -ml-2 rounded-full ${darkMode ? 'hover:bg-pink-900/50' : 'hover:bg-rose-50'}`}>
          <ChevronLeft className={`w-6 h-6 ${darkMode ? 'text-pink-100' : 'text-slate-700'}`} />
        </button>
        <h2 className={`font-bold text-lg flex-1 ${darkMode ? 'text-pink-50' : 'text-slate-800'}`}>Kalender Hijriah</h2>
      </div>

      <div className="p-4">
        <div className={`rounded-3xl p-6 mb-6 text-white shadow-lg overflow-hidden relative ${darkMode ? 'bg-gradient-to-br from-pink-900 to-[#1f1019]' : 'bg-gradient-to-br from-rose-500 to-pink-700'}`}>
          <div className="absolute -right-4 -top-4 opacity-10"><Calendar size={120} /></div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 text-pink-100">Tahun Hijriah {hijri.year}</p>
          <h1 className="text-3xl font-bold mb-4">{hijri.month}</h1>
          <div className="flex items-center justify-between bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
             <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/20 rounded-lg"><ChevronLeft size={20}/></button>
             <div className="text-center">
                <p className="text-xs font-medium opacity-80">Masehi</p>
                <p className="font-bold">{viewDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
             </div>
             <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/20 rounded-lg"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className={`rounded-[2rem] p-4 shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-[#2d1624] border-pink-900/30' : 'bg-white border-rose-100'}`}>
          <div className="grid grid-cols-7 mb-2">
            {dayLabels.map(d => (
              <div key={d} className={`text-center text-[10px] font-bold uppercase py-2 ${d === 'Min' ? 'text-red-400' : (darkMode ? 'text-pink-300/50' : 'text-rose-400/70')}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDayIdx)].map((_, i) => <div key={`empty-${i}`} className="h-12"></div>)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const hDate = getHijriDate(dateObj);
              const isToday = new Date().toDateString() === dateObj.toDateString();
              const isSunday = dateObj.getDay() === 0;
              return (
                <div key={day} className={`h-14 flex flex-col items-center justify-center rounded-xl relative ${isToday ? (darkMode ? 'bg-pink-600 text-white' : 'bg-rose-500 text-white shadow-md') : ''}`}>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-pink-100' : (isSunday ? 'text-red-400' : (darkMode ? 'text-pink-200/50' : 'text-rose-300'))}`}>{day}</span>
                  <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : (darkMode ? 'text-pink-50' : 'text-slate-700')}`}>{hDate.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SCREEN: AL-QURAN ---
function QuranScreen({ navigateTo, lastRead, onSaveLastRead, darkMode }) {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);

  useEffect(() => {
    fetch('https://equran.id/api/v2/surat')
      .then(res => res.json())
      .then(data => { setSurahs(data.data); setLoading(false); });
  }, []);

  const loadSurahDetail = (nomor) => {
    setSelectedSurah(nomor);
    fetch(`https://equran.id/api/v2/surat/${nomor}`)
      .then(res => res.json())
      .then(data => setAyahs(data.data.ayat));
  };

  if (selectedSurah && ayahs.length > 0) {
    const surahData = surahs.find(s => s.nomor === selectedSurah);
    return (
      <div className={`min-h-full ${darkMode ? 'bg-[#1f1019]' : 'bg-[#fff5f7]'}`}>
        <div className={`px-4 py-4 sticky top-0 shadow-sm z-10 flex items-center gap-3 ${darkMode ? 'bg-[#2d1624]' : 'bg-white'}`}>
          <button onClick={() => setSelectedSurah(null)} className={`p-2 -ml-2 rounded-full ${darkMode ? 'hover:bg-pink-900/50' : 'hover:bg-rose-50'}`}>
             <ChevronLeft className={darkMode ? 'text-pink-100' : 'text-slate-700'}/>
          </button>
          <div className="flex-1">
            <h2 className={`font-bold text-lg ${darkMode ? 'text-pink-50' : 'text-slate-800'}`}>{surahData?.namaLatin}</h2>
            <p className={`text-xs ${darkMode ? 'text-pink-300' : 'text-rose-500'}`}>{surahData?.jumlahAyat} Ayat</p>
          </div>
        </div>
        <div className="p-4 space-y-6 pb-20">
          {ayahs.map((ayah) => {
            const isSaved = lastRead?.surahNomor === selectedSurah && lastRead?.ayahNomor === ayah.nomorAyat;
            return (
              <div key={ayah.nomorAyat} className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#2d1624] border-pink-900/30' : 'bg-white border-rose-100'} ${isSaved ? (darkMode ? 'ring-2 ring-pink-500' : 'ring-2 ring-rose-400') : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${darkMode ? 'bg-pink-900/50 text-pink-300' : 'bg-rose-100 text-rose-700'}`}>{ayah.nomorAyat}</span>
                  <button onClick={() => onSaveLastRead(surahData, ayah)} className={`p-2 rounded-full ${isSaved ? (darkMode ? 'text-pink-400' : 'text-rose-500') : (darkMode ? 'text-pink-900' : 'text-rose-200')}`}>
                    <BookmarkCheck size={20} />
                  </button>
                </div>
                <p className={`text-right text-2xl font-arabic leading-loose mb-4 ${darkMode ? 'text-pink-50' : 'text-slate-800'}`} dir="rtl">{ayah.teksArab}</p>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-pink-200/80' : 'text-slate-600'}`}>{ayah.teksIndonesia}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full ${darkMode ? 'bg-[#1f1019]' : 'bg-[#fff5f7]'}`}>
      <div className={`px-4 py-4 sticky top-0 shadow-sm z-10 flex items-center gap-3 ${darkMode ? 'bg-[#2d1624]' : 'bg-white'}`}>
        <button onClick={() => navigateTo('home')} className={`p-2 -ml-2 rounded-full ${darkMode ? 'hover:bg-pink-900/50' : 'hover:bg-rose-50'}`}>
           <ChevronLeft className={darkMode ? 'text-pink-100' : 'text-slate-700'}/>
        </button>
        <h2 className={`font-bold text-lg flex-1 ${darkMode ? 'text-pink-50' : 'text-slate-800'}`}>Al-Quran</h2>
      </div>
      {loading ? <div className="p-20 text-center"><RefreshCw className={`animate-spin inline-block ${darkMode ? 'text-pink-400' : 'text-rose-500'}`} /></div> : (
        <div className={`divide-y ${darkMode ? 'divide-pink-900/20' : 'divide-rose-100'} px-4`}>
          {surahs.map(s => (
            <button key={s.nomor} onClick={() => loadSurahDetail(s.nomor)} className="w-full py-5 flex items-center text-left group">
              <div className={`w-10 h-10 mr-4 flex items-center justify-center rounded-xl font-bold text-sm group-active:scale-95 transition-transform ${darkMode ? 'bg-pink-900/40 text-pink-300' : 'bg-rose-100 text-rose-700'}`}>{s.nomor}</div>
              <div className="flex-1">
                 <h3 className={`font-bold text-sm ${darkMode ? 'text-pink-50' : 'text-slate-800'}`}>{s.namaLatin}</h3>
                 <p className={`text-[10px] font-bold uppercase ${darkMode ? 'text-pink-400/60' : 'text-rose-400'}`}>{s.tempatTurun} • {s.jumlahAyat} AYAT</p>
              </div>
              <div className={`text-2xl font-arabic ${darkMode ? 'text-pink-400' : 'text-rose-600'}`}>{s.nama}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SCREEN: TASBIH ---
function TasbihScreen({ navigateTo, darkMode }) {
  const [count, setCount] = useState(0);
  return (
    <div className={`min-h-full flex flex-col ${darkMode ? 'bg-black' : 'bg-[#2d1624]'} text-white`}>
      <div className="p-4 flex justify-between items-center"><button onClick={() => navigateTo('home')}><ChevronLeft className="text-pink-200" /></button><h2 className="font-bold text-pink-100">Tasbih</h2><button onClick={() => setCount(0)} className="text-sm font-bold text-pink-400">Reset</button></div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-[5rem] font-mono mb-12 bg-black/40 px-10 py-6 rounded-3xl border-t-2 border-pink-500 shadow-2xl text-pink-300">{count.toString().padStart(4, '0')}</div>
        <button 
          onClick={() => {
            setCount(c => c + 1);
            if (window.navigator.vibrate) window.navigator.vibrate(50);
          }} 
          className={`w-48 h-48 rounded-full shadow-[0_15px_0_0_#831843,0_20px_40px_rgba(0,0,0,0.5)] active:translate-y-4 active:shadow-[0_5px_0_0_#831843] transition-all flex items-center justify-center ${darkMode ? 'bg-pink-700' : 'bg-rose-500'}`}
        >
           <span className="text-white/40 text-xs uppercase font-black tracking-widest">TAP</span>
        </button>
      </div>
    </div>
  );
}

// --- PLACEHOLDER SCREENS ---
function DoaScreen({ navigateTo, darkMode }) {
  return (
    <div className={`min-h-full ${darkMode ? 'bg-[#1f1019]' : 'bg-[#fff5f7]'}`}>
      <div className={`px-4 py-4 flex items-center gap-3 ${darkMode ? 'bg-[#2d1624]' : 'bg-white'}`}>
        <button onClick={() => navigateTo('home')} className={`p-2 ${darkMode ? 'text-pink-100' : 'text-slate-700'}`}><ChevronLeft /></button>
        <h2 className={`font-bold ${darkMode ? 'text-pink-50' : 'text-slate-800'}`}>Kumpulan Doa</h2>
      </div>
      <div className="p-4 text-center text-rose-300 py-20 flex flex-col items-center gap-4">
         <Heart size={48} className="text-rose-200" />
         <p>Fitur doa sedang dikembangkan.</p>
      </div>
    </div>
  );
}

function ComingSoonScreen({ title, navigateTo, darkMode }) {
  return (
    <div className={`min-h-full flex flex-col items-center justify-center ${darkMode ? 'bg-[#1f1019]' : 'bg-[#fff5f7]'}`}>
      <button onClick={() => navigateTo('home')} className={`absolute top-4 left-4 p-2 ${darkMode ? 'text-pink-100' : 'text-slate-700'}`}><ChevronLeft /></button>
      <div className="text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-pink-900/50 text-pink-400' : 'bg-rose-100 text-rose-500'}`}><RefreshCw size={32}/></div>
        <h3 className={`font-bold text-xl ${darkMode ? 'text-pink-50' : 'text-slate-800'}`}>Fitur {title}</h3>
        <p className={`text-xs mt-2 px-10 ${darkMode ? 'text-pink-300/60' : 'text-rose-400'}`}>Segera hadir pada pembaruan mendatang.</p>
      </div>
    </div>
  );
}

// --- BOTTOM NAV ---
function BottomNav({ currentScreen, navigateTo, darkMode }) {
  const activeColor = darkMode ? 'text-pink-400' : 'text-rose-600';
  const inactiveColor = darkMode ? 'text-pink-900' : 'text-rose-200';
  
  return (
    <div className={`absolute bottom-0 w-full h-[85px] flex justify-between items-center px-4 transition-colors duration-300 ${darkMode ? 'bg-[#2d1624] border-t border-pink-900/30' : 'bg-white border-t border-rose-100'}`}>
      <button onClick={() => navigateTo('doa')} className="flex flex-col items-center w-14">
        <Heart className={`w-5 h-5 ${currentScreen === 'doa' ? activeColor + ' fill-current' : inactiveColor}`} />
        <span className={`text-[9px] mt-1 font-bold ${currentScreen === 'doa' ? activeColor : inactiveColor}`}>Doa</span>
      </button>
      <button onClick={() => navigateTo('hijriah')} className="flex flex-col items-center w-14">
        <Calendar className={`w-5 h-5 ${currentScreen === 'hijriah' ? activeColor : inactiveColor}`} />
        <span className={`text-[9px] mt-1 font-bold ${currentScreen === 'hijriah' ? activeColor : inactiveColor}`}>Kalender</span>
      </button>
      
      {/* Floating Action Button - Diganti ke Al-Quran */}
      <div className="relative -top-8">
        <button onClick={() => navigateTo('quran')} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transform transition-transform active:scale-90 ${darkMode ? 'bg-pink-600 shadow-pink-900/50' : 'bg-rose-500 shadow-rose-200'}`}>
          <BookOpen size={28}/>
        </button>
      </div>

      <button onClick={() => navigateTo('tasbih')} className="flex flex-col items-center w-14">
        <div className={`w-5 h-5 rounded-full border-2 ${currentScreen === 'tasbih' ? activeColor : inactiveColor} flex items-center justify-center`}>
           <div className={`w-1.5 h-1.5 rounded-full ${currentScreen === 'tasbih' ? activeColor : inactiveColor}`}></div>
        </div>
        <span className={`text-[9px] mt-1 font-bold ${currentScreen === 'tasbih' ? activeColor : inactiveColor}`}>Tasbih</span>
      </button>
      <button onClick={() => navigateTo('pengaturan')} className="flex flex-col items-center w-14">
        <Settings className={`w-5 h-5 ${currentScreen === 'pengaturan' ? activeColor : inactiveColor}`} />
        <span className={`text-[9px] mt-1 font-bold ${currentScreen === 'pengaturan' ? activeColor : inactiveColor}`}>Seting</span>
      </button>
    </div>
  );
}
