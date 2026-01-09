import React, { useState, useEffect } from 'react';
import { Project, TranslationKey } from '../types';
import Icon from './Icon';
import CodeEditor from './ui/CodeEditor';

interface StreamingProjectViewProps {
  project?: Project;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  isOpen?: boolean;
  suggestions?: string[] | null;
  isLoading?: boolean;
  onSelectSuggestion?: (suggestion: string) => void;
  onGenerate?: () => void;
}

type AndroidTab = 'activity' | 'layout' | 'manifest';

const StreamingProjectView: React.FC<StreamingProjectViewProps> = ({ 
  project, 
  onClose, 
  t,
  isOpen,
  suggestions,
  isLoading,
  onSelectSuggestion,
  onGenerate 
}) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [displayedManifest, setDisplayedManifest] = useState('');
  const [displayedLayout, setDisplayedLayout] = useState('');
  const [displayedActivity, setDisplayedActivity] = useState('');
  const [activeTab, setActiveTab] = useState<AndroidTab>('manifest');

  useEffect(() => {
    if (!project) return;
    let animationFrameId: number;
    let isCancelled = false;

    const typeCode = (fullCode: string, setCode: React.Dispatch<React.SetStateAction<string>>): Promise<void> => {
      return new Promise(resolve => {
        let currentCode = '';
        let i = 0;
        const animate = () => {
          if (isCancelled) return;
          if (i < fullCode.length) {
            const chunkSize = Math.max(2, Math.floor(fullCode.length / 150)); // ~150 frames
            currentCode += fullCode.substring(i, Math.min(i + chunkSize, fullCode.length));
            setCode(currentCode);
            i += chunkSize;
            animationFrameId = requestAnimationFrame(animate);
          } else {
            setCode(fullCode); // Ensure it finishes with the full code
            resolve();
          }
        };
        animate();
      });
    };

    const startAnimation = async () => {
      if (project.type === 'HTML') {
        await typeCode(project.htmlContent || '', setDisplayedCode);
      } else if (project.type === 'JavaScript') {
        const code = project.text?.replace(/```javascript\n|```/g, '').trim() || '';
        await typeCode(code, setDisplayedCode);
      } else if (project.type === 'Android') {
        setActiveTab('manifest');
        await typeCode(project.manifestContent || '', setDisplayedManifest);
        if (isCancelled) return;
        setActiveTab('layout');
        await typeCode(project.layoutXmlContent || '', setDisplayedLayout);
        if (isCancelled) return;
        setActiveTab('activity');
        await typeCode(project.activityCodeContent || '', setDisplayedActivity);
      }
    };

    startAnimation();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
    };
  }, [project]);
  
  if (!project) {
    // Render as SuggestionsSheet
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md bg-slate-100 dark:bg-neutral-800 shadow-2xl animate-slide-up-from-bottom`}
                style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 pt-2">
                    <div className="w-10 h-1.5 bg-slate-300 dark:bg-neutral-600 rounded-full mx-auto mb-4"></div>
                    <h3 className="font-bold text-center mb-4">{t('aiSuggestions')}</h3>
                    {isLoading ? (
                        <div className="text-center p-4">{t('generatingSuggestions')}...</div>
                    ) : suggestions && suggestions.length > 0 ? (
                        <ul className="space-y-2">
                            {suggestions.map((s, i) => (
                                <li key={i}>
                                    <button
                                        onClick={() => onSelectSuggestion?.(s)}
                                        className="w-full text-start rtl:text-right p-3 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
                                    >
                                        {s}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-4">
                            <p>{t('noSuggestionsFound')}</p>
                            <p className="text-xs text-gray-500">{t('tryGeneratingAgain')}</p>
                        </div>
                    )}
                    <button
                        onClick={onGenerate}
                        className="w-full mt-4 px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-neutral-700 rounded-lg"
                    >
                        {t('regenerate')}
                    </button>
                </div>
            </div>
        </div>
    );
  }


  // Render as StreamingProjectView
  const TabButton: React.FC<{ tab: AndroidTab; labelKey: TranslationKey }> = ({ tab, labelKey }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-gray-800 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
        {t(labelKey)}
    </button>
  );

  const getActiveCode = () => {
    switch(activeTab) {
        case 'manifest': return displayedManifest;
        case 'layout': return displayedLayout;
        case 'activity': return displayedActivity;
        default: return '';
    }
  };

  const getActiveLang = () => {
    switch(activeTab) {
        case 'manifest': return 'xml';
        case 'layout': return 'xml';
        case 'activity': return 'kotlin';
        default: return 'javascript';
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-neutral-900 z-50 animate-fade-in flex flex-col">
      <header className="p-2 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 p-2">
            <div className="w-3 h-3 border-2 border-slate-400 dark:border-neutral-500 border-t-slate-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{t('generating')}...</span>
          </div>
        </div>
        <p className="absolute left-1/2 -translate-x-1/2 text-sm font-bold truncate max-w-[50%]">{project.prompt}</p>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
          <Icon name="x" className="w-5 h-5" />
        </button>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        {project.type === 'Android' && (
             <div className="flex-shrink-0 border-b border-slate-200 dark:border-neutral-800 px-2">
                <TabButton tab="manifest" labelKey="manifest" />
                <TabButton tab="layout" labelKey="layout" />
                <TabButton tab="activity" labelKey="activity" />
            </div>
        )}
        <div className="flex-1 overflow-hidden">
            <CodeEditor
                language={project.type === 'HTML' ? 'html' : project.type === 'JavaScript' ? 'javascript' : getActiveLang()}
                value={project.type === 'Android' ? getActiveCode() : displayedCode}
                readOnly
            />
        </div>
      </main>
    </div>
  );
};

export default StreamingProjectView;
