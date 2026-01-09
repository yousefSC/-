import React, { useState, useRef } from 'react';
import { User, TranslationKey } from '../../types';
import Icon from '../Icon';

interface ProfileEditorModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedProfile: Partial<User>) => void;
    t: (key: TranslationKey) => string;
}

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ user, onClose, onSave, t }) => {
    const [name, setName] = useState(user.firstName || '');
    const [picture, setPicture] = useState(user.profilePicture || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPicture(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = () => {
        if(name.trim()) {
            onSave({
                firstName: name.trim(),
                profilePicture: picture || undefined,
            });
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="shadow-2xl rounded-2xl max-w-sm w-full bg-slate-100 dark:bg-neutral-900 flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{t('editProfile')}</h3>
                     <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full">
                        <Icon name="x" className="w-5 h-5 text-gray-500" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-slate-300 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                                {picture ? (
                                    <img src={picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Icon name="user" className="w-12 h-12 text-gray-500" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icon name="camera" size={24} />
                            </button>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                     <div>
                        <label htmlFor="profile-name" className="block mb-1.5 font-semibold text-sm text-gray-600 dark:text-gray-400">{t('yourName')}</label>
                        <input
                            id="profile-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2.5 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                            autoFocus
                        />
                    </div>
                </main>
                 <footer className="p-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 font-bold text-xs transition-colors rounded-lg bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-neutral-600">{t('cancel')}</button>
                    <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-lg disabled:opacity-50">{t('save')}</button>
                </footer>
            </div>
        </div>
    );
};

export default ProfileEditorModal;