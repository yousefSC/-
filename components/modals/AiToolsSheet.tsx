

import React, { useState, useEffect, useRef } from 'react';
import { Settings, TranslationKey, AiModel } from '../../types';
import Icon from '../Icon';

const ModelOption: React.FC<{
    model: AiModel;
    titleKey: TranslationKey;
    descKey: TranslationKey;
    currentModel: AiModel;
    onClick: (model: AiModel) => void;
    t: (key: TranslationKey) => string;
    proPoints?: number;
    agentPoints?: number;
    isProUnlocked?: boolean;
    isNanoUnlocked?: boolean;
}> = ({ model, titleKey, descKey, currentModel, onClick, t, proPoints, agentPoints, isProUnlocked, isNanoUnlocked }) => {
    const MAX_PRO_POINTS = 300;
    const MAX_AGENT_POINTS = 500;
    
    const isLocked = 
        (!isProUnlocked && (model === 'pro' || model === 'agent')) ||
        (isProUnlocked && !isNanoUnlocked && model === 'agent');

    const renderStatus = () => {
        // UNLIMITED BADGE
        const unlimitedBadge = (
            <div className="mt-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white dark:text-black bg-slate-800 dark:bg-slate-200">
                    <Icon name="infinity" className="w-3.5 h-3.5" />
                    <span>{t('unlimited')}</span>
                </div>
            </div>
        );
        
        // POINTS BADGE
        const pointsBadge = (points: number, maxPoints: number, icon: string, iconColor: string) => (
            <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-2 rounded-full bg-slate-200 dark:bg-neutral-700 px-3 py-1">
                    <Icon name={icon} className={`w-3.5 h-3.5 ${iconColor}`} />
                    <p className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-200">
                        {points} <span className="font-sans font-normal text-gray-500 dark:text-gray-400">/ {maxPoints} {t('points')}</span>
                    </p>
                </div>
            </div>
        );

        // Free Plan
        if (!isProUnlocked) {
            if (model === 'smooth' && proPoints !== undefined) {
                return pointsBadge(proPoints, MAX_PRO_POINTS, 'zap', 'text-blue-400');
            }
        }
        // Pro Plan
        else if (isProUnlocked && !isNanoUnlocked) {
            if (model === 'smooth') return unlimitedBadge;
            if (model === 'pro' && agentPoints !== undefined) {
                 return pointsBadge(agentPoints, MAX_AGENT_POINTS, 'crown', 'text-yellow-400');
            }
        }
        // Nano Plan
        else if (isNanoUnlocked) {
            if (model === 'smooth' || model === 'pro') return unlimitedBadge;
            if (model === 'agent' && agentPoints !== undefined) {
                return pointsBadge(agentPoints, MAX_AGENT_POINTS, 'brain', 'text-purple-400');
            }
        }
        return null;
    }

    return (
        <button 
            onClick={() => onClick(model)}
            disabled={isLocked}
            className="w-full flex items-start justify-between p-3 text-start rtl:text-right rounded-lg transition-colors md:hover:bg-slate-200 md:dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t(titleKey)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(descKey)}
                </p>
                {renderStatus()}
            </div>
            {isLocked ? (
                <Icon name="lock" className="w-5 h-5 text-gray-500 flex-shrink-0 ltr:ml-3 rtl:mr-3 mt-1" />
            ) : (
                currentModel === model && <Icon name="check" className="w-5 h-5 text-blue-500 flex-shrink-0 ltr:ml-3 rtl:mr-3 mt-1" />
            )}
        </button>
    );
};

