
import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { Task, Priority } from '../types';
import GlassCard from '../components/GlassCard';
import { Plus, CheckCircle, Circle, Trash2, Clock } from 'lucide-react';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const data = await db.getTasks();
    setTasks(data);
    setLoading(false);
  };

  const handleToggle = async (task: Task) => {
    await db.updateTask(task.id, { completed: !task.completed });
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    await db.deleteTask(id);
    fetchTasks();
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    await db.createTask({
      title: newTitle,
      description: '', // Popis zostáva prázdny po odstránení AI
      priority: newPriority,
      due_date: null,
      reminder_offset_minutes: null,
    });

    setNewTitle('');
    setShowAdd(false);
    fetchTasks();
  };

  const priorityLabels: Record<Priority, string> = {
    [Priority.LOW]: 'Nízka',
    [Priority.MEDIUM]: 'Stredná',
    [Priority.HIGH]: 'Vysoká'
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW: return 'emerald-500';
      case Priority.MEDIUM: return 'yellow-500';
      case Priority.HIGH: return 'red-500';
      default: return 'white';
    }
  };

  const getPriorityBg = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW: return 'bg-emerald-500';
      case Priority.MEDIUM: return 'bg-yellow-500';
      case Priority.HIGH: return 'bg-red-500';
      default: return 'bg-white';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Úlohy</h1>
          <p className="text-slate-500">Správa priorit štúdia</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-white text-black font-bold py-2 px-6 rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <Plus size={18} />
          <span>Nová úloha</span>
        </button>
      </header>

      {showAdd && (
        <GlassCard className="border-white/20">
          <div className="space-y-4">
            <input 
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Názov úlohy (napr. Mix vokálov)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all font-bold"
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(Object.values(Priority)).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                      newPriority === p 
                        ? `${getPriorityBg(p)} ${p === Priority.MEDIUM ? 'text-black' : 'text-white'}`
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {priorityLabels[p].toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-2 rounded-xl text-slate-400 text-sm hover:text-white transition-colors font-bold"
                >
                  Zrušiť
                </button>
                <button 
                  disabled={!newTitle}
                  onClick={handleCreate}
                  className="bg-white text-black font-black py-2 px-8 rounded-xl flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50 transition-colors uppercase text-xs tracking-widest"
                >
                  <span>Vytvoriť</span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-20 text-slate-400 uppercase tracking-[0.3em] text-xs font-black">Načítavam úlohy...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center py-20 text-slate-500 italic font-medium">Žiadne úlohy sa nenašli.</p>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`glass p-5 rounded-[2.5rem] border-2 flex items-center gap-4 group transition-all duration-300 ${
                task.completed ? 'opacity-30 grayscale border-white/5' : `border-${getPriorityColor(task.priority)}`
              }`}
              style={{ borderColor: !task.completed ? `var(--tw-border-opacity, 1) ${getPriorityColor(task.priority)}` : '' }}
            >
              <button 
                onClick={() => handleToggle(task)}
                className="text-slate-500 hover:text-white transition-colors shrink-0"
              >
                {task.completed ? <CheckCircle size={26} className="text-white" /> : <Circle size={26} />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={`font-black text-lg text-white truncate ${task.completed ? 'line-through' : ''} tracking-tight`}>
                  {task.title}
                </h4>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${getPriorityBg(task.priority)} ${task.priority === Priority.MEDIUM ? 'text-black' : 'text-white'}`}>
                  {priorityLabels[task.priority]}
                </div>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;
