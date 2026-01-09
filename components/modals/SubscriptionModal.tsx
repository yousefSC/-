import React, { useState, useEffect, useRef } from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';
import { DEV_MODE_ACTIVATION_CODE } from '../../constants';

interface SubscriptionModalProps {
  onClose: () => void;
  onCodeSubmit: (code: string) => boolean;
  t: (key: TranslationKey) => string;
  isProUnlocked: boolean;
  isNanoUnlocked: boolean;
}

interface Plan {
    key: 'free' | 'pro' | 'nano' | 'enterprise';
    nameKey: TranslationKey;
    priceKey: TranslationKey;
    billingKey?: TranslationKey;
    features: TranslationKey[];
    isPopular: boolean;
}

const cardBaseClasses = "relative p-6 rounded-2xl flex flex-col transition-all duration-300 h-full";
const cardThemeClasses = {
    free: 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100',
    pro: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
    nano: 'bg-neutral-900 text-white',
    enterprise: 'bg-neutral-900 text-white'
};

const PlanCard: React.FC<{
    plan: Plan;
    isCurrent: boolean;
    t: (key: TranslationKey) => string;
}> = ({ plan, isCurrent, t }) => {
    
    const isComingSoon = plan.priceKey === 'comingSoon';
    const isDarkBg = plan.key !== 'free';

    const buttonTextKey = isCurrent ? 'currentPlan' : isComingSoon ? 'comingSoon' : (plan.key === 'enterprise' ? 'contactSales' : 'choosePlan');
    const buttonDisabled = isCurrent || isComingSoon;

    return (
        <div className={`${cardBaseClasses} ${cardThemeClasses[plan.key]}`}>
            {plan.key === 'nano' && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            )}
            {plan.isPopular && !isCurrent && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="px-3 py-1 text-xs font-bold text-white bg-blue-500 rounded-full shadow-lg">{t('mostPopular')}</div>
                </div>
            )}

            <h3 className="text-xl font-bold">{t(plan.nameKey)}</h3>
            <p className="mt-2 text-3xl font-extrabold">
                {plan.priceKey === 'freePlan' ? t('freePlan') : t(plan.priceKey)}
            </p>

            <ul className="my-6 space-y-3 text-sm">
                {plan.features.map((featureKey, fIndex) => (
                    <li key={String(featureKey)} className="flex items-center gap-3 animate-feature-in" style={{ animationDelay: `${fIndex * 80}ms` }}>
                         <Icon name="check-circle-2" className={`w-5 h-5 flex-shrink-0 ${plan.key !== 'free' ? 'text-white/80' : 'text-green-500'}`} />
                        <span className={plan.key !== 'free' ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}>{t(featureKey)}</span>
                    </li>
                ))}
            </ul>

            <button
                disabled={buttonDisabled}
                className={`w-full mt-auto py-3 px-4 text-sm font-bold rounded-lg transition-transform transform ${
                    isCurrent
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black cursor-default'
                    : `cursor-not-allowed ${isDarkBg ? 'bg-white/20 text-white' : 'bg-slate-300 dark:bg-neutral-700 text-gray-500'}`
                }`}
            >
                {t(buttonTextKey)}
            </button>
        </div>
    );
};


