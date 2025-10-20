import React from 'react';
import { User } from '../../types';
import { View } from './MainLayout';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeView: View;
  setActiveView: (view: View) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const NavItem: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors relative ${
      isActive
        ? 'text-light-primary dark:text-primary'
        : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
    }`}
  >
    {label}
    {isActive && (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-light-primary dark:bg-primary rounded-full"></span>
    )}
  </button>
);

const Header: React.FC<HeaderProps> = ({ user, onLogout, activeView, setActiveView, theme, onThemeToggle }) => {
  const menuItems: { id: View, label: string }[] = [
    { id: 'vagas', label: 'Vagas' },
    { id: 'talentos', label: 'Banco de Talentos' },
    { id: 'assistencia', label: 'Assistência IA' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'entrevistas', label: 'Entrevistas' },
    { id: 'contratacoes', label: 'Contratações' },
  ];
  
  const adminMenuItems: { id: View, label: string }[] = [
    { id: 'arquivo', label: 'Arquivo' },
    { id: 'admin', label: 'Painel Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-light-surface/80 dark:bg-background/80 backdrop-blur-sm border-b border-light-border dark:border-border">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-light-primary dark:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
            <span className="ml-2 text-xl font-bold text-light-text-primary dark:text-text-primary">Lacoste Burger</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            {menuItems.map(item => (
              <NavItem
                key={item.id}
                label={item.label}
                isActive={activeView === item.id}
                onClick={() => setActiveView(item.id)}
              />
            ))}
            {user.role === 'admin' && (
              <>
                <div className="w-px h-6 bg-light-border dark:bg-border mx-2"></div>
                {adminMenuItems.map(item => (
                  <NavItem
                    key={item.id}
                    label={item.label}
                    isActive={activeView === item.id}
                    onClick={() => setActiveView(item.id)}
                  />
                ))}
              </>
            )}
          </nav>

          <div className="flex items-center">
            <span className="text-light-text-secondary dark:text-text-secondary text-sm mr-4 hidden sm:block">Bem-vindo, {user.username}</span>
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-light-surface dark:hover:bg-surface hover:text-light-text-primary dark:hover:text-text-primary focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-light-surface dark:hover:bg-surface hover:text-light-text-primary dark:hover:text-text-primary focus:outline-none"
              aria-label="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;