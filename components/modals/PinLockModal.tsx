import React, { useState, useRef, useEffect } from 'react';
import { TranslationKey, User } from '../../types';
import Icon from '../Icon';

interface PinLockModalProps {
    user: User;
    onClose: () => void;
    onVerify: (user: User, pin: string) => boolean;
    t: (key: TranslationKey) => string;
}

const PinLockModal: React.FC<PinLockModalProps> = ({ user, onClose, onVerify, t }) => {
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (/^[0-9]$/.test(value)) {
            const newPin = [...pin];
            newPin[index] = value;
            setPin(newPin);

            if (index < 3) {
                inputsRef.current[index + 1]?.focus();
            } else {
                // Auto-submit when the last digit is entered
                handleSubmit([...newPin].join(''));
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            const newPin = [...pin];
            if (newPin[index] === '') {
                if (index > 0) {
                    inputsRef.current[index - 1]?.focus();
                }
            } else {
                newPin[index] = '';
                setPin(newPin);
            }
        }
    };

    const handleSubmit = async (fullPin: string) => {
        if (isVerifying || fullPin.length !== 4) return;

        setError(null);
        setIsVerifying(true);
        
        await new Promise(resolve => setTimeout(resolve, 300));

        const success = onVerify(user, fullPin);

        if (!success) {
            setError(t('invalidPin'));
            setPin(['', '', '', '']);
            inputsRef.current[0]?.focus();
            const modal = document.getElementById('pin-lock-modal');
            if (modal) {
                modal.classList.add('shake-animation');
                setTimeout(() => modal.classList.remove('shake-animation'), 500);
            }
        }
        setIsVerifying(false);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(pin.join(''));
    };
    
    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <style>{`
                @keyframes shake {
                  10%, 90% { transform: translate3d(-1px, 0, 0); }
                  20%, 80% { transform: translate3d(2px, 0, 0); }
                  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                  40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .shake-animation {
                  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
            <div id="pin-lock-modal" className="shadow-2xl rounded-2xl max-w-sm w-full p-6 bg-slate-100 dark:bg-neutral-900 text-center">
                <Icon name="lock" className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{t('enterPinToUnlock')}</h3>
                <p className="text-sm mb-6 text-gray-600 dark:text-gray-400">{user.email}</p>

                <form onSubmit={handleFormSubmit}>
                    <div className="flex justify-center gap-3 mb-4" dir="ltr">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { if(el) inputsRef.current[index] = el; }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-12 h-14 text-center text-2xl font-bold rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                                disabled={isVerifying}
                            />
                        ))}
                    </div>
                     {error && (
                        <p className="text-xs mt-2 text-red-500 font-semibold animate-fade-in">{error}</p>
                    )}
                </form>

                <div className="mt-6 flex justify-center">
                     <button onClick={onClose} className="px-6 py-2 font-bold text-sm transition-colors rounded-lg bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-neutral-600">
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinLockModal;