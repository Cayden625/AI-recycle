
import React from 'react';
import { RecyclingInfo, MapStation } from '../types';
import { AlertCircle, MapPin, CheckCircle, ExternalLink, RefreshCw, Loader2, Info } from 'lucide-react';

interface ResultCardProps {
  image: string | null;
  info: RecyclingInfo | null;
  loading: boolean;
  stations: MapStation[];
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ image, info, loading, stations, onReset }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-slate-900">Identifying Waste...</p>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">AI analyzing material density</p>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const categoryColors: Record<string, string> = {
    Plastic: 'bg-blue-100 text-blue-800 border-blue-200',
    Paper: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Metal: 'bg-gray-100 text-gray-800 border-gray-200',
    Glass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    Electronic: 'bg-purple-100 text-purple-800 border-purple-200',
    Organic: 'bg-green-100 text-green-800 border-green-200',
    Hazardous: 'bg-red-100 text-red-800 border-red-200',
    Unknown: 'bg-stone-100 text-stone-800 border-stone-200'
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {image && (
        <div className="relative rounded-3xl overflow-hidden aspect-video shadow-2xl border-4 border-white">
          <img src={`data:image/png;base64,${image}`} alt="Analyzed waste" className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4">
             <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg border ${categoryColors[info.category] || 'bg-gray-100'}`}>
               {info.category}
             </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="px-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{info.itemName}</h2>
          <div className="flex items-center gap-2 mt-2 text-emerald-600">
            <Info size={16} className="fill-emerald-100" />
            <p className="font-black text-xs uppercase tracking-widest">Recycling Intelligence Report</p>
          </div>
        </div>

        <section className="bg-white rounded-3xl p-6 border-2 border-emerald-50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle size={80} className="text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
              <CheckCircle size={20} />
            </div>
            <h3 className="font-black text-lg text-slate-900">How to Recycle</h3>
          </div>
          <p className="text-slate-700 text-lg leading-relaxed font-bold relative z-10">{info.instructions}</p>
        </section>

        <section className="bg-white rounded-3xl p-6 border-2 border-orange-50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle size={80} className="text-orange-600" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-200">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-black text-lg text-slate-900">Environmental Consequence</h3>
          </div>
          <p className="text-slate-700 text-lg leading-relaxed font-bold relative z-10">{info.consequences}</p>
        </section>

        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="text-emerald-500" size={24} />
            <h3 className="font-black text-xl text-slate-900 tracking-tight">Nearest Recycling Stations</h3>
          </div>
          
          {stations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {stations.map((station, idx) => (
                <a 
                  key={idx}
                  href={station.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-800 truncate text-lg tracking-tight">{station.title}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Click for Directions</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-emerald-600 transition-colors">
                    <ExternalLink size={20} className="text-slate-400 group-hover:text-white" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Finding local facilities...</p>
            </div>
          )}
        </section>

        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-3 p-6 bg-slate-900 text-white font-black rounded-3xl hover:bg-emerald-600 transition-all shadow-xl active:scale-[0.98] mt-4"
        >
          <RefreshCw size={24} />
          <span className="text-lg">Analyze Another Item</span>
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
