
import React, { useState } from 'react';
import { Leaf, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    try {
      const users = JSON.parse(localStorage.getItem('ecolearn_users') || '[]');
      
      if (isLogin) {
        const user = users.find((u: any) => u.email === formData.email && u.password === formData.password);
        if (user) {
          onLogin({ id: user.id, email: user.email, name: user.name });
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (users.find((u: any) => u.email === formData.email)) {
          setError('User already exists');
        } else {
          const newUser = { 
            id: Math.random().toString(36).substr(2, 9),
            ...formData 
          };
          users.push(newUser);
          localStorage.setItem('ecolearn_users', JSON.stringify(users));
          onLogin({ id: newUser.id, email: newUser.email, name: newUser.name });
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fadeIn">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex p-5 bg-emerald-100 rounded-3xl text-emerald-600 mb-2 shadow-sm">
            <Leaf size={44} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            {isLogin ? 'Welcome Back' : 'Join EcoLearn'}
          </h1>
          <p className="text-slate-600 font-bold">
            {isLogin ? 'Sign in to save your recycling history' : 'Create an account to track your impact'}
          </p>
        </div>

        <form onSubmit={handleAction} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-4 text-slate-400" size={20} />
              <input
                required
                type="text"
                placeholder="Full Name"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 transition-all shadow-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
            <input
              required
              type="email"
              placeholder="Email address"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold text-slate-900 transition-all shadow-sm"
              