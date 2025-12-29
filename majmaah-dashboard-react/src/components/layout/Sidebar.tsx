import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Server,
  Users,
  Trophy,
  FileText,
  Award,
  File,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import type { NavigationItem } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Use navigation based on user role with translations
  const navigation: NavigationItem[] = [
    { name: t('sidebar.dashboard'), path: '/admin', icon: LayoutDashboard },
    {
      name: t('sidebar.contentManagement'),
      group: true,
      icon: ClipboardList,
      items: [
        { name: t('sidebar.plantingRecordsCertificates'), path: '/admin/planting-records-certificates', icon: ClipboardList },
        { name: t('sidebar.departments'), path: '/admin/departments', icon: Server },
        { name: t('sidebar.employees'), path: '/admin/employees', icon: Users },
        { name: t('sidebar.plantingRecordAssignments'), path: '/admin/planting-record-assignments', icon: Trophy },
        { name: t('sidebar.certificationsHistory'), path: '/admin/certifications-history', icon: FileText },
      ],
    },
    {
      name: t('sidebar.companyCertificate'),
      group: true,
      icon: Award,
      items: [
        { name: t('sidebar.treesCertificate'), path: '/admin/trees-certificate', icon: Award },
        { name: t('sidebar.basicCertificate'), path: '/admin/basic-certificate', icon: File },
      ],
    },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed md:sticky top-0 h-screen z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <img
            src="/assets/img/URIMPACT_LOGO.png"
            alt="URIMPACT"
            className="h-11"
          />
        </div>

        {/* Navigation */}
        <nav className="p-2 overflow-y-auto" style={{ height: 'calc(100vh - 88px)' }}>
          {navigation.map((item, index) => {
            if (item.group && item.items) {
              return (
                <div key={index}>
                  <div className="sidebar-group-label">{item.name}</div>
                  {item.items.map((subItem, subIndex) => {
                    const Icon = subItem.icon;
                    const active = isActive(subItem.path);
                    return (
                      <Link
                        key={subIndex}
                        to={subItem.path!}
                        className={`sidebar-item ${active ? 'active' : ''}`}
                        onClick={() => {
                          if (window.innerWidth < 768) onClose();
                        }}
                      >
                        <Icon size={20} />
                        <span>{subItem.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={index}
                to={item.path!}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

