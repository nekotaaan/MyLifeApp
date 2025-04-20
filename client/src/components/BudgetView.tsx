import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertExpenseSchema, Expense } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency, getMonthBoundaries, getWeekBoundaries } from '@/lib/utils';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const extendedExpenseSchema = insertExpenseSchema.extend({
  // Additional validation can be added here
});

type ExpenseFormValues = z.infer<typeof extendedExpenseSchema>;

const BudgetView = () => {
  const { selectedDate, expenses } = useAppContext();
  const [addingExpense, setAddingExpense] = useState(false);
  const queryClient = useQueryClient();

  // Format the selected date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(extendedExpenseSchema),
    defaultValues: {
      date: dateString,
      description: '',
      amount: 0,
      category: 'food',
    }
  });

  // Create expense mutation
  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      return apiRequest('POST', '/api/expenses', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      form.reset({
        date: dateString,
        description: '',
        amount: 0,
        category: 'food',
      });
      setAddingExpense(false);
      toast({
        title: "Success",
        description: "Expense added",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const { mutate: deleteExpense } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success",
        description: "Expense deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ExpenseFormValues) => {
    createExpense(values);
  };

  // Handle adding a new expense
  const handleAddExpense = () => {
    setAddingExpense(true);
    form.reset({
      date: dateString,
      description: '',
      amount: 0,
      category: 'food',
    });
  };

  // Calculate totals
  const todayExpenses = useMemo(() => {
    return expenses.filter(expense => 
      new Date(expense.date).toISOString().split('T')[0] === dateString
    );
  }, [expenses, dateString]);

  const todayTotal = useMemo(() => {
    return todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [todayExpenses]);

  const weeklyTotal = useMemo(() => {
    const { start, end } = getWeekBoundaries(selectedDate);
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate >= start && expenseDate <= end;
    }).reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, selectedDate]);

  const monthlyTotal = useMemo(() => {
    const { start, end } = getMonthBoundaries(selectedDate);
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).toISOString().split('T')[0];
      return expenseDate >= start && expenseDate <= end;
    }).reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, selectedDate]);

  // Sort expenses by date (newest first)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses]);

  return (
    <div className="view budget-view">
      <div className="window">
        <div className="title-bar">
          <h2 className="title-text">Budget Tracker</h2>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-soft-red rounded-sm"></button>
            <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
            <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="window border shadow-retro">
              <div className="title-bar">
                <h3 className="title-text text-sm">Today's Spending</h3>
              </div>
              <div className="p-3 bg-mint-green/20 text-center">
                <span className="text-2xl font-pixel text-dark-gray">
                  {formatCurrency(todayTotal)}
                </span>
              </div>
            </div>
            
            <div className="window border shadow-retro">
              <div className="title-bar">
                <h3 className="title-text text-sm">Weekly Total</h3>
              </div>
              <div className="p-3 bg-pale-yellow/20 text-center">
                <span className="text-2xl font-pixel text-dark-gray">
                  {formatCurrency(weeklyTotal)}
                </span>
              </div>
            </div>
            
            <div className="window border shadow-retro">
              <div className="title-bar">
                <h3 className="title-text text-sm">Monthly Total</h3>
              </div>
              <div className="p-3 bg-soft-red/20 text-center">
                <span className="text-2xl font-pixel text-dark-gray">
                  {formatCurrency(monthlyTotal)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <label className="font-pixel text-dark-gray">Date:</label>
              <Input 
                type="date" 
                className="retro-input px-2 py-1 font-pixel" 
                value={dateString} 
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      // Update form date
                      form.setValue('date', e.target.value);
                    }
                  }
                }}
              />
            </div>
            <button 
              className="retro-button px-3 py-1 text-sm font-pixel" 
              onClick={handleAddExpense}
            >
              Add Expense
            </button>
          </div>
          
          {/* Add new expense form */}
          {addingExpense && (
            <div className="window mb-4">
              <div className="title-bar">
                <h3 className="title-text text-sm">New Expense</h3>
              </div>
              <div className="p-3 bg-white">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="block text-xs font-pixel mb-1">Description</FormLabel>
                            <FormControl>
                              <Input 
                                className="w-full retro-input px-2 py-1 font-nunito" 
                                placeholder="Lunch"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="block text-xs font-pixel mb-1">Amount ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                className="w-full retro-input px-2 py-1 font-nunito" 
                                placeholder="0.00" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="block text-xs font-pixel mb-1">Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="w-full retro-input px-2 py-1 font-nunito">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="food">Food</SelectItem>
                                <SelectItem value="transport">Transport</SelectItem>
                                <SelectItem value="utilities">Utilities</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <button 
                        type="button" 
                        className="retro-button px-3 py-1 text-sm font-pixel"
                        onClick={() => setAddingExpense(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="retro-button px-3 py-1 text-sm font-pixel"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
          
          {/* Expense list */}
          <div className="window">
            <div className="title-bar">
              <h3 className="title-text text-sm">Recent Expenses</h3>
            </div>
            <div className="p-3 bg-white h-64 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs font-pixel border-b border-gray-300">
                    <th className="pb-2 w-1/3">Description</th>
                    <th className="pb-2 w-1/4">Category</th>
                    <th className="pb-2 w-1/4">Date</th>
                    <th className="pb-2 w-1/6 text-right">Amount</th>
                    <th className="pb-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm font-nunito text-gray-500">
                        No expenses recorded yet
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((expense: Expense) => (
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
                        <td className="py-2 text-xs">{formatDate(expense.date)}</td>
                        <td className="py-2 text-right">{formatCurrency(expense.amount)}</td>
                        <td className="py-2">
                          <button 
                            className="text-soft-red text-xs"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
