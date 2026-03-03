import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckSquare, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TodoTask {
  id: string;
  title: string;
  completed: boolean;
}

export default function TodoPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("todo_tasks")
      .select("id, title, completed")
      .eq("user_id", user.id)
      .eq("task_date", today)
      .order("created_at", { ascending: true });
    setTasks(data ?? []);
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const addTask = async () => {
    if (!user || !newTask.trim()) return;
    setLoading(true);
    await supabase.from("todo_tasks").insert({
      user_id: user.id,
      title: newTask.trim(),
      task_date: today,
    });
    setNewTask("");
    await fetchTasks();
    setLoading(false);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from("todo_tasks").update({ completed: !completed }).eq("id", id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = async (id: string) => {
    await supabase.from("todo_tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setOpen(true), 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-20 z-40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Collapsed tab */}
      {!open && (
        <div className="bg-card border border-r-0 border-border rounded-l-lg p-2 cursor-pointer shadow-sm">
          <CheckSquare size={18} className="text-muted-foreground" />
        </div>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="bg-card border border-r-0 border-border rounded-l-xl shadow-lg w-72 max-h-[70vh] flex flex-col animate-float-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-serif font-bold text-foreground">Today's Tasks</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* Add task */}
          <div className="flex gap-2 px-3 py-3 border-b border-border">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task..."
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={addTask} disabled={loading || !newTask.trim()} className="h-8 px-2">
              <Plus size={14} />
            </Button>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground font-body text-center py-4">No tasks yet</p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 py-1.5 group"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                  className="h-3.5 w-3.5"
                />
                <span
                  className={`flex-1 text-sm font-body truncate ${
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
