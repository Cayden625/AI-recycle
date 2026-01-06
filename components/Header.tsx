
import React from 'react';
import { Leaf } from 'lucide-react';

interface HeaderProps {
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHome }) => {
  return (
    <header className="p-4 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-40">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onHome}>
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Leaf className="text-white" size={20} />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-800">EcoLearn</span>
      </div>
    </header>
  );
};

export default Header;
