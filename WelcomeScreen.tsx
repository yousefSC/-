
import React from 'react';
// FIX: Corrected import path to point to the components directory.
import Icon from './components/Icon';
// FIX: Corrected import path for types file at the root.
import { TranslationKey } from './types';

interface WelcomeScreenProps {
  onQuestionClick: (question: string) => void;
  t: (key: TranslationKey) => string;
}

const PredefinedQuestion: React.FC<{
  question: string;
  icon: string;
  onClick: () => void;
  design: 'react' | 'comparison' | 'debug' | 'python' | 'oop';
}> = ({ question, icon, onClick, design }) => {
  const baseClasses = "group suggestion-card flex-shrink-0 w-36 h-28 flex flex-col p-3 rounded-xl transition-all duration-300 ease-in-out overflow-hidden relative text-neutral-800 dark:text-white bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/50";

  const CardContent: React.FC<{icon: string, question: string, iconClasses?: string}> = ({icon, question, iconClasses}) => (
      <div className="z-10 flex-1 flex flex-col justify-between h-full">
         <Icon name={icon} className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${iconClasses || ''}`} />
         <span className="font-semibold text-start text-xs">{question}</span>
      </div>
  );

  switch (design) {
    case 'react':
      return (
        <button onClick={onClick} className={`${baseClasses}`}>
          <div className="absolute -top-8 -right-8 w-24 h-24 border-2 border-sky-500/20 rounded-full transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-12"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 border border-sky-500/20 rounded-full transition-transform duration-500 ease-out delay-100 group-hover:scale-125 group-hover:rotate-12"></div>
          <CardContent icon={icon} question={question} iconClasses="text-sky-400"/>
        </button>
      );
    case 'comparison':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent transition-all duration-300 group-hover:via-purple-400"></div>
                 <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400/50 rounded-full transition-transform duration-300 group-hover:scale-[3]"></div>
                 <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-purple-400/50 rounded-full transition-transform duration-300 group-hover:scale-[3]"></div>
                 <CardContent icon={icon} question={question} iconClasses="text-purple-400" />
            </button>
        );
    case 'debug':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#ef444411_1px,transparent_1px),linear-gradient(to_bottom,#ef444411_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ef444422_1px,transparent_1px),linear-gradient(to_bottom,#ef444422_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <div className="absolute top-8 left-4 w-10 h-px bg-red-500/70 animate-pulse transition-all duration-300 group-hover:w-16"></div>
                <div className="absolute bottom-8 right-4 w-10 h-px bg-red-500/70 animate-pulse transition-all duration-300 group-hover:w-16" style={{animationDelay: '0.5s'}}></div>
                <CardContent icon={icon} question={question} iconClasses="text-red-500" />
            </button>
        );
    case 'python':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                 <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-l-2 border-yellow-400/20 transform -rotate-45 transition-transform duration-500 ease-in-out group-hover:rotate-45 group-hover:scale-125"></div>
                 <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-r-2 border-yellow-400/20 transform -rotate-45 transition-transform duration-500 ease-in-out group-hover:-rotate-90 group-hover:scale-125"></div>
                 <CardContent icon={icon} question={question} iconClasses="text-yellow-400"/>
            </button>
        );
    case 'oop':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-3 right-3 w-10 h-10 border-2 border-indigo-400/20 rounded-lg transform rotate-12 transition-all duration-300 ease-out group-hover:-rotate-45 group-hover:scale-110"></div>
                <div className="absolute bottom-3 left-3 w-14 h-14 border-2 border-indigo-400/20 rounded-lg transform -rotate-12 transition-all duration-300 ease-out group-hover:rotate-45 group-hover:scale-110"></div>
                <div className="absolute top-1/2 left-1/2 w-0.5 h-10 bg-indigo-400/10 transform -translate-x-1/2 -translate-y-1/2 rotate-45 transition-all duration-300 ease-out group-hover:scale-x-150 group-hover:rotate-90"></div>
                <CardContent icon={icon} question={question} iconClasses="text-indigo-400"/>
            </button>
        );
    default:
      return null;
  }
};


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onQuestionClick, t }) => {
  type SuggestionDesign = 'react' | 'comparison' | 'debug' | 'python' | 'oop';
  const questions: {key: TranslationKey, icon: string, design: SuggestionDesign}[] = [
    { key: "q_react_hooks", icon: "puzzle", design: 'react' },
    { key: "q_cpp_vs_python", icon: "git-compare-arrows", design: 'comparison' },
    { key: "q_fix_reference_error", icon: "bug-play", design: 'debug' },
    { key: "q_python_function_example", icon: "file-code-2", design: 'python' },
    { key: "q_explain_oop", icon: "workflow", design: 'oop' }
  ];

  return (
    <div className="flex flex-col h-full text-center p-4">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="flex items-center justify-center pb-8">
            <h2 className="text-4xl font-extrabold tracking-wider text-slate-400 dark:text-neutral-800 font-brand">
                NANOM AI STUDIO
            </h2>
        </div>
      </div>

      <div className="flex-shrink-0 w-full max-w-3xl mx-auto">
        <div className="flex flex-nowrap overflow-x-auto justify-start md:justify-center gap-4 py-2 custom-scrollbar -mx-4 px-4">
            {questions.map(q => (
              <PredefinedQuestion
                key={String(q.key)}
                question={t(q.key)}
                icon={q.icon}
                onClick={() => onQuestionClick(t(q.key))}
                design={q.design}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
