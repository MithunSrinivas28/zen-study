
-- Create todo_tasks table for daily scoped tasks
CREATE TABLE public.todo_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own tasks"
ON public.todo_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON public.todo_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.todo_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.todo_tasks FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast daily lookups
CREATE INDEX idx_todo_tasks_user_date ON public.todo_tasks (user_id, task_date);
