
import React, { useState, useCallback, useEffect } from 'react';
import { Camera, MessageSquare, Leaf, History, User as UserIcon } from 'lucide-react';
import Header from './components/Header';
import CameraView from './components/CameraView';
import ResultCard from './components/ResultCard';
import AssistantChat from './components/AssistantChat';
import AuthScreen from './components/AuthScreen';
import HistoryView from './components/HistoryView';
import { RecyclingInfo, MapStation, User, ScanRecord } from './types';
import { analyzeRecyclable, findRecyclingStations } from './services/geminiService';
import { historyService } from './services/historyService';

enum AppView {
  HOME = 'home',
  CAMERA = 'camera',
  RESULT = 'result',
  ASSISTANT = 'assistant',
  AUTH = 'auth',
  HISTORY = 'history'
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recyclingInfo, setRecyclingInfo] = useState<RecyclingInfo | null>(null);
  const [stations, setStations] = useState<MapStation[]>([]);

  // Auth persistence check
  useEffect(() => {
    const savedUser = localStorage.getItem('ecolearn_current_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('ecolearn_current_user', JSON.stringify(u));
    setView(AppView.HOME);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ecolearn_current_user');
    setView(AppView.HOME);
  };

  const handleCapture = useCallback(async (base64Image: string) => {
    setLoading(true);
    setCapturedImage(base64Image);
    setView(AppView.RESULT);

    try {
      const info = await analyzeRecyclable(base64Image);
      setRecyclingInfo(info);

      // Save to history if logged in
      if (user) {
        historyService.saveScan(user.id, base64Image, info);
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const localStations = await findRecyclingStations(info.category, latitude, longitude);
          setStations(localStations);
        },
        async () => {
          const generalStations = await findRecyclingStations(info.category);
          setStations(generalStations);
        }
      );
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const viewHistoryRecord = (record: ScanRecord) => {
    setCapturedImage(record.image);
    setRecyclingInfo(record.info);
    setView(AppView.RESULT);
    // Find stations for the history item
    findRecyclingStations(record.info.category).then(setStations);
  };

  const reset = () => {
    setCapturedImage(null);
    setRecyclingInfo(null);
    setStations([]);
    setView(AppView.HOME);
  };

  const handleHistoryClick = () => {
    if (!user) {
      setView(AppView.AUTH);
    } else {
      setView(AppView.HISTORY);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <Header onHome={() => setView(AppView.HOME)} />

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {view === AppView.HOME && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fadeIn pt-8">
            <div className="bg-emerald-100 p-6 rounded-full relative">
              <Leaf size={64} className="text-emerald-600" />
              {user && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                {user ? `Hi, ${user.name.split(' ')[0]}!` : 'Hello Eco-Hero!'}
              </h1>
              <p className="text-gray-500">Ready to make a difference today? Let AI guide your recycling journey.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 w-full">
              <button 
                onClick={() => setView(AppView.CAMERA)}
                className="flex items-center justify-between p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl transition-all shadow-xl active:scale-95 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                    <Camera size={26} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xl">Analyze Item</p>
                    <p className="text-emerald-100 text-sm">Snap and learn instantly</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setView(AppView.ASSISTANT)}
                className="flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl transition-all shadow-xl active:scale-95 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                    <MessageSquare size={26} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xl">Eco Assistant</p>
                    <p className="text-blue-100 text-sm">Talk or type to AI</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={handleHistoryClick}
                className="flex items-center justify-between p-5 bg-stone-800 hover:bg-stone-900 text-white rounded-3xl transition-all shadow-xl active:scale-95 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-stone-700 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                    <History size={26} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xl">My History</p>
                    <p className="text-stone-300 text-sm">Review your past scans</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {view === AppView.CAMERA && (
          <CameraView onCapture={handleCapture} onCancel={() => setView(AppView.HOME)} />
        )}

        {view === AppView.RESULT && (
          <ResultCard 
            image={capturedImage} 
            info={recyclingInfo} 
            loading={loading} 
            stations={stations}
            onReset={reset}
          />
        )}

        {view === AppView.ASSISTANT && (
          <AssistantChat onBack={() => setView(AppView.HOME)} />
        )}

        {view === AppView.AUTH && (
          <AuthScreen onLogin={handleLogin} />
        )}

        {view === AppView.HISTORY && user && (
          <HistoryView 
            user={user} 
            onSelectRecord={viewHistoryRecord} 
            onLogout={handleLogout} 
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 flex justify-around items-center z-50">
        <button onClick={() => setView(AppView.HOME)} className={`flex flex-col items-center gap-1 transition-colors ${view === AppView.HOME ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Leaf size={24} className={view === AppView.HOME ? 'fill-emerald-600/10' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        
        <button onClick={() => setView(AppView.CAMERA)} className="bg-emerald-600 text-white p-4 rounded-full -mt-12 shadow-[0_10px_25px_-5px_rgba(5,150,105,0.4)] active:scale-90 transition-all border-4 border-white">
          <Camera size={28} />
        </button>
        
        <button onClick={handleHistoryClick} className={`flex flex-col items-center gap-1 transition-colors ${view === AppView.HISTORY || view === AppView.AUTH || view === AppView.ASSISTANT ? 'text-emerald-600' : 'text-gray-400'}`}>
          <History size={24} className={view === AppView.HISTORY ? 'fill-emerald-600/10' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Account</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
