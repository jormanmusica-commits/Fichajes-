import React, { useState, useEffect } from 'react';
import { WorkSession } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionData: { startTime?: Date; endTime?: Date; id?: number }) => void;
  sessionToEdit: WorkSession | null;
  modalMode: 'start' | 'end' | 'edit' | null;
  currentTime: Date;
  activeSessionStartTime?: Date;
}

// Helper to format Date to YYYY-MM-DD for date input
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper to format Date to HH:mm for time input
const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

// Helper to format the date for display inside the custom input
const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    // Use T00:00:00 to avoid timezone issues where new Date('YYYY-MM-DD') might be the previous day
    const date = new Date(`${dateString}T00:00:00`);
    
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = date.getDate();
    const monthName = date.toLocaleDateString('es-ES', { month: 'long' });

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return `${capitalize(dayName)} ${day} ${capitalize(monthName)}`;
};

const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, onSave, sessionToEdit, modalMode, currentTime, activeSessionStartTime }) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const now = currentTime;
    const nowDate = formatDateForInput(now);
    const nowTime = formatTimeForInput(now);

    if (modalMode === 'edit' && sessionToEdit) {
      setStartDate(formatDateForInput(sessionToEdit.startTime));
      setStartTime(formatTimeForInput(sessionToEdit.startTime));
      setEndDate(formatDateForInput(sessionToEdit.endTime));
      setEndTime(formatTimeForInput(sessionToEdit.endTime));
    } else if (modalMode === 'start') {
      setStartDate(nowDate);
      setStartTime(nowTime);
      setEndDate(''); // Clear other fields
      setEndTime('');
    } else if (modalMode === 'end') {
      setEndDate(nowDate);
      setEndTime(nowTime);
      setStartDate(''); // Clear other fields
      setStartTime('');
    }
    setError(null);
  }, [sessionToEdit, isOpen, modalMode]);


  if (!isOpen) {
    return null;
  }
  
  const handleSave = () => {
    if (modalMode === 'start') {
        if (!startDate || !startTime) {
            setError("La fecha y hora de entrada son obligatorias.");
            return;
        }
        onSave({ startTime: new Date(`${startDate}T${startTime}`) });

    } else if (modalMode === 'end') {
        if (!endDate || !endTime) {
            setError("La fecha y hora de salida son obligatorias.");
            return;
        }
        const endDateTime = new Date(`${endDate}T${endTime}`);
        if (activeSessionStartTime && endDateTime <= activeSessionStartTime) {
            setError("La hora de salida debe ser posterior a la hora de entrada.");
            return;
        }
        onSave({ endTime: endDateTime });

    } else if (modalMode === 'edit' && sessionToEdit) {
        if (!startDate || !startTime || !endDate || !endTime) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        if (endDateTime <= startDateTime) {
            setError("La hora de salida debe ser posterior a la hora de entrada.");
            return;
        }
        onSave({
            startTime: startDateTime,
            endTime: endDateTime,
            id: sessionToEdit.id
        });
    }
  };

  const getTitle = () => {
      switch (modalMode) {
          case 'start': return 'Fichar Entrada';
          case 'end': return 'Fichar Salida';
          case 'edit': return 'Editar Fichaje';
          default: return '';
      }
  };

  const getButtonText = () => {
      switch (modalMode) {
          case 'start': return 'Iniciar Turno';
          case 'end': return 'Finalizar Turno';
          case 'edit': return 'Guardar Cambios';
          default: return '';
      }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-center text-slate-100 mb-6">{getTitle()}</h2>
        
        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4 text-center">{error}</p>}

        <div className="space-y-4">
          {(modalMode === 'start' || modalMode === 'edit') && (
            <>
              <div className="w-full max-w-xs mx-auto">
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-400 mb-1 text-center">Fecha de Entrada</label>
                <div className="relative">
                    <div className="w-full h-11 flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg px-3 text-slate-200">
                        <span>{startDate ? formatDisplayDate(startDate) : 'Seleccionar...'}</span>
                    </div>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
              </div>
              <div className="w-full max-w-xs mx-auto">
                <label htmlFor="startTime" className="block text-sm font-medium text-slate-400 mb-1 text-center">Hora de Entrada</label>
                 <div className="relative">
                    <div className="w-full h-11 flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg px-3 text-slate-200">
                        <span>{startTime || 'Seleccionar...'}</span>
                    </div>
                    <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
              </div>
            </>
          )}

          {(modalMode === 'end' || modalMode === 'edit') && (
            <>
              <div className="w-full max-w-xs mx-auto">
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-400 mb-1 text-center">Fecha de Salida</label>
                <div className="relative">
                    <div className="w-full h-11 flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg px-3 text-slate-200">
                        <span>{endDate ? formatDisplayDate(endDate) : 'Seleccionar...'}</span>
                    </div>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
              </div>
              <div className="w-full max-w-xs mx-auto">
                <label htmlFor="endTime" className="block text-sm font-medium text-slate-400 mb-1 text-center">Hora de Salida</label>
                 <div className="relative">
                    <div className="w-full h-11 flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-lg px-3 text-slate-200">
                        <span>{endTime || 'Seleccionar...'}</span>
                    </div>
                    <input type="time" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg text-white font-semibold bg-pink-600 hover:bg-pink-700 transition-colors shadow-lg shadow-pink-600/20">
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;