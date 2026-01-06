
import React from 'react';
import { RecyclingInfo, MapStation } from '../types';
import { AlertCircle, MapPin, CheckCircle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

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
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Analyzing materials...</p>
          <p className="text-sm text-slate-500 font-medium">Eco-intelligence in progress</p>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const categoryColors = {
    Plastic: 'bg-blue-100 text-blue-800 border border-blue-200',
    Paper: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    Metal: 'bg-gray-100 text-gray-800 border border-gray-200',
    Glass: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    Electronic: 'bg-purple-100 text-purple-800 border border-purple-200',
    Organic: 'bg-green-100 text-green-800 border border-green-200',
    Hazardous: 'bg-red-100 text-red-800 border border-red-200',
    Unknown: 'bg-stone-100 text-stone-800 border border-stone-200'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {image && (
        <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg border border-slate-100">
          <img src={`data:image/png;base64,${image}`} alt="Analyzed waste" className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3">
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${categoryColors[info.category] || 'bg-gray-100'}`}>
               {info.category}
             </span>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{info.itemName}</h2>
          <p className="text-emerald-700 font-bold text-sm uppercase tracking-wide mt-1">Recycling Guide</p>
        </div>

        <section className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-emerald-700" size={22} />
            <h3 className="font-extrabold text-emerald-900">How to Recycle</h3>
          </div>
          <p className="text-slate-800 text-base leading-relaxed font-medium">{info.instructions}</p>
        </section>

        <section className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-orange-700" size={22} />
            <h3 className="font-extrabold text-orange-900">Why it Matters</h3>
          </div>
          <p className="text-slate-800 text-base leading-relaxed font-medium">{info.consequences}</p>
        </section>

        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="text-slate-400" size={20} />
            <h3 className="font-extrabold text-slate-800">Nearby Drop-off Points</h3>
          </div>
          
          {stations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {stations.map((station, idx) => (
                <a 
                  key={idx}
                  href={station.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all group"
                >
                  <span className="font-bold text-slate-700 truncate mr-2">{station.title}</span>
                  <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-600" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-semibold text-sm">Searching for local facilities...</p>
            </div>
          )}
        </section>

        <button 
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 p-5 text-slate-500 font-bold hover:text-emerald-700 transition-colors bg-slate-100/50 rounded-2xl"
        >
          <RefreshCw size={20} />
          Scan Another Item
        </button>
      </div>
    </div>
  );
};

export default ResultCard;