const ToolIconButton: React.FC<{
    icon: string;
    titleKey: TranslationKey;
    descKey: TranslationKey;
    isActive: boolean;
    onClick: () => void;
    t: (key: TranslationKey) => string;
}> = ({ icon, titleKey, descKey, isActive, onClick, t }) => (
    <div className="relative group flex flex-col items-center gap-1.5">
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform md:hover:scale-110 ${
                isActive
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black'
                    : 'bg-slate-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 md:hover:bg-slate-300 md:dark:hover:bg-neutral-600'
            }`}
        >
            <Icon name={icon} className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t(titleKey)}</span>
        {/* Tooltip for desktop */}
        <div className="absolute bottom-full mb-2 w-max max-w-[200px] px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 hidden md:block text-center">
            {t(descKey)}
             <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800"></div>
        </div>
    </div>
);


const CreativityControl: React.FC<{
    currentValue: number;
    onChange: (value: number) => void;
    t: (key: TranslationKey) => string;
}> = ({ currentValue, onChange, t }) => {
    const options = [
        { labelKey: 'focused' as TranslationKey, value: 0.2, icon: 'target' },
        { labelKey: 'balanced' as TranslationKey, value: 0.7, icon: 'scale' },
        { labelKey: 'creative' as TranslationKey, value: 1.0, icon: 'dices' },
    ];

    const activeIndex = options.findIndex(o => o.value === currentValue);
    
    // RTL Fix: Adjust index for positioning based on document direction
    const [isRtl, setIsRtl] = useState(false);
    useEffect(() => {
        setIsRtl(document.documentElement.dir === 'rtl');
    }, []);

    const visualIndex = isRtl ? (options.length - 1 - activeIndex) : activeIndex;
    const indicatorPosition = activeIndex !== -1 ? `${visualIndex * (100 / 3)}%` : '33.33%';
    const indicatorWidth = `${100 / 3}%`;

    return (
        <div className="p-3">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t('creativityControl')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('creativityControlDesc')}</p>
            <div className="relative mt-3 flex w-full cursor-pointer items-center justify-center rounded-full bg-slate-200 dark:bg-neutral-700 p-1 h-10">
                <span
                    className="absolute top-1 h-8 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out dark:bg-neutral-800"
                    style={{
                        left: indicatorPosition,
                        width: indicatorWidth,
                    }}
                />
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className="relative z-10 flex-1 text-center text-xs font-bold transition-colors h-full flex items-center justify-center"
                    >
                        <span className={`flex items-center justify-center gap-1.5 ${currentValue === option.value ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}`}>
                            <Icon name={option.icon} className="w-4 h-4" />
                            {t(option.labelKey)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};


interface AiToolsSheetProps {
  onClose: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  t: (key: TranslationKey) => string;
  proPoints: number;
  agentPoints: number;
  isProUnlocked: boolean;
  isNanoUnlocked: boolean;
  showCreativityControl?: boolean;
}

const AiToolsSheet: React.FC<AiToolsSheetProps> = ({ onClose, settings, setSettings, t, proPoints, agentPoints, isProUnlocked, isNanoUnlocked, showCreativityControl = false }) => {
    const [isClosing, setIsClosing] = useState(false);
    const timerRef = useRef<number | null>(null);

    const handleClose = () => {
        setIsClosing(true);
        timerRef.current = window.setTimeout(() => {
            onClose();
        }, 300); // Animation duration
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const handleModelChange = (model: AiModel) => {
        setSettings(prev => ({...prev, model}));
    };

    const handleToggleChange = (key: keyof Settings, value: boolean) => {
        setSettings(prev => ({...prev, [key as string]: value }));
    };

    const handleProjectTemperatureChange = (value: number) => {
        setSettings(prev => ({ ...prev, projectTemperature: value }));
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center animate-fade-in"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={`w-full max-w-md bg-slate-100 dark:bg-neutral-800 shadow-2xl ${isClosing ? 'animate-slide-down-to-bottom' : 'animate-slide-up-from-bottom'}`}
                style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 pt-2">
                    <div className="w-10 h-1.5 bg-slate-300 dark:bg-neutral-600 rounded-full mx-auto mb-4"></div>
                    
                    <h3 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 px-3 text-start">{t('model')}</h3>
                    <div className="space-y-1 mb-4">
                        <ModelOption model="smooth" titleKey="smooth" descKey="modelSmoothDesc" currentModel={settings.model} onClick={handleModelChange} t={t} proPoints={proPoints} isProUnlocked={isProUnlocked} />
                        <ModelOption model="pro" titleKey="pro" descKey="modelProDesc" currentModel={settings.model} onClick={handleModelChange} t={t} agentPoints={agentPoints} isProUnlocked={isProUnlocked} />
                        <ModelOption model="agent" titleKey="agent" descKey="modelAgentDesc" currentModel={settings.model} onClick={handleModelChange} t={t} agentPoints={agentPoints} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked}/>
                    </div>

                    <div className="border-t border-slate-200 dark:border-neutral-700 my-4"></div>

                    <h3 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase mb-4 text-start px-3">{t('aiTools')}</h3>
                    <div className="flex justify-around items-start p-3">
                         <ToolIconButton
                            icon="globe"
                            titleKey="webSearch"
                            descKey="webSearchDesc"
                            isActive={!!settings.useWebSearch}
                            onClick={() => handleToggleChange('useWebSearch', !settings.useWebSearch)}
                            t={t}
                        />
                        <ToolIconButton
                            icon="wrench"
                            titleKey="autoCorrectCode"
                            descKey="autoCorrectCodeDesc"
                            isActive={!!settings.autoFixCode}
                            onClick={() => handleToggleChange('autoFixCode', !settings.autoFixCode)}
                            t={t}
                        />
                        <ToolIconButton
                            icon="cpu"
                            titleKey="deepThinking"
                            descKey="deepThinkingDesc"
                            isActive={!!settings.useDeepThinking}
                            onClick={() => handleToggleChange('useDeepThinking', !settings.useDeepThinking)}
                            t={t}
                        />
                    </div>
                    {showCreativityControl && (
                        <>
                            <div className="border-t border-slate-200 dark:border-neutral-700 my-2"></div>
                            <CreativityControl
                                currentValue={settings.projectTemperature}
                                onChange={handleProjectTemperatureChange}
                                t={t}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiToolsSheet;