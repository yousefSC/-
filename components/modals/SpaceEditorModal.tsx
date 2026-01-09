import React, { useState } from 'react';
import { Project, Space, TranslationKey } from '../../types';
import Icon from '../Icon';
import { SPACE_ICONS, SPACE_COLORS } from '../../constants';

interface SpaceEditorModalProps {
    space: Partial<Space> | null;
    allProjects: Project[];
    onClose: () => void;
    onSave: (space: Partial<Space>) => void;
    t: (key: TranslationKey) => string;
}

const SpaceEditorModal: React.FC<SpaceEditorModalProps> = ({ space, allProjects, onClose, onSave, t }) => {
    const [name, setName] = useState(space?.name || '');
    const [icon, setIcon] = useState(space?.icon || null);
    const [color, setColor] = useState(space?.color || null);
    const [projectIds, setProjectIds] = useState<string[]>(space?.projectIds || []);

    const isCreating = !space?.id;

    const handleSave = () => {
        onSave({ ...space, name, icon, color, projectIds });
    };

    const isSaveDisabled = isCreating && (!name.trim() || !icon || !color);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="shadow-2xl rounded-2xl max-w-md w-full bg-slate-100 dark:bg-neutral-900 flex flex-col max-h-[90vh]">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{isCreating ? t('newSpace') : t('editSpace')}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full">
                        <Icon name="x" className="w-5 h-5 text-gray-500" />
                    </button>
                </header>
                <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="space-name" className="block mb-1.5 font-semibold text-sm text-gray-600 dark:text-gray-400">{t('spaceName')}</label>
                            <input
                                id="space-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                                autoFocus
                            />
                        </div>

                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">{t('spaceIcon')}</h4>
                            <div className="grid grid-cols-6 gap-2">
                                {SPACE_ICONS.map(iconName => (
                                    <button
                                        key={iconName}
                                        onClick={() => setIcon(iconName)}
                                        className={`flex items-center justify-center aspect-square rounded-lg transition-all duration-200 ${icon === iconName ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110' : 'bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700'}`}
                                    >
                                        <Icon name={iconName} size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">{t('spaceColor')}</h4>
                            <div className="flex flex-wrap gap-3">
                                {SPACE_COLORS.map(colorOption => (
                                    <button
                                        key={colorOption.key}
                                        onClick={() => setColor(colorOption.key)}
                                        className={`w-8 h-8 rounded-full transition-all ${colorOption.class} ${color === colorOption.key ? `ring-2 ring-offset-2 dark:ring-offset-neutral-900 ${colorOption.ring}` : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
                <footer className="p-3 border-t border-slate-200 dark:border-neutral-800 flex-shrink-0 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        className="px-4 py-2.5 font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                        {t('saveSpace')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SpaceEditorModal;