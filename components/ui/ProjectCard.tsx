import React, { useState, useRef, useEffect } from 'react';
import { Project, TranslationKey } from '../../types';
import Icon from '../Icon';
import Tooltip from '../ui/Tooltip';

interface ProjectCardProps {
  project: Project;
  t: (key: TranslationKey) => string;
  onView: (project: Project) => void;
  actionTextKey: TranslationKey;
  onAction?: (project: Project) => void;
  onExport?: (project: Project) => void;
  exportTextKey?: TranslationKey;
  onExportId?: (project: Project) => void;
  isIdCopied?: boolean;
  onStartRename?: () => void;
  onSaveRename?: (newTitle: string) => void;
  onCancelRename?: () => void;
  isEditing?: boolean;
  onTogglePin?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  isStreaming?: boolean;
  isBeingEdited?: boolean;
  onRemoveFromSpace?: (project: Project) => void;
  removeTextKey?: TranslationKey;
}

const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  const { 
    project, t, onView, actionTextKey, onAction, onExport, exportTextKey, onExportId, 
    isIdCopied, onStartRename, onSaveRename, onCancelRename, isEditing, 
    onTogglePin, onDelete, isStreaming, isBeingEdited, onRemoveFromSpace, removeTextKey
  } = props;
  const { type, prompt, isStopped } = project;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoveringMenu, setIsHoveringMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // State for inline editing
  const [editText, setEditText] = useState(project.prompt);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
      setEditText(project.prompt);
    }
  }, [isEditing, project.prompt]);

  const handleSave = () => {
    if (onSaveRename && editText.trim() && editText.trim() !== project.prompt) {
      onSaveRename(editText.trim());
    } else if (onCancelRename) {
      onCancelRename();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      if (onCancelRename) onCancelRename();
    }
  };

  const projectTypeConfig = {
    HTML: {
      icon: 'code-xml',
      colorClasses: 'text-indigo-400',
      decorations: (
        <>
          <div className="absolute top-3 right-3 w-10 h-10 border-2 border-indigo-400/20 rounded-lg transform rotate-12 transition-all duration-300 ease-out group-hover:-rotate-45 group-hover:scale-110"></div>
          <div className="absolute bottom-3 left-3 w-14 h-14 border-2 border-indigo-400/20 rounded-lg transform -rotate-12 transition-all duration-300 ease-out group-hover:rotate-45 group-hover:scale-110"></div>
        </>
      ),
    },
    JavaScript: {
      icon: 'zap',
      colorClasses: 'text-yellow-400',
      decorations: (
        <>
          <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-l-2 border-yellow-400/20 transform -rotate-45 transition-transform duration-500 ease-in-out group-hover:rotate-45 group-hover:scale-125"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-r-2 border-yellow-400/20 transform -rotate-45 transition-transform duration-500 ease-in-out group-hover:-rotate-90 group-hover:scale-125"></div>
        </>
      ),
    },
    Android: {
      icon: 'smartphone',
      colorClasses: 'text-green-400',
      decorations: (
        <>
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-green-500/30 to-transparent transition-all duration-300 group-hover:via-green-400"></div>
           <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-green-400/50 rounded-full transition-transform duration-300 group-hover:scale-[3]"></div>
           <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-green-400/50 rounded-full transition-transform duration-300 group-hover:scale-[3]"></div>
        </>
      ),
    },
  };

  const pinnedDecorations = (
    <>
      <Icon name="pin" className="absolute top-4 left-4 w-6 h-6 text-slate-200/50 dark:text-neutral-700/50 -rotate-45 transition-transform duration-300 group-hover:-rotate-55" />
      <Icon name="pin" className="absolute bottom-8 right-5 w-8 h-8 text-slate-200/50 dark:text-neutral-700/50 rotate-[30deg] transition-transform duration-300 group-hover:rotate-[20deg]" />
      <Icon name="pin" className="absolute top-1/2 left-1/3 w-5 h-5 text-slate-300/80 dark:text-neutral-600/80 rotate-[15deg] transition-all duration-300 ease-out group-hover:rotate-[5deg] group-hover:scale-125 group-hover:text-slate-400 dark:group-hover:text-neutral-500" />
      <Icon name="pin" className="absolute top-1/4 right-1/4 w-4 h-4 text-slate-300/80 dark:text-neutral-600/80 -rotate-[25deg] transition-all duration-300 ease-out delay-75 group-hover:-rotate-[10deg] group-hover:scale-125 group-hover:text-slate-400 dark:group-hover:text-neutral-500" />
    </>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willBeOpen = !isMenuOpen;
    setIsMenuOpen(willBeOpen);
    if (willBeOpen) {
        setIsHoveringMenu(true);
    }
  };

  const handleActionClick = (action?: (project: Project) => void) => {
    if (action) {
      action(project);
      if (action !== onExportId) {
          setIsMenuOpen(false);
      }
    }
  };

  const renderActionMenu = () => {
    const menuItemClass = "w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors";
    const iconClass = "w-4 h-4 text-gray-500 dark:text-gray-400";
    const hasNormalActions = onAction || onExport || onStartRename || onTogglePin || onExportId;
    
    return (
      <div 
        onMouseEnter={() => setIsHoveringMenu(true)}
        onMouseLeave={() => setIsHoveringMenu(false)}
        className={`absolute top-full mt-1 right-0 rtl:right-auto rtl:left-0 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-30 animate-pop-in transition-opacity duration-300 ${!isHoveringMenu ? 'opacity-75' : 'opacity-100'}`}
      >
        <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
          {onAction && actionTextKey && (
            <li><button onClick={() => handleActionClick(onAction)} className={menuItemClass}><Icon name="file-edit" className={iconClass} /><span>{t(actionTextKey)}</span></button></li>
          )}
          {onExport && exportTextKey && (
            <li><button onClick={() => handleActionClick(onExport)} className={menuItemClass}><Icon name="download" className={iconClass} /><span>{t(exportTextKey)}</span></button></li>
          )}
          {onExportId && (
            <li><button onClick={() => handleActionClick(onExportId)} className={menuItemClass}>
              <Icon name={isIdCopied ? "check" : "share-2"} className={`${iconClass} ${isIdCopied ? '!text-green-500' : ''}`} />
              <span>{isIdCopied ? t('projectIdCopied') : t('exportId')}</span>
            </button></li>
          )}
          {onStartRename && (
            <li><button onClick={() => { if(onStartRename) onStartRename(); setIsMenuOpen(false); }} className={menuItemClass}><Icon name="pencil" className={iconClass} /><span>{t('rename')}</span></button></li>
          )}
          {onTogglePin && (
            <li><button onClick={() => handleActionClick(onTogglePin)} className={menuItemClass}><Icon name={project.isPinned ? "pin-off" : "pin"} className={iconClass} /><span>{t(project.isPinned ? 'unpin' : 'pin')}</span></button></li>
          )}
          {onRemoveFromSpace && removeTextKey && (
            <li><button onClick={() => handleActionClick(onRemoveFromSpace)} className={menuItemClass}><Icon name="folder-minus" className={iconClass} /><span>{t(removeTextKey)}</span></button></li>
          )}
          {onDelete && hasNormalActions && <div className="my-1 border-t border-slate-100 dark:border-neutral-700/50"></div>}
          {onDelete && (
            <li>
              <button 
                onClick={() => handleActionClick(onDelete)} 
                className={`${menuItemClass} text-red-600 dark:text-red-500 hover:!bg-red-500/10 dark:hover:!bg-red-500/10`}
              >
                <Icon name="trash-2" className={`${iconClass} !text-red-600 dark:!text-red-500`} />
                <span>{t('deleteProject')}</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    );
  };

  const renderStreamingState = (isEditing: boolean) => {
    const config = projectTypeConfig[type];
    const processingText = isEditing ? t('editing') : t('generating');
    const iconName = isEditing ? 'wrench' : 'drafting-compass';
    const altIconName = isEditing ? 'cog' : 'file-code';
    
    return (
      <button onClick={() => onView(project)} className="relative w-full h-44 rounded-xl overflow-hidden bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/50 cursor-pointer">
        {project.isPinned ? pinnedDecorations : config.decorations}
        <div className="absolute inset-0 bg-slate-100/80 dark:bg-neutral-900/80 backdrop-blur-sm z-20"></div>
        <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none">
            <Icon name={iconName} className="absolute top-1/4 left-1/4 w-8 h-8 text-slate-400/50 dark:text-neutral-600/50" style={{ animation: 'wrench-float-1 3s ease-in-out infinite' }} />
            <Icon name={altIconName} className="absolute bottom-1/4 right-1/4 w-10 h-10 text-slate-400/50 dark:text-neutral-600/50 animate-spin" style={{ animationDuration: '5s' }} />
            <Icon name={iconName} className="absolute bottom-[20%] left-[60%] w-6 h-6 text-slate-400/50 dark:text-neutral-600/50 -rotate-[25deg]" style={{ animation: 'wrench-float-2 3.5s ease-in-out infinite alternate' }} />
        </div>
        <div className="relative z-40 w-full h-full p-4 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-2 mb-2">
                 <div className="w-4 h-4 border-2 border-slate-400 dark:border-neutral-500 border-t-slate-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
                 <p className="font-bold text-gray-800 dark:text-gray-200">{processingText}...</p>
            </div>
            <p className="font-semibold text-sm text-gray-600 dark:text-gray-400 line-clamp-2 px-2">{prompt}</p>
        </div>
      </button>
    );
  }

  if (isBeingEdited) return renderStreamingState(true);
  if (isStreaming) return renderStreamingState(false);


  if (isStopped) {
    return (
      <div className="w-full h-44 rounded-xl p-4 flex flex-col justify-center items-center text-center bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
        <Icon name="ban" className="w-10 h-10 text-red-500/70 mb-3" />
        <p className="font-bold text-gray-800 dark:text-gray-200">{t('responseStopped')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('pleaseTryAgain')}</p>
      </div>
    );
  }
  
  const config = projectTypeConfig[type];

  return (
    <div className="relative">
      <div className="group suggestion-card relative w-full h-44 rounded-xl transition-all duration-300 ease-in-out overflow-hidden bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/50">
        {project.isPinned ? pinnedDecorations : config.decorations}
        
        <button onClick={() => onView(project)} className="relative z-10 w-full h-full p-4 flex flex-col justify-between text-left rtl:text-right">
          <div className="flex justify-between items-start">
              <Icon name={config.icon} className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${config.colorClasses}`} />
              {project.isPinned && <Icon name="pin" className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0`} />}
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <Icon name="pencil" className="w-4 h-4 text-gray-500 animate-wiggle flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent focus:outline-none text-sm font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500/50 focus:border-blue-500"
                />
            </div>
          ) : (
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-3">{prompt}</p>
          )}
        </button>
      </div>

      {!isEditing && (
        <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 z-20" ref={menuRef}>
          <Tooltip text={t('more')}>
              <button 
                onClick={handleMenuToggle} 
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-700/50 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 transition-colors"
              >
                <Icon name="ellipsis" className="w-5 h-5" />
              </button>
          </Tooltip>
          {isMenuOpen && renderActionMenu()}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;