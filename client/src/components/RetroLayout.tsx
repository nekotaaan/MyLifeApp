import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import ChatAssistant from './ChatAssistant';

interface RetroLayoutProps {
  children: React.ReactNode;
}

const RetroLayout = ({ children }: RetroLayoutProps) => {
  const { currentView, setCurrentView } = useAppContext();

  const menuItems = [
    { id: 'diary', label: '📔 Diary', view: 'diary' as const },
    { id: 'budget', label: '💰 Budget', view: 'budget' as const },
    { id: 'calendar', label: '📅 Calendar', view: 'calendar' as const },
    { id: 'todo', label: '✓ To-Do', view: 'todo' as const }
  ];

  return (
    <div className="min-h-screen p-4 bg-light-gray">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-6">
          <div className="window w-full">
            <div className="title-bar">
              <h1 className="title-text text-xl">My Personal Space</h1>
              <div className="flex gap-1">
                <button className="w-4 h-4 bg-soft-red rounded-sm"></button>
                <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
                <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
              </div>
            </div>
            <div className="p-4 bg-dusty-blue/20 flex flex-wrap gap-3 justify-center md:justify-start">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "retro-button px-4 py-2 text-dark-gray font-pixel hover:bg-soft-lavender/30 transition-colors",
                    currentView === item.view && "bg-soft-lavender/30"
                  )}
                  onClick={() => setCurrentView(item.view)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {children}
        </main>

        <ChatAssistant />
      </div>
    </div>
  );
};

export default RetroLayout;
