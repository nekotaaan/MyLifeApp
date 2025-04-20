import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertTaskSchema, Task } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { z } from 'zod';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const extendedTaskSchema = insertTaskSchema.extend({
  // Additional validation can be added here
});

type TaskFormValues = z.infer<typeof extendedTaskSchema>;

const TodoView = () => {
  const { selectedDate, tasks } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Format the selected date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(extendedTaskSchema),
    defaultValues: {
      description: '',
      dueDate: dateString,
      completed: false,
    }
  });

  // Create task mutation
  const { mutate: createTask, isPending: isCreating } = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      return apiRequest('POST', '/api/tasks', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      form.reset({
        description: '',
        dueDate: dateString,
        completed: false,
      });
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

  // Update task mutation
  const { mutate: updateTask, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<TaskFormValues> }) => {
      return apiRequest('PUT', `/api/tasks/${id}`, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setEditingTaskId(null);
      toast({
        title: "Success",
        description: "Task updated",
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

  // Toggle task completion mutation
  const { mutate: toggleTask } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/tasks/${id}/toggle`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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

  // Delete task mutation
  const { mutate: deleteTask } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for new task
  const onSubmit = (values: TaskFormValues) => {
    createTask(values);
  };

  // Handle starting to edit a task
  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    form.setValue('description', task.description);
    form.setValue('dueDate', new Date(task.dueDate).toISOString().split('T')[0]);
  };

  // Handle saving edited task
  const handleSaveEdit = (id: number) => {
    const description = form.getValues('description');
    const dueDate = form.getValues('dueDate');
    
    if (description.trim()) {
      updateTask({
        id,
        values: {
          description,
          dueDate,
        }
      });
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    
    if (filter === 'active') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }
    
    // Sort by due date (earliest first)
    return filtered.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [tasks, filter]);

  return (
    <div className="view todo-view">
      <div className="window">
        <div className="title-bar">
          <h2 className="title-text">To-Do List</h2>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-soft-red rounded-sm"></button>
            <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
            <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button 
                className={`retro-button px-3 py-1 text-sm font-pixel ${filter === 'all' ? 'bg-soft-lavender/30' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`retro-button px-3 py-1 text-sm font-pixel ${filter === 'active' ? 'bg-soft-lavender/30' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button 
                className={`retro-button px-3 py-1 text-sm font-pixel ${filter === 'completed' ? 'bg-soft-lavender/30' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
            <button 
              className="retro-button px-3 py-1 text-sm font-pixel"
              onClick={() => setAddingTask(true)}
            >
              + New Task
            </button>
          </div>
          
          {/* Add new task form */}
          {addingTask && (
            <div className="window mb-4">
              <div className="title-bar">
                <h3 className="title-text text-sm">New Task</h3>
              </div>
              <div className="p-3 bg-white">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                      <div className="sm:col-span-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="block text-xs font-pixel mb-1">Task Description</FormLabel>
                              <FormControl>
                                <Input 
                                  type="text" 
                                  className="w-full retro-input px-2 py-1 font-nunito" 
                                  placeholder="Buy cat food"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="block text-xs font-pixel mb-1">Due Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  className="w-full retro-input px-2 py-1 font-nunito" 
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="sm:col-span-1 flex items-end">
                        <button 
                          type="submit" 
                          className="w-full retro-button px-3 py-1 text-sm font-pixel"
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            'Add'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        className="retro-button px-3 py-1 text-sm font-pixel"
                        onClick={() => setAddingTask(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
          
          {/* Task list */}
          <div className="window">
            <div className="title-bar">
              <h3 className="title-text text-sm">Task List</h3>
            </div>
            <div className="p-3 bg-white max-h-96 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="flex justify-center items-center py-8 text-gray-500">
                  No tasks found
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredTasks.map((task) => (
                    <li 
                      key={task.id} 
                      className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2"
                    >
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input 
                            className="flex-1 retro-input px-2 py-1 font-nunito"
                            value={form.getValues('description')}
                            onChange={(e) => form.setValue('description', e.target.value)}
                          />
                          <Input 
                            type="date"
                            className="w-32 retro-input px-2 py-1 font-nunito"
                            value={form.getValues('dueDate')}
                            onChange={(e) => form.setValue('dueDate', e.target.value)}
                          />
                          <button 
                            type="button"
                            className="retro-button px-2 py-0.5 text-xs font-pixel"
                            onClick={() => handleSaveEdit(task.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button 
                            type="button"
                            className="retro-button px-2 py-0.5 text-xs font-pixel bg-soft-red/20"
                            onClick={() => setEditingTaskId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id={`task-${task.id}`}
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                            />
                            <label 
                              htmlFor={`task-${task.id}`}
                              className={`font-nunito ${task.completed ? 'line-through text-gray-400' : ''}`}
                            >
                              {task.description}
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-pixel text-gray-500">
                              Due: {formatDate(task.dueDate)}
                            </span>
                            <div className="flex gap-1">
                              <button 
                                className="retro-button px-2 py-0.5 text-xs font-pixel"
                                onClick={() => handleEditTask(task)}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button 
                                className="retro-button px-2 py-0.5 text-xs font-pixel bg-soft-red/20"
                                onClick={() => deleteTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoView;
