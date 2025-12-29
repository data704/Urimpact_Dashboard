import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="topbar">
      {/* Left side - Mobile menu button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Right side - Language, Notification, User menu */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          {language.toUpperCase()}
        </button>

        {/* Notification Icon */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="user-menu" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-10 h-10 rounded-full bg-gray-900 text-white font-semibold text-sm flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            {getUserInitials(user?.name)}
          </button>

          {/* Dropdown menu */}
          {isUserMenuOpen && (
            <div className="user-menu-dropdown">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/admin/my-profile');
                }}
                className="user-menu-item w-full text-left"
              >
                <User size={16} />
                <span>{t('common.myProfile')}</span>
              </button>
              <button
                onClick={handleLogout}
                className="user-menu-item w-full text-left"
              >
                <LogOut size={16} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

