import React, { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getDaysInMonth, daysOfWeekShort, formatMonthYear, isSameDay, formatCurrency } from '@/lib/utils';

const CalendarWidget = () => {
  const { 
    currentMonth, 
    setCurrentMonth, 
    selectedDate, 
    setSelectedDate, 
    diaryEntries, 
    expenses,
    tasks
  } = useAppContext();

  const days = useMemo(() => {
    return getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Helper to get total spent on a day
  const getDailyTotal = (date: Date): number => {
    const dailyExpenses = expenses.filter(expense => 
      isSameDay(new Date(expense.date), date)
    );
    return dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <div className="md:col-span-2">
      <div className="window h-full">
        <div className="title-bar">
          <h2 className="title-text">Calendar</h2>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
            <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
          </div>
        </div>
        <div className="p-3 bg-white">
          <div className="flex justify-between items-center mb-2">
            <button 
              className="retro-button px-2 font-pixel" 
              onClick={handlePrevMonth}
            >
              ◀
            </button>
            <h3 className="font-pixel text-center">
              {formatMonthYear(currentMonth)}
            </h3>
            <button 
              className="retro-button px-2 font-pixel" 
              onClick={handleNextMonth}
            >
              ▶
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-0 text-center">
            {/* Days of week */}
            {daysOfWeekShort.map(day => (
              <div key={day} className="text-xs font-bold text-dark-gray font-pixel">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = isSameDay(day, selectedDate);
              const hasDiaryEntry = diaryEntries.some(entry => isSameDay(new Date(entry.date), day));
              const hasTask = tasks.some(task => isSameDay(new Date(task.dueDate), day));
              const dailyTotal = getDailyTotal(day);
              
              return (
                <div 
                  key={index}
                  className={`calendar-day ${isCurrentMonth ? 'bg-white' : 'bg-gray-100 text-gray-400'} 
                    hover:bg-soft-lavender/20 cursor-pointer
                    ${hasDiaryEntry ? 'has-entry' : ''} 
                    ${hasTask ? 'has-task' : ''}
                    ${isSelected ? 'bg-dusty-blue/20' : ''}`}
                  onClick={() => handleDateSelect(day)}
                >
                  <span className="text-sm font-pixel">{day.getDate()}</span>
                  {dailyTotal > 0 && isCurrentMonth && (
                    <span className="text-xs text-soft-red font-pixel">${dailyTotal.toFixed(0)}</span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 px-2">
            <div className="flex justify-between text-xs font-pixel mb-1">
              <span>Legend:</span>
            </div>
            <div className="flex gap-4 text-xs font-pixel">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-soft-lavender"></div>
                <span>Diary</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-pale-yellow"></div>
                <span>Task</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-soft-red">$00</span>
                <span>Spent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
