import React from 'react';
import { useAppContext } from '@/context/AppContext';
import RetroLayout from '@/components/RetroLayout';
import CalendarWidget from '@/components/CalendarWidget';
import DiaryView from '@/components/DiaryView';
import BudgetView from '@/components/BudgetView';
import CalendarDetailView from '@/components/CalendarDetailView';
import TodoView from '@/components/TodoView';

const Home = () => {
  const { currentView, isLoading } = useAppContext();

  let MainContent;

  switch (currentView) {
    case 'diary':
      MainContent = <DiaryView />;
      break;
    case 'budget':
      MainContent = <BudgetView />;
      break;
    case 'calendar':
      MainContent = <CalendarDetailView />;
      break;
    case 'todo':
      MainContent = <TodoView />;
      break;
    default:
      MainContent = <DiaryView />;
  }

  return (
    <RetroLayout>
      <CalendarWidget />
      <div className="md:col-span-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-xl font-pixel text-dusty-blue">Loading...</div>
          </div>
        ) : (
          MainContent
        )}
      </div>
    </RetroLayout>
  );
};

export default Home;
