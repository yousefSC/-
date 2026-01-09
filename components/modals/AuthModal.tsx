import React, { useState } from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, pass: string) => string | null;
  onSignUp: (email: string, pass: string) => string | null;
  onForgotPassword: (email: string) => Promise<string | null>;
  t: (key: TranslationKey) => string;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-colors ${isActive ? 'border-blue-500 text-gray-800 dark:text-gray-100' : 'border-transparent text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
        {label}
    </button>
);

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, onSignUp, onForgotPassword, t }) => {
  const [view, setView] = useState<'signIn' | 'signUp' | 'forgotPassword'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  }

  const handleTabChange = (newView: 'signIn' | 'signUp') => {
    setView(newView);
    resetState();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
        if (view === 'signIn') {
            const authError = onLogin(email, password);
            if (authError) throw new Error(authError);
        } else if (view === 'signUp') {
            const authError = onSignUp(email, password);
            if (authError) throw new Error(authError);
        } else if (view === 'forgotPassword') {
            const authError = await onForgotPassword(email);
            if (authError) {
                throw new Error(authError);
            } else {
                setSuccess(t('resetEmailSent'));
            }
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  const renderSignIn = () => (
    <>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block mb-1 font-semibold text-xs text-gray-600 dark:text-gray-400">{t('emailAddress')}</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                    required
                    autoFocus
                />
            </div>
             <div>
                <div className="flex justify-between items-baseline">
                    <label htmlFor="password"  className="block mb-1 font-semibold text-xs text-gray-600 dark:text-gray-400">{t('password')}</label>
                    <button type="button" onClick={() => { setView('forgotPassword'); resetState(); }} className="text-xs font-semibold text-blue-600 hover:underline">{t('forgotPassword')}</button>
                </div>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {error && <p className="text-xs text-center text-red-500 font-semibold animate-fade-in">{error}</p>}
            
            <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-current/50 border-t-current rounded-full animate-spin"></span>
                ) : (
                    <span>{t('signIn')}</span>
                )}
            </button>
        </form>
         <div className="mt-4 text-center">
            <button
                onClick={() => handleTabChange('signUp')}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
               {t('dontHaveAccount')}
            </button>
        </div>
    </>
  );

  const renderSignUp = () => (
    <>
       <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email-signup" className="block mb-1 font-semibold text-xs text-gray-600 dark:text-gray-400">{t('emailAddress')}</label>
                <input
                    type="email"
                    id="email-signup"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                    required
                    autoFocus
                />
            </div>
             <div>
                <label htmlFor="password-signup"  className="block mb-1 font-semibold text-xs text-gray-600 dark:text-gray-400">{t('password')}</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password-signup"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                        required
                        minLength={6}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center px-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {error && <p className="text-xs text-center text-red-500 font-semibold animate-fade-in">{error}</p>}
            <button
                type="submit"
                disabled={isLoading || !email || password.length < 6}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
                {isLoading ? <span className="w-5 h-5 border-2 border-current/50 border-t-current rounded-full animate-spin"></span> : <span>{t('createAccount')}</span>}
            </button>
        </form>
         <div className="mt-4 text-center">
            <button onClick={() => handleTabChange('signIn')} className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
               {t('alreadyHaveAccount')}
            </button>
        </div>
    </>
  );

  const renderForgotPassword = () => (
    <div className="animate-fade-in">
        <h3 className="font-bold text-center text-gray-800 dark:text-gray-100">{t('resetPassword')}</h3>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1 mb-6">{t('resetPasswordDesc')}</p>
        
        {success ? (
             <div className="p-3 text-center bg-green-500/10 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold">
                {success}
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email-forgot" className="block mb-1 font-semibold text-xs text-gray-600 dark:text-gray-400">{t('emailAddress')}</label>
                    <input
                        type="email"
                        id="email-forgot"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                        required
                        autoFocus
                    />
                </div>
                {error && <p className="text-xs text-center text-red-500 font-semibold">{error}</p>}
                <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                    {isLoading ? <span className="w-5 h-5 border-2 border-current/50 border-t-current rounded-full animate-spin"></span> : <span>{t('sendResetLink')}</span>}
                </button>
            </form>
        )}
        <div className="mt-4 text-center">
            <button onClick={() => { setView('signIn'); resetState(); }} className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
               &larr; {t('back')}
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative shadow-2xl rounded-2xl max-w-sm w-full bg-slate-100 dark:bg-neutral-900 overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 rtl:right-auto rtl:left-3 z-20 p-1.5 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50 rounded-full"><Icon name="x" className="w-5 h-5 text-gray-500" /></button>
        
        <div className="p-8 pt-10">
            {view !== 'forgotPassword' && (
                <div className="border-b border-slate-200 dark:border-neutral-800 mb-6">
                  <div className="flex -mb-px">
                    <TabButton label={t('signIn')} isActive={view === 'signIn'} onClick={() => handleTabChange('signIn')} />
                    <TabButton label={t('signUp')} isActive={view === 'signUp'} onClick={() => handleTabChange('signUp')} />
                  </div>
                </div>
            )}

            {view === 'signIn' && renderSignIn()}
            {view === 'signUp' && renderSignUp()}
            {view === 'forgotPassword' && renderForgotPassword()}

        </div>
      </div>
    </div>
  );
};

export default AuthModal;