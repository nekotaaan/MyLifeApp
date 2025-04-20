import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DiaryEntry, Expense, Task } from '@shared/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getRandomAssistantMessage } from '@/lib/utils';

type View = 'diary' | 'budget' | 'calendar' | 'todo';

interface AppContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  showAssistant: boolean;
  setShowAssistant: (show: boolean) => void;
  assistantMessage: string;
  setAssistantMessage: (message: string) => void;
  generateNewAssistantMessage: () => void;
  diaryEntries: DiaryEntry[];
  expenses: Expense[];
  tasks: Task[];
  isLoading: boolean;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('diary');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showAssistant, setShowAssistant] = useState<boolean>(true);
  const [assistantMessage, setAssistantMessage] = useState<string>(getRandomAssistantMessage());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch diary entries
  const { data: diaryEntries = [], isLoading: isLoadingDiary } = useQuery({
    queryKey: ['/api/diary'],
    onError: (error) => {
      toast({
        title: "Error fetching diary entries",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses'],
    onError: (error) => {
      toast({
        title: "Error fetching expenses",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/tasks'],
    onError: (error) => {
      toast({
        title: "Error fetching tasks",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const isLoading = isLoadingDiary || isLoadingExpenses || isLoadingTasks;

  // Generate a new random assistant message
  const generateNewAssistantMessage = () => {
    setAssistantMessage(getRandomAssistantMessage());
  };

  // Change assistant message periodically
  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    
    try {
      messageInterval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance to change message
          generateNewAssistantMessage();
        }
      }, 300000); // Check every 5 minutes instead of every minute to reduce overhead
    } catch (error) {
      console.error('Error setting up message interval:', error);
    }

    return () => {
      if (messageInterval) {
        clearInterval(messageInterval);
      }
    };
  }, []);

  // Refresh all data
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/diary'] });
    queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
  };

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      selectedDate,
      setSelectedDate,
      currentMonth,
      setCurrentMonth,
      showAssistant,
      setShowAssistant,
      assistantMessage,
      setAssistantMessage,
      generateNewAssistantMessage,
      diaryEntries,
      expenses,
      tasks,
      isLoading,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
