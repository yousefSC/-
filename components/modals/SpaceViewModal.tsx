import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Space, Project, Message, TranslationKey, GenerationMode } from '../../types';
import Icon from '../Icon';
import ProjectCard from '../ui/ProjectCard';
import { SPACE_ICONS, SPACE_COLORS } from '../../constants';

// ProjectSelector as an internal component
const ProjectSelector: React.FC<{
  availableProjects: Project[];
  onSelect: (projectId: string) => void;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}> = ({ availableProjects, onSelect, onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="p-4 font-bold text-gray-800 dark:text-gray-200 border-b border-slate-200 dark:border-neutral-700">{t('addProjectToSpace')}</h3>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {availableProjects.length > 0 ? (
                        <ul className="space-y-1">
                            {availableProjects.map(p => (
                                <li key={p.id}>
                                    <button onClick={() => onSelect(p.id)} className="w-full flex items-center gap-3 p-2 text-start rtl:text-right rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700">
                                        <Icon name={p.type === 'HTML' ? 'code-xml' : p.type === 'JavaScript' ? 'zap' : 'smartphone'} className="w-5 h-5 flex-shrink-0 text-gray-500" />
                                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{p.prompt}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center p-8 text-sm text-gray-500">{t('noResults')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const CustomizationPanel: React.FC<{
    space: Space;
    onClose: () => void;
    onChange: (updates: Partial<Space>) => void;
    t: (key: TranslationKey) => string;
}> = ({ space, onClose, onChange, t }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="absolute inset-0 bg-black/30 z-20" onClick={onClose}>
            <div 
                ref={panelRef} 
                className="absolute top-0 right-0 rtl:right-auto rtl:left-0 h-full w-80 bg-slate-100 dark:bg-neutral-900 shadow-2xl flex flex-col inspection-panel"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
                    <h3 className="font-bold">{t('customizeSpace')}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700"><Icon name="x" size={18} /></button>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-6">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">{t('spaceIcon')}</h4>
                        <div className="grid grid-cols-6 gap-2">
                            {SPACE_ICONS.map(icon => (
                                <button 
                                    key={icon} 
                                    onClick={() => onChange({ icon })}
                                    className={`flex items-center justify-center aspect-square rounded-lg transition-colors ${ (space.icon || 'folder-kanban') === icon ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700'}`}
                                >
                                    <Icon name={icon} size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm mb-2">{t('spaceColor')}</h4>
                         <div className="flex flex-wrap gap-3">
                            {SPACE_COLORS.map(color => (
                                <button 
                                    key={color.key}
                                    onClick={() => onChange({ color: color.key === 'default' ? undefined : color.key })}
                                    className={`w-8 h-8 rounded-full transition-all ${color.class} ${(!space.color && color.key === 'default') || space.color === color.key ? `ring-2 ring-offset-2 dark:ring-offset-neutral-900 ${color.ring}` : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};


interface SpaceViewModalProps {
    space: Space;
    allProjects: Project[];
    allProjectMessages: Message[];
    onClose: () => void;
    onSave: (space: Space) => void;
    onOpenProject: (message: Message) => void;
    t: (key: TranslationKey) => string;
    onDeleteSpace: (spaceId: string) => void;
    onRenameProject: (projectId: string, newTitle: string) => void;
    onTogglePinProject: (projectId: string) => void;
    onDeleteProject: (projectId: string) => void;
    onForkProject: (prompt: string, type: GenerationMode) => void;
    onExportProject: (project: Project) => void;
    onExportId: (project: Project, setCopiedId: (id: string | null) => void) => void;
}

const SpaceViewModal: React.FC<SpaceViewModalProps> = (props) => {
    const { 
      space, allProjects, allProjectMessages, onClose, onSave, onOpenProject, t, onDeleteSpace,
      onRenameProject, onTogglePinProject, onDeleteProject, onForkProject, onExportProject, onExportId
    } = props;
    
    const [currentSpace, setCurrentSpace] = useState(space);
    const [isProjectSelectorOpen, setProjectSelectorOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(space.name);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (isEditingName) {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    useEffect(() => {
        setCurrentSpace(space);
    }, [space]);

    const projectsInSpace = useMemo(() => {
        return currentSpace.projectIds
            .map(id => allProjects.find(p => p.id === id))
            .filter((p): p is Project => !!p);
    }, [currentSpace.projectIds, allProjects]);

    const availableProjects = useMemo(() => {
        const idsInSpace = new Set(currentSpace.projectIds);
        return allProjects.filter(p => !idsInSpace.has(p.id));
    }, [currentSpace.projectIds, allProjects]);

    const handleUpdateSpace = (updates: Partial<Space>) => {
        const updatedSpace = { ...currentSpace, ...updates, lastModified: new Date() };
        setCurrentSpace(updatedSpace);
        onSave(updatedSpace as Space);
    };

    const handleAddProject = (projectId: string) => {
        handleUpdateSpace({ projectIds: [...currentSpace.projectIds, projectId] });
        setProjectSelectorOpen(false);
    };

    const handleRemoveProjectFromSpace = (projectId: string) => {
        handleUpdateSpace({ projectIds: currentSpace.projectIds.filter(id => id !== projectId) });
    };
    
    const handleOpenProject = (project: Project) => {
        const message = allProjectMessages.find(m => m.id === project.id);
        if (message) {
            onOpenProject(message);
        }
    };
    
    const handleSaveRename = () => {
        if (newName.trim() && newName.trim() !== currentSpace.name) {
            handleUpdateSpace({ name: newName.trim() });
        }
        setIsEditingName(false);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveRename();
        if (e.key === 'Escape') {
            setNewName(currentSpace.name);
            setIsEditingName(false);
        }
    }

    const headerTheme = SPACE_COLORS.find(c => c.key === currentSpace.color) || null;
    const headerClasses = `p-4 flex justify-between items-center flex-shrink-0 transition-colors ${
        headerTheme && headerTheme.key !== 'default'
        ? `${headerTheme.class} ${headerTheme.text}` 
        : 'border-b border-slate-200 dark:border-neutral-800'
    }`;
    const headerButtonHoverClass = headerTheme && headerTheme.key !== 'default' ? 'hover:bg-white/20' : 'hover:bg-slate-200 dark:hover:bg-neutral-800';

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-neutral-900 z-50 animate-fade-in flex flex-col">
            <header className={headerClasses}>
                <div className="flex items-center gap-4">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                             <Icon name="pencil" className="w-6 h-6 animate-wiggle" />
                             <input
                                ref={renameInputRef}
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onBlur={handleSaveRename}
                                onKeyDown={handleRenameKeyDown}
                                className={`text-xl font-bold bg-transparent border-b-2 outline-none ${headerTheme ? 'border-white/50 focus:border-white' : 'border-gray-400 focus:border-gray-800 dark:border-gray-500 dark:focus:border-gray-200'}`}
                             />
                        </div>
                    ) : (
                        <>
                            <Icon name={currentSpace.icon || 'folder-kanban'} className={`w-6 h-6 ${headerTheme ? 'opacity-80' : 'text-gray-800 dark:text-gray-200'}`} />
                            <h2 className={`text-xl font-bold ${headerTheme ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{currentSpace.name}</h2>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={() => setProjectSelectorOpen(true)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity ${headerTheme && headerTheme.key !== 'default' ? 'bg-white/20 text-white' : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black'}`}>
                        <Icon name="plus" className="w-4 h-4" />
                        <span>{t('addProjectToSpace')}</span>
                    </button>
                    <div ref={settingsMenuRef} className="relative">
                        <button onClick={() => setIsSettingsOpen(p => !p)} className={`p-2 rounded-full transition-colors ${headerButtonHoverClass}`}>
                            <Icon name="settings" className="w-5 h-5" />
                        </button>
                        {isSettingsOpen && (
                             <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in">
                                <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                                     <li><button onClick={() => { setIsEditingName(true); setNewName(currentSpace.name); setIsSettingsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"><Icon name="pencil" className="w-4 h-4 text-gray-500 dark:text-gray-400" /><span>{t('rename')}</span></button></li>
                                     <li><button onClick={() => { setIsCustomizing(true); setIsSettingsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"><Icon name="palette" className="w-4 h-4 text-gray-500 dark:text-gray-400" /><span>{t('customize')}</span></button></li>
                                     <li><div className="my-1 border-t border-slate-100 dark:border-neutral-700/50"></div></li>
                                     <li><button onClick={() => { onDeleteSpace(currentSpace.id); setIsSettingsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right text-red-600 dark:text-red-500 hover:!bg-red-500/10 dark:hover:!bg-red-500/10 transition-colors"><Icon name="trash-2" className="w-4 h-4 text-red-600 dark:text-red-500" /><span>{t('delete')}</span></button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${headerButtonHoverClass}`}>
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <main className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
                {projectsInSpace.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {projectsInSpace.map(p => (
                            <ProjectCard
                                key={p.id}
                                project={p}
                                t={t}
                                onView={() => handleOpenProject(p)}
                                actionTextKey="fork"
                                onAction={(proj) => onForkProject(proj.prompt, proj.type === 'HTML' ? 'code_generation' : proj.type === 'JavaScript' ? 'javascript_code_generation' : 'android_app_generation')}
                                onExport={onExportProject}
                                exportTextKey="exportProject"
                                onExportId={(proj) => onExportId(proj, setCopiedId)}
                                isIdCopied={copiedId === p.id}
                                onStartRename={() => setEditingProjectId(p.id)}
                                onSaveRename={(newTitle) => {
                                    onRenameProject(p.id, newTitle);
                                    setEditingProjectId(null);
                                }}
                                onCancelRename={() => setEditingProjectId(null)}
                                isEditing={editingProjectId === p.id}
                                onTogglePin={(proj) => onTogglePinProject(proj.id)}
                                onDelete={(proj) => onDeleteProject(proj.id)}
                                onRemoveFromSpace={() => handleRemoveProjectFromSpace(p.id)}
                                removeTextKey="removeProject"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Icon name="folder-off" className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">{t('noProjectsInSpace')}</h3>
                    </div>
                )}
                {isCustomizing && (
                    <CustomizationPanel
                        space={currentSpace}
                        onClose={() => setIsCustomizing(false)}
                        onChange={handleUpdateSpace}
                        t={t}
                    />
                )}
            </main>

            {isProjectSelectorOpen && (
                <ProjectSelector
                    availableProjects={availableProjects}
                    onSelect={handleAddProject}
                    onClose={() => setProjectSelectorOpen(false)}
                    t={t}
                />
            )}
        </div>
    );
};

export default SpaceViewModal;
