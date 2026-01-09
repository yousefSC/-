
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';
import SelectionModal from '../modals/SelectionModal';
import { TranslationKey } from '../../types';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  title: string;
  t: (key: TranslationKey) => string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, className, title, t }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleOpen = () => {
    if (isDesktop) {
      setDropdownOpen(p => !p);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleDropdownSelect = (optionValue: string) => {
    onChange(optionValue);
    setDropdownOpen(false);
  };

  const handleModalConfirm = (newValue: string) => {
    onChange(newValue);
    setIsModalOpen(false);
  };

  const defaultClassName = "w-full p-2.5 flex justify-between items-center gap-2 bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg text-start rtl:text-right";

  return (
    <>
      <div className="relative inline-block text-start rtl:text-right w-full" ref={selectRef}>
        <button
          onClick={handleOpen}
          className={className || defaultClassName}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen || isModalOpen}
        >
          <span>{selectedOption?.label || value}</span>
          <Icon name="chevrons-up-down" className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && isDesktop && (
          <div className="absolute z-10 w-max min-w-full mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-md animate-pop-in max-h-64 overflow-auto custom-scrollbar">
            <ul className="py-1">
              {options.map(option => (
                <li key={option.value}>
                  <button
                    onClick={() => handleDropdownSelect(option.value)}
                    className={`w-full text-start rtl:text-right px-4 py-3 text-base md:px-3 md:py-2 md:text-sm hover:bg-slate-100 dark:hover:bg-neutral-700 ${value === option.value ? 'font-bold bg-slate-100 dark:bg-neutral-700' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <SelectionModal
        isOpen={isModalOpen && !isDesktop}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        options={options}
        initialValue={value}
        title={title}
        t={t}
      />
    </>
  );
};

export default CustomSelect;
