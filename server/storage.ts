import { 
  users, type User, type InsertUser, 
  diaryEntries, type DiaryEntry, type InsertDiaryEntry,
  expenses, type Expense, type InsertExpense,
  tasks, type Task, type InsertTask
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diaryEntriesMap: Map<number, DiaryEntry>;
  private expensesMap: Map<number, Expense>;
  private tasksMap: Map<number, Task>;
  
  private userId: number;
  private diaryEntryId: number;
  private expenseId: number;
  private taskId: number;

  constructor() {
    this.users = new Map();
    this.diaryEntriesMap = new Map();
    this.expensesMap = new Map();
    this.tasksMap = new Map();
    
    this.userId = 1;
    this.diaryEntryId = 1;
    this.expenseId = 1;
    this.taskId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Diary entry methods
  async createDiaryEntry(entry: InsertDiaryEntry): Promise<DiaryEntry> {
    const id = this.diaryEntryId++;
    const diaryEntry: DiaryEntry = { 
      ...entry, 
      id, 
      createdAt: new Date() 
    };
    this.diaryEntriesMap.set(id, diaryEntry);
    return diaryEntry;
  }

  async getDiaryEntryByDate(date: Date): Promise<DiaryEntry | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    return Array.from(this.diaryEntriesMap.values()).find(
      (entry) => entry.date.toISOString().split('T')[0] === dateStr
    );
  }

  async getDiaryEntries(): Promise<DiaryEntry[]> {
    return Array.from(this.diaryEntriesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async updateDiaryEntry(id: number, entry: Partial<InsertDiaryEntry>): Promise<DiaryEntry | undefined> {
    const existingEntry = this.diaryEntriesMap.get(id);
    if (!existingEntry) return undefined;
    
    const updatedEntry: DiaryEntry = {
      ...existingEntry,
      ...entry,
    };
    
    this.diaryEntriesMap.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteDiaryEntry(id: number): Promise<boolean> {
    return this.diaryEntriesMap.delete(id);
  }

  // Expense methods
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseId++;
    const newExpense: Expense = {
      ...expense,
      id,
      createdAt: new Date()
    };
    this.expensesMap.set(id, newExpense);
    return newExpense;
  }

  async getExpensesByDate(date: Date): Promise<Expense[]> {
    const dateStr = date.toISOString().split('T')[0];
    return Array.from(this.expensesMap.values()).filter(
      (expense) => expense.date.toISOString().split('T')[0] === dateStr
    );
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expensesMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existingExpense = this.expensesMap.get(id);
    if (!existingExpense) return undefined;
    
    const updatedExpense: Expense = {
      ...existingExpense,
      ...expense,
    };
    
    this.expensesMap.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expensesMap.delete(id);
  }

  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date()
    };
    this.tasksMap.set(id, newTask);
    return newTask;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasksMap.values()).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  async getTasksByDate(date: Date): Promise<Task[]> {
    const dateStr = date.toISOString().split('T')[0];
    return Array.from(this.tasksMap.values()).filter(
      (task) => task.dueDate.toISOString().split('T')[0] === dateStr
    );
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasksMap.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask: Task = {
      ...existingTask,
      ...task,
    };
    
    this.tasksMap.set(id, updatedTask);
    return updatedTask;
  }

  async toggleTaskCompletion(id: number): Promise<Task | undefined> {
    const existingTask = this.tasksMap.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask: Task = {
      ...existingTask,
      completed: !existingTask.completed
    };
    
    this.tasksMap.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasksMap.delete(id);
  }
}

export const storage = new MemStorage();
