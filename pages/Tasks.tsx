
import React, { useState } from 'react';
import { useBookingData } from '../context/BookingContext';
import { Priority, Task } from '../types';
import GlassCard from '../components/GlassCard';
// Added ListTodo to the imports from lucide-react
import { Plus, CheckCircle, Circle, Trash2, Clock, Bell, AlignLeft, User, AlertTriangle, X as CloseIcon, ListTodo } from 'lucide-react';

const Tasks: React.FC = () => {
  const { tasks, loading, addTask, toggleTask, deleteTask, deleteAllTasks } = useBookingData();
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [timeError, setTimeError] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    assigned_to: '',
    description: '',
    task_time: '',
    priority: Priority.MEDIUM,
    reminder_active: false,
    reminder_offset: 15
  });

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9:]/g, '');
    if (value.length === 2 && !value.includes(':')) value += ':';
    if (value.length > 5) value = value.slice(0, 5);
    
    setFormData({...formData, task_time: value});
    
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (value.length === 5 && !regex.test(value)) {
      setTimeError(true);
    } else {
      setTimeError(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || timeError) return;
    
    await addTask({
      title: formData.title,
      assigned_to: formData.assigned_to.trim() || undefined,
      description: formData.description,
      priority: formData.priority,
      task_time: formData.task_time || null,
      reminder_active: formData.reminder_active,
      reminder_offset_minutes: formData.reminder_active ? formData.reminder_offset : null,
    });

    setFormData({
      title: '',
      assigned_to: '',
      description: '',
      task_time: '',
      priority: Priority.MEDIUM,
      reminder_active: false,
      reminder_offset: 15
    });
    setShowAdd(false);
  };

  const handleConfirmDeleteAll = async () => {
    await deleteAllTasks();
    setShowDeleteAllModal(false);
  };

  const priorityLabels: Record<Priority, string> = {
    [Priority.LOW]: 'Nízka',
    [Priority.MEDIUM]: 'Stredná',
    [Priority.HIGH]: 'Vysoká'
  };

  if (loading) return <div className="animate-pulse text-slate-300 text-center mt-20 uppercase tracking-widest text-xs font-black">Načítavam úlohy...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Úlohy</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Studio Workflow</p>
        </div>
        <div className="flex items-center gap-4">
          {tasks.length > 0 && (
            <button 
              onClick={() => setShowDeleteAllModal(true)}
              className="bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 px-6 rounded-2xl flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl text-[10px] uppercase tracking-widest"
              title="Vymazať všetko"
            >
              <Trash2 size={16} /> VYMAZAŤ VŠETKO
            </button>
          )}
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-white text-black font-black py-4 px-8 rounded-2xl flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-xl text-xs uppercase tracking-widest"
          >
            <Plus size={18} /> Nová úloha
          </button>
        </div>
      </header>

      {showAdd && (
        <GlassCard className="border-white/20 p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Názov úlohy</span>
                <input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all font-bold"
                  placeholder="napr. Mix vokálov - Track 01"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pre koho (Meno) - voliteľné</span>
                <input 
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all font-bold"
                  placeholder="Meno zodpovednej osoby"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Popis (voliteľné)</span>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all font-bold h-24 resize-none"
                  placeholder="Podrobnosti o úlohe..."
                />
              </label>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${timeError ? 'text-red-500' : 'text-slate-400'}`}>Čas (HH:mm)</span>
                  <input 
                    type="text"
                    value={formData.task_time}
                    onChange={handleTimeChange}
                    placeholder="18:00"
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all font-bold ${timeError ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'}`}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Priorita</span>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-all font-bold appearance-none"
                  >
                    {Object.values(Priority).map(p => <option key={p} value={p} className="bg-black">{priorityLabels[p]}</option>)}
                  </select>
                </label>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={formData.reminder_active}
                    onChange={(e) => setFormData({...formData, reminder_active: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-white focus:ring-0"
                  />
                  <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest group-hover:text-white transition-colors">Upozorniť ma pred vykonaním</span>
                </label>
                {formData.reminder_active && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                    <input 
                      type="number"
                      value={formData.reminder_offset}
                      onChange={(e) => setFormData({...formData, reminder_offset: parseInt(e.target.value)})}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold text-sm"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">minút vopred</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
            <button onClick={() => setShowAdd(false)} className="px-6 py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Zrušiť</button>
            <button onClick={handleCreate} className="bg-white text-black font-black px-10 py-3 rounded-xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-gray-200 transition-all">Vytvoriť úlohu</button>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-20 glass rounded-[3rem] border-dashed border-2 border-white/5">
            <ListTodo size={48} className="text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Žiadne naplánované úlohy</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`glass p-6 rounded-[2.5rem] border-2 flex flex-col md:flex-row md:items-center gap-6 group transition-all duration-300 ${
                task.completed ? 'opacity-30 grayscale border-white/5' : `border-white/10`
              }`}
            >
              <button onClick={() => toggleTask(task)} className="shrink-0">
                {task.completed ? <CheckCircle size={32} className="text-white" /> : <Circle size={32} className="text-slate-600 group-hover:text-white transition-colors" />}
              </button>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className={`font-black text-xl text-white truncate tracking-tighter ${task.completed ? 'line-through opacity-50' : ''}`}>
                    {task.title}
                  </h4>
                  {task.task_time && (
                    <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-md text-slate-300 flex items-center gap-1">
                      <Clock size={12} /> {task.task_time}
                    </span>
                  )}
                </div>
                
                {task.assigned_to && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <User size={12} className="text-slate-500" />
                    <span>{task.assigned_to}</span>
                  </div>
                )}

                {task.description && (
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed flex items-center gap-2 pt-1">
                    <AlignLeft size={12} /> {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6">
                 {task.reminder_active && (
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/20">
                      <Bell size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{task.reminder_offset_minutes}m vopred</span>
                    </div>
                 )}
                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  task.priority === Priority.HIGH ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                  task.priority === Priority.MEDIUM ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {priorityLabels[task.priority]}
                </div>
                <button onClick={() => deleteTask(task.id)} className="p-3 text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Potvrdzovacie modálne okno hromadného vymazania */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <GlassCard className="max-w-md w-full p-10 border-white/20 text-center space-y-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex justify-center">
                 <div className="p-5 bg-red-500/10 text-red-500 rounded-full">
                    <AlertTriangle size={48} />
                 </div>
              </div>
              
              <div className="space-y-3">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">Hromadné vymazanie</h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    Naozaj chcete vymazať všetky úlohy? Táto akcia je nevratná a odstráni všetky naplánované pripomienky.
                 </p>
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                 >
                    ZRUŠIŤ
                 </button>
                 <button 
                  onClick={handleConfirmDeleteAll}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-600/20"
                 >
                    VYMAZAŤ VŠETKO
                 </button>
              </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Tasks;
