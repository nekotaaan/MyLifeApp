import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { formatDateFull, formatCurrency, isSameDay } from '@/lib/utils';
import { DiaryEntry, Expense, Task } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Edit, Plus, PlusCircle } from 'lucide-react';

const CalendarDetailView = () => {
  const { selectedDate, setSelectedDate, diaryEntries, expenses, tasks, setCurrentView } = useAppContext();
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const queryClient = useQueryClient();

  // Format the selected date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Find diary entry for selected date
  const diaryEntry = useMemo(() => {
    return diaryEntries.find(entry => 
      isSameDay(new Date(entry.date), selectedDate)
    );
  }, [diaryEntries, selectedDate]);

  // Find tasks for selected date
  const todayTasks = useMemo(() => {
    return tasks.filter(task => 
      isSameDay(new Date(task.dueDate), selectedDate)
    );
  }, [tasks, selectedDate]);

  // Find expenses for selected date
  const todayExpenses = useMemo(() => {
    return expenses.filter(expense => 
      isSameDay(new Date(expense.date), selectedDate)
    );
  }, [expenses, selectedDate]);

  const dailyTotal = useMemo(() => {
    return todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [todayExpenses]);

  // Handle moving to previous/next day
  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Handle editing diary entry
  const handleEditDiaryEntry = () => {
    setCurrentView('diary');
  };

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: number) => {
      return apiRequest('PATCH', `/api/tasks/${taskId}/toggle`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (description: string) => {
      return apiRequest('POST', '/api/tasks', {
        description,
        dueDate: dateString,
        completed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setNewTaskDescription('');
      setAddingTask(false);
      toast({
        title: "Success",
        description: "Task added",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add task",
        variant: "destructive",
      });
    },
  });

  // Handle task toggle
  const handleTaskToggle = (taskId: number) => {
    toggleTaskMutation.mutate(taskId);
  };

  // Handle add task
  const handleAddTask = () => {
    setAddingTask(true);
  };

  // Save new task
  const handleSaveTask = () => {
    if (newTaskDescription.trim()) {
      createTaskMutation.mutate(newTaskDescription.trim());
    }
  };

  // Add new expense
  const handleAddExpense = () => {
    setCurrentView('budget');
  };

  return (
    <div className="view calendar-view">
      <div className="window">
        <div className="title-bar">
          <h2 className="title-text">Calendar Details</h2>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-soft-red rounded-sm"></button>
            <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
            <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-pixel text-lg">{formatDateFull(selectedDate)}</h3>
            <div className="flex gap-2">
              <button 
                className="retro-button px-3 py-1 text-sm font-pixel"
                onClick={handlePrevDay}
              >
                ◀ Prev
              </button>
              <button 
                className="retro-button px-3 py-1 text-sm font-pixel"
                onClick={handleNextDay}
              >
                Next ▶
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="window">
              <div className="title-bar">
                <h3 className="title-text text-sm">Diary Entry</h3>
              </div>
              <div className="p-3 bg-white h-48 overflow-y-auto">
                {diaryEntry ? (
                  <div>
                    <h4 className="font-nunito font-bold mb-2">{diaryEntry.title}</h4>
                    <p className="text-sm font-nunito">{diaryEntry.content}</p>
                    {diaryEntry.tags && diaryEntry.tags.length > 0 && (
                      <div className="mt-2 text-xs">
                        {diaryEntry.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="bg-dusty-blue/30 text-dark-gray px-2 py-0.5 rounded mr-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500 gap-2">
                    <AlertCircle className="h-6 w-6" />
                    <p>No diary entry for this date</p>
                  </div>
                )}
                <div className="flex justify-center mt-2">
                  <button 
                    className="retro-button px-3 py-1 text-xs font-pixel"
                    onClick={handleEditDiaryEntry}
                  >
                    {diaryEntry ? 'Edit Entry' : 'Add Entry'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="window">
              <div className="title-bar">
                <h3 className="title-text text-sm">Tasks</h3>
              </div>
              <div className="p-3 bg-white h-48 overflow-y-auto">
                {todayTasks.length > 0 ? (
                  <ul className="space-y-2">
                    {todayTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`task-${task.id}`} 
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                        />
                        <Label 
                          htmlFor={`task-${task.id}`}
                          className={`text-sm font-nunito ${task.completed ? 'line-through text-gray-400' : ''}`}
                        >
                          {task.description}
                        </Label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500 gap-2">
                    <AlertCircle className="h-6 w-6" />
                    <p>No tasks for this date</p>
                  </div>
                )}
                
                {addingTask ? (
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="New task..."
                      className="retro-input text-sm"
                    />
                    <Button 
                      className="retro-button px-2 py-1 h-auto"
                      onClick={handleSaveTask}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center mt-3">
                    <button 
                      className="retro-button px-3 py-1 text-xs font-pixel"
                      onClick={handleAddTask}
                    >
                      Add Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="window">
            <div className="title-bar">
              <h3 className="title-text text-sm">Expenses</h3>
            </div>
            <div className="p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-pixel">
                  Total for {formatDateFull(selectedDate)}: 
                  <span className="text-soft-red ml-2">{formatCurrency(dailyTotal)}</span>
                </h4>
                <button 
                  className="retro-button px-3 py-1 text-xs font-pixel"
                  onClick={handleAddExpense}
                >
                  Add Expense
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {todayExpenses.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-xs font-pixel border-b border-gray-300">
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayExpenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-gray-200 text-sm font-nunito">
                          <td className="py-2">{expense.description}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-sm text-xs ${
                              expense.category === 'food' ? 'bg-dusty-blue/20' :
                              expense.category === 'transport' ? 'bg-soft-lavender/20' :
                              expense.category === 'utilities' ? 'bg-mint-green/20' :
                              expense.category === 'entertainment' ? 'bg-pale-yellow/20' :
                              'bg-gray-200'
                            }`}>
                              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                            </span>
                          </td>
                          <td className="py-2 text-right">{formatCurrency(expense.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex justify-center items-center py-4 text-sm text-gray-500">
                    No expenses recorded for this date
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDetailView;
