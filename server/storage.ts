import { 
  users, type User, type InsertUser, 
  diaryEntries, type DiaryEntry, type InsertDiaryEntry,
  expenses, type Expense, type InsertExpense,
  tasks, type Task, type InsertTask
} from "@shared/schema";
import { db } from './db';
import { eq, desc, and, asc } from 'drizzle-orm';

// Storage interface with all the necessary CRUD operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Diary Entries
  createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry>;
  getDiaryEntryByDate(date: Date): Promise<DiaryEntry | undefined>;
  getDiaryEntries(): Promise<DiaryEntry[]>;
  updateDiaryEntry(id: number, entry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined>;
  deleteDiaryEntry(id: number): Promise<boolean>;
  
  // Expenses
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByDate(date: Date): Promise<Expense[]>;
  getExpenses(): Promise<Expense[]>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  getTasks(): Promise<Task[]>;
  getTasksByDate(date: Date): Promise<Task[]>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  toggleTaskCompletion(id: number): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }
  
  // Diary entry methods
  async createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry> {
    const results = await db.insert(diaryEntries).values(entry).returning();
    return results[0];
  }
  
  async getDiaryEntryByDate(date: Date): Promise<DiaryEntry | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const results = await db.select().from(diaryEntries).where(eq(diaryEntries.date, dateStr));
    return results[0];
  }
  
  async getDiaryEntries(): Promise<DiaryEntry[]> {
    return await db.select().from(diaryEntries).orderBy(desc(diaryEntries.date));
  }
  
  async updateDiaryEntry(id: number, entry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined> {
    const results = await db
      .update(diaryEntries)
      .set(entry)
      .where(eq(diaryEntries.id, id))
      .returning();
    return results[0];
  }
  
  async deleteDiaryEntry(id: number): Promise<boolean> {
    const results = await db
      .delete(diaryEntries)
      .where(eq(diaryEntries.id, id))
      .returning();
    return results.length > 0;
  }
  
  // Expense methods
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const results = await db.insert(expenses).values(expense).returning();
    return results[0];
  }
  
  async getExpensesByDate(date: Date): Promise<Expense[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.date, dateStr))
      .orderBy(desc(expenses.createdAt));
  }
  
  async getExpenses(): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.date));
  }
  
  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const results = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return results[0];
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    const results = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();
    return results.length > 0;
  }
  
  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    const results = await db.insert(tasks).values(task).returning();
    return results[0];
  }
  
  async getTasks(): Promise<Task[]> {
    // First get incomplete tasks sorted by due date, then completed tasks
    const incompleteTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.completed, false))
      .orderBy(asc(tasks.dueDate));
      
    const completedTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.completed, true))
      .orderBy(desc(tasks.dueDate));
      
    return [...incompleteTasks, ...completedTasks];
  }
  
  async getTasksByDate(date: Date): Promise<Task[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.dueDate, dateStr))
      .orderBy(asc(tasks.completed), desc(tasks.createdAt));
  }
  
  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const results = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return results[0];
  }
  
  async toggleTaskCompletion(id: number): Promise<Task | undefined> {
    // First get the current task to check its completion status
    const currentTasks = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!currentTasks.length) return undefined;
    
    const currentTask = currentTasks[0];
    
    // Toggle the completion status
    const results = await db
      .update(tasks)
      .set({ completed: !currentTask.completed })
      .where(eq(tasks.id, id))
      .returning();
    return results[0];
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const results = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    return results.length > 0;
  }
}

export const storage = new DatabaseStorage();
