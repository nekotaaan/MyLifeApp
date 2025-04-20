import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format dates consistently across the app
export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateFull(date: Date | string): string {
  return format(new Date(date), "MMMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy - h:mm a");
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Function to generate an array of dates for a calendar month
export function getDaysInMonth(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calculate the previous month's days to show
  const daysFromPrevMonth = firstDayOfWeek;
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  const days: Date[] = [];
  
  // Add days from previous month
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLastDay - i));
  }
  
  // Add days from current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add days from next month to complete the grid (aiming for 6 rows × 7 columns = 42 cells)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

// Get day name abbreviations
export const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const daysOfWeekShort = ["S", "M", "T", "W", "T", "F", "S"];

// Helper to get the month date boundaries for API requests
export function getMonthBoundaries(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0]
  };
}

// Helper to get the week date boundaries for API requests
export function getWeekBoundaries(date: Date): { start: string; end: string } {
  const currentDay = date.getDay(); // 0 = Sunday, 6 = Saturday
  
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - currentDay);
  
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + (6 - currentDay));
  
  return {
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0]
  };
}

// Helper to generate a random assistant message
export function getRandomAssistantMessage(): string {
  const messages = [
    "Remember to take breaks from screen time! Your eyes need rest too.",
    "Did you remember to drink water today? Staying hydrated helps your mood!",
    "How are you feeling today? Writing in your diary might help.",
    "Don't forget to check your budget before making big purchases.",
    "Need help organizing your tasks? I can help prioritize them!",
    "You're doing great! Keep tracking those expenses.",
    "Remember that not every day has to be productive. Rest is important too.",
    "Have you checked your calendar for upcoming tasks?",
    "Writing down your thoughts can be very therapeutic.",
    "It might be a good time to review your spending habits.",
    "Would you like me to remind you about any tasks today?",
    "Sometimes the smallest tasks are the most important ones to finish."
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

// Function to check if two dates are the same day
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
