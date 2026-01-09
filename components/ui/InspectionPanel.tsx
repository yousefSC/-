import React from 'react';
import { InspectionIssue, TranslationKey } from '../../types';
import Icon from '../Icon';
import Tooltip from './Tooltip';

interface InspectionPanelProps {
  issues: InspectionIssue[];
  onFix: () => void;
  onClose: () => void;
  isFixing: boolean;
  t: (key: TranslationKey) => string;
  titleKey: TranslationKey;
}

const InspectionPanel: React.FC<InspectionPanelProps> = ({ issues, onFix, onClose, isFixing, t, titleKey }) => {
  const issueIcon = (type: InspectionIssue['type']) => {
    switch (type) {
      case 'error': return <Icon name="x-circle" className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'warning': return <Icon name="alert-triangle" className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      case 'suggestion': return <Icon name="lightbulb" className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getIssueCount = (type: InspectionIssue['type']) => issues.filter(i => i.type === type).length;
  const errorCount = getIssueCount('error');
  const warningCount = getIssueCount('warning');
  const suggestionCount = getIssueCount('suggestion');

  return (
    <div
      className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-full max-w-sm h-full flex flex-col z-10 inspection-panel shadow-2xl bg-slate-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200"
      style={{ direction: 'ltr' }}
    >
      <header className="p-4 flex justify-between items-center flex-shrink-0 border-b border-slate-200 dark:border-neutral-700">
        <h3 className="font-bold text-base">{t(titleKey)}</h3>
        <Tooltip text={t('close')}>
          <button onClick={onClose} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"><Icon name="x" className="w-5 h-5" /></button>
        </Tooltip>
      </header>

      {issues.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Icon name="check-circle-2" className="w-16 h-16 text-green-500 mb-4" />
          <h4 className="font-bold text-lg">{t('codeLooksGreat')}</h4>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">{t('noIssuesFound')}</p>
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-slate-200 dark:border-neutral-700 flex-shrink-0">
            <div className="flex justify-around text-xs">
              <span className="flex items-center gap-1.5 font-bold text-red-500">{issueIcon('error')} {t('error')}: {errorCount}</span>
              <span className="flex items-center gap-1.5 font-bold text-yellow-500">{issueIcon('warning')} {t('warning')}: {warningCount}</span>
              <span className="flex items-center gap-1.5 font-bold text-blue-500">{issueIcon('suggestion')} {t('suggestion')}: {suggestionCount}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
            {issues.map((issue, index) => (
              <div key={index} className="p-3 rounded-xl bg-white dark:bg-neutral-900 shadow-sm border border-slate-200 dark:border-neutral-700/50">
                <div className="flex items-start gap-3">
                  {issueIcon(issue.type)}
                  <div className="flex-1">
                    <p className="text-sm font-bold capitalize">
                      {t(issue.type)}: {t('line')} {issue.line}
                    </p>
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{issue.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <footer className="p-3 border-t border-slate-200 dark:border-neutral-700">
            <button
              onClick={onFix}
              disabled={isFixing || issues.length === 0}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-blue-500/20"
            >
              {isFixing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                  {t('fixingCode')}
                </>
              ) : (
                <>
                  <Icon name="wand-2" className="w-5 h-5" />
                  {t('fixErrors')}
                </>
              )}
            </button>
          </footer>
        </>
      )}
    </div>
  );
};

export default InspectionPanel;
