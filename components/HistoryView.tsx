
import React, { useState, useEffect } from 'react';
import { historyService } from '../services/historyService.ts';
import { ScanRecord, User } from '../types.ts';
import { Calendar, Trash2, ChevronRight, Search, Inbox } from 'lucide-react';

interface HistoryViewProps {
  user: User;
  onSelectRecord: (record: ScanRecord) => void;
  onLogout: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ user, onSelectRecord, onLogout }) => {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHistory(historyService.getHistory(user.id));
  }, [user.id]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    historyService.deleteRecord(id);
    setHistory(prev => prev.filter(r => r.id !== id));
  };

  const filteredHistory = history.filter(item => 
    item.info.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.info.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scan History</h2>
          <p className="text-gray-500 text-sm">Welcome back, {user.name}</p>
        </div>
        <button 
          onClick={onLogout}
          className="text-sm text-red-500 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search items or categories..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectRecord(item)}
              className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={`data:image/png;base64,${item.image}`} alt={item.info.itemName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{item.info.itemName}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                    {item.info.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => handleDelete(e, item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight className="text-gray-300" size={20} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
          <Inbox size={48} strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-medium">No records found</p>
            <p className="text-sm">Start scanning items to build your history!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
