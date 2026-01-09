import React, { useState, useMemo } from 'react';
import { TranslationKey, ChatSession } from '../../types';
import Icon from '../Icon';
import Tooltip from '../ui/Tooltip';
import { MESSAGE_REPORT_CATEGORIES, CHAT_REPORT_CATEGORIES, TEMPLATE_REPORT_CATEGORIES } from '../../constants';


interface ReportModalProps {
    session: ChatSession;
    onClose: () => void;
    t: (key: TranslationKey) => string;
}

const ReportModal: React.FC<ReportModalProps> = ({ session, onClose, t }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedReason, setSelectedReason] = useState<TranslationKey | null>(null);
    const [comment, setComment] = useState('');

    const { reportCategories, titleKey } = useMemo(() => {
        switch (session.reportContext) {
            case 'chat':
                return { reportCategories: CHAT_REPORT_CATEGORIES, titleKey: 'reportTitleChat' as TranslationKey };
            case 'template':
                return { reportCategories: TEMPLATE_REPORT_CATEGORIES, titleKey: 'reportTitleTemplate' as TranslationKey };
            case 'message':
            default:
                return { reportCategories: MESSAGE_REPORT_CATEGORIES, titleKey: 'reportTitleMessage' as TranslationKey };
        }
    }, [session.reportContext]);

    const handleSendReport = () => {
        if (!selectedCategory || !selectedReason) return;

        const categoryTitle = t(reportCategories[selectedCategory].titleKey);
        const reasonText = t(selectedReason);

        const subject = encodeURIComponent(`Report for ${session.reportContext || 'Item'}: ${session.id}`);
        const body = encodeURIComponent(
`Report Details:
----------------
Session ID: ${session.id}
Session Title: ${session.title}
Report Context: ${session.reportContext || 'message'}
Report Category: ${categoryTitle}
Reason: ${reasonText}
User Comment:
${comment || 'N/A'}

----------------
Chat Transcript (JSON):
----------------
${JSON.stringify(session.messages, null, 2)}`
        );

        window.location.href = `mailto:mepc355@gmail.com?subject=${subject}&body=${body}`;
        onClose();
    };

    const handleCategorySelect = (categoryKey: string) => {
        setSelectedCategory(categoryKey);
        setSelectedReason(null); // Reset reason when category changes
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="shadow-2xl rounded-2xl max-w-md w-full bg-slate-100 dark:bg-neutral-900 flex flex-col max-h-[90vh]">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Icon name="shield-alert" className="w-5 h-5 text-red-500" />
                        {t(titleKey)}
                    </h3>
                    <Tooltip text={t('close')}>
                      <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full">
                          <Icon name="x" className="w-5 h-5 text-gray-500" />
                      </button>
                    </Tooltip>
                </header>

                <main className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                    <div>
                        <label className="block mb-2 font-semibold text-sm text-gray-600 dark:text-gray-400">{t('reportCategory')}</label>
                        <div className="space-y-2">
                            {Object.keys(reportCategories).map((key) => {
                                const category = reportCategories[key as keyof typeof reportCategories];
                                return (
                                <button
                                    key={key}
                                    onClick={() => handleCategorySelect(key)}
                                    className={`w-full flex items-center text-start rtl:text-right gap-3 px-3 py-2 rounded-xl transition-colors ${selectedCategory === key ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-200 dark:hover:bg-neutral-800'}`}
                                >
                                    <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selectedCategory === key ? 'border-blue-600 bg-blue-600' : 'border-gray-400 dark:border-gray-500 bg-transparent'}`}>
                                        {selectedCategory === key && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className={`flex-1 text-sm ${selectedCategory === key ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {t(category.titleKey)}
                                    </span>
                                </button>
                            )})}
                        </div>
                    </div>

                    {selectedCategory && (
                        <div className="animate-fade-in">
                            <label className="block mb-2 font-semibold text-sm text-gray-600 dark:text-gray-400">{t('reportReason')}</label>
                            <div className="space-y-2">
                                {reportCategories[selectedCategory].reasons.map(reasonKey => (
                                    <button
                                        key={reasonKey}
                                        onClick={() => setSelectedReason(reasonKey)}
                                        className={`w-full flex items-center text-start rtl:text-right gap-3 px-3 py-2 rounded-xl transition-colors ${selectedReason === reasonKey ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-200 dark:hover:bg-neutral-800'}`}
                                    >
                                        <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selectedReason === reasonKey ? 'border-blue-600 bg-blue-600' : 'border-gray-400 dark:border-gray-500 bg-transparent'}`}>
                                            {selectedReason === reasonKey && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className={`flex-1 text-sm ${selectedReason === reasonKey ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {t(reasonKey)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="report-comment" className="block mb-2 font-semibold text-sm text-gray-600 dark:text-gray-400">{t('reportCommentOptional')}</label>
                        <textarea
                            id="report-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full p-2 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700 resize-none custom-scrollbar"
                        />
                    </div>
                </main>

                <footer className="p-3 border-t border-slate-200 dark:border-neutral-800 flex-shrink-0 flex justify-end">
                    <button
                        onClick={handleSendReport}
                        disabled={!selectedCategory || !selectedReason}
                        className="px-4 py-2.5 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                        {t('submitReport')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ReportModal;