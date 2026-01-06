
import { ScanRecord, RecyclingInfo } from '../types';

const HISTORY_KEY = 'ecolearn_history';

export const historyService = {
  saveScan: (userId: string, image: string, info: RecyclingInfo): ScanRecord => {
    const history = historyService.getHistory(userId);
    const newRecord: ScanRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      timestamp: Date.now(),
      image,
      info
    };
    
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    allHistory.push(newRecord);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
    
    return newRecord;
  },

  getHistory: (userId: string): ScanRecord[] => {
    const allHistory: ScanRecord[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return allHistory
      .filter(record => record.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  deleteRecord: (recordId: string) => {
    const allHistory: ScanRecord[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const filtered = allHistory.filter(r => r.id !== recordId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  }
};
