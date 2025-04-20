import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertDiaryEntrySchema, DiaryEntry } from '@shared/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';

const extendedDiarySchema = insertDiaryEntrySchema.extend({
  // Additional validation can be added here
});

type DiaryFormValues = z.infer<typeof extendedDiarySchema>;

const DiaryView = () => {
  const { selectedDate } = useAppContext();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Format the selected date for API
  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch diary entry for the selected date
  const { data: diaryEntry, isLoading } = useQuery<DiaryEntry | null>({
    queryKey: ['/api/diary', dateString],
    enabled: !!dateString,
  });

  const form = useForm<DiaryFormValues>({
    resolver: zodResolver(extendedDiarySchema),
    defaultValues: {
      date: dateString,
      title: '',
      content: '',
      mood: 'neutral',
      tags: [],
    }
  });

  // Update form when diary entry changes
  useEffect(() => {
    if (diaryEntry) {
      form.reset({
        date: dateString,
        title: diaryEntry.title || '',
        content: diaryEntry.content || '',
        mood: diaryEntry.mood || 'neutral',
        tags: diaryEntry.tags || [],
      });
      setTags(diaryEntry.tags || []);
      setLastSaved(formatDateTime(diaryEntry.createdAt));
    } else {
      form.reset({
        date: dateString,
        title: '',
        content: '',
        mood: 'neutral',
        tags: [],
      });
      setTags([]);
      setLastSaved(null);
    }
  }, [diaryEntry, dateString, form]);

  // Create/update diary entry mutation
  const { mutate: saveDiaryEntry, isPending } = useMutation({
    mutationFn: async (values: DiaryFormValues) => {
      if (diaryEntry?.id) {
        // Update existing entry
        return apiRequest('PUT', `/api/diary/${diaryEntry.id}`, {
          ...values,
          tags: tags,
        });
      } else {
        // Create new entry
        return apiRequest('POST', '/api/diary', {
          ...values,
          tags: tags,
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/diary'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/diary', dateString] });
      setLastSaved(formatDateTime(new Date()));
      toast({
        title: "Success",
        description: "Diary entry saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save diary entry",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: DiaryFormValues) => {
    saveDiaryEntry(values);
  };

  // Handle creating a new entry
  const handleNewEntry = () => {
    form.reset({
      date: dateString,
      title: '',
      content: '',
      mood: 'neutral',
      tags: [],
    });
    setTags([]);
    setLastSaved(null);
  };

  // Add a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) {
    return (
      <div className="view diary-view">
        <div className="window">
          <div className="title-bar">
            <h2 className="title-text">My Diary</h2>
            <div className="flex gap-1">
              <button className="w-4 h-4 bg-soft-red rounded-sm"></button>
              <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
              <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
            </div>
          </div>
          <div className="p-4 bg-white">
            <div className="flex items-center justify-center h-64">
              <AlertCircle className="animate-spin h-8 w-8 text-dusty-blue" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view diary-view">
      <div className="window">
        <div className="title-bar">
          <h2 className="title-text">My Diary</h2>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-soft-red rounded-sm"></button>
            <button className="w-4 h-4 bg-pale-yellow rounded-sm"></button>
            <button className="w-4 h-4 bg-mint-green rounded-sm"></button>
          </div>
        </div>
        <div className="p-4 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-pixel text-dark-gray">Date:</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="retro-input px-2 py-1 font-pixel" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    className="retro-button px-3 py-1 text-sm font-pixel" 
                    onClick={handleNewEntry}
                  >
                    New Entry
                  </button>
                  <button 
                    type="submit"
                    className="retro-button px-3 py-1 text-sm font-pixel" 
                    disabled={isPending}
                  >
                    Save
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="text" 
                          className="w-full retro-input px-3 py-2 font-nunito mb-3" 
                          placeholder="Entry Title..." 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          className="w-full h-64 retro-input p-3 font-nunito resize-none" 
                          placeholder="Write your thoughts here..." 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-center mb-2">
                <div className="flex-1 h-px bg-gray-300"></div>
                <p className="mx-4 text-sm font-pixel text-gray-500">Mood & Tags</p>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {/* Mood Selection */}
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="retro-input px-2 py-1 font-pixel">
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="happy">😊 Happy</SelectItem>
                          <SelectItem value="sad">😢 Sad</SelectItem>
                          <SelectItem value="neutral">😐 Neutral</SelectItem>
                          <SelectItem value="angry">😠 Angry</SelectItem>
                          <SelectItem value="tired">😴 Tired</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-dusty-blue/30 text-dark-gray px-2 py-1 rounded text-xs font-nunito flex items-center"
                    >
                      {tag}
                      <button 
                        type="button"
                        className="ml-1 text-soft-red" 
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex">
                    <Input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="retro-input px-2 py-1 text-xs w-24"
                      placeholder="New tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button 
                      type="button"
                      className="retro-button px-2 py-1 text-xs font-pixel ml-1"
                      onClick={handleAddTag}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 font-pixel">
                <span>{lastSaved ? `Last saved: ${lastSaved}` : 'Not saved yet'}</span>
                <span className="flex items-center gap-1">
                  <img src="https://images.unsplash.com/photo-1577691437416-eb701c1ba60a?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Small bandaid" className="w-4 h-4" />
                  <span>Entry #{diaryEntry?.id || 'New'}</span>
                </span>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default DiaryView;