const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onCodeSubmit, t, isProUnlocked, isNanoUnlocked }) => {
  const [planType, setPlanType] = useState<'individual' | 'enterprise'>('individual');
  const [showActivation, setShowActivation] = useState(false);
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const individualPlans: Plan[] = [
    {
      key: 'free',
      nameKey: 'freePlan',
      priceKey: 'freePlan',
      features: ['feature_pro_points', 'feature_agent_locked'],
      isPopular: false,
    },
    {
      key: 'pro',
      nameKey: 'proPlanName',
      priceKey: 'comingSoon',
      features: ['feature_pro_unlimited', 'feature_agent_points', 'feature_agent_locked_pro_plan'],
      isPopular: !isNanoUnlocked,
    },
    {
      key: 'nano',
      nameKey: 'agentPlan',
      priceKey: 'comingSoon',
      features: ['feature_all_pro', 'feature_agent_unlimited', 'feature_nano_points'],
      isPopular: isNanoUnlocked,
    }
  ];
  
  const enterprisePlan: Plan = {
      key: 'enterprise',
      nameKey: 'plan_enterprise_name',
      priceKey: 'plan_enterprise_price',
      features: [
        'feature_enterprise_unlimited',
        'feature_team_collab',
        'feature_enterprise_security',
        'feature_business_sso',
        'feature_enterprise_support'
      ],
      isPopular: false,
  };


  const handleActivate = () => {
    if (isLoading || !code) return;

    if (code.toLowerCase() === DEV_MODE_ACTIVATION_CODE.toLowerCase()) {
        onCodeSubmit(code);
        return;
    }

    setIsLoading(true);
    setFeedback(null);
    setTimeout(() => {
        const success = onCodeSubmit(code);
        if (success) {
            setFeedback({ type: 'success', message: t('codeActivated') });
        } else {
            setFeedback({ type: 'error', message: t('invalidCode') });
            setIsLoading(false);
        }
    }, 500);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code) handleActivate();
  };
  
  const getIsCurrent = (planKey: 'free' | 'pro' | 'nano' | 'enterprise') => {
    if (planKey === 'free') return !isProUnlocked;
    if (planKey === 'pro') return isProUnlocked && !isNanoUnlocked;
    if (planKey === 'nano') return isNanoUnlocked;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-neutral-900 z-50 animate-fade-in flex flex-col">
        <header className="p-4 flex justify-between items-center flex-shrink-0">
            <div className="w-8"></div> {/* Spacer */}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('subscriptionPlans')}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-neutral-700/50 rounded-full"><Icon name="x" className="w-5 h-5 text-gray-500" /></button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-6xl mx-auto">
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                    {planType === 'individual' ? t('upgradeToProDesc') : t('enterpriseViewDesc')}
                </p>
                
                <div className="p-1 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center mb-10 max-w-xs mx-auto">
                    <button
                        onClick={() => setPlanType('individual')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${planType === 'individual' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-gray-500'}`}
                    >
                        {t('individualPlans')}
                    </button>
                    <button
                        onClick={() => setPlanType('enterprise')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${planType === 'enterprise' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-gray-500'}`}
                    >
                        {t('enterprisePlans')}
                    </button>
                </div>
                
                {planType === 'individual' ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {individualPlans.map(plan => (
                            <PlanCard 
                                key={plan.key} 
                                plan={plan} 
                                isCurrent={getIsCurrent(plan.key as 'free'|'pro'|'nano')} 
                                t={t} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto">
                        <PlanCard plan={enterprisePlan} isCurrent={false} t={t} />
                    </div>
                )}


                <div className="mt-12 text-center">
                     <button onClick={() => setShowActivation(!showActivation)} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                            {t('haveACode')}
                    </button>
                </div>
                
                <div className={`grid transition-all duration-500 ease-in-out ${showActivation ? 'grid-rows-[1fr] opacity-100 pt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-2 max-w-sm mx-auto p-2 bg-slate-200 dark:bg-neutral-800 rounded-xl">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('activationCode')}
                                className="flex-1 px-3 py-2 text-sm rounded-md shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 border-2 border-transparent"
                            />
                            <button
                                onClick={handleActivate}
                                disabled={isLoading || !code}
                                className="px-4 py-2 font-bold text-sm bg-slate-800 md:hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-black md:dark:hover:bg-slate-300 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[40px] flex-shrink-0"
                            >
                                {isLoading ? <span className="w-4 h-4 border-2 border-current/50 border-t-current rounded-full animate-spin"></span> : t('activate')}
                            </button>
                        </div>
                        {feedback && (
                            <p className={`text-xs mt-2 font-medium text-center animate-fade-in ${feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {feedback.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
};

export default SubscriptionModal;
