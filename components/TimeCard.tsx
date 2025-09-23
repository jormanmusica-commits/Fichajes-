import React from 'react';
import { WorkSession } from '../types';

interface TimeCardProps {
  session: WorkSession;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CalendarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ClockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PencilIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const formatSessionDuration = (startTime: Date, endTime: Date): string => {
    let ms = endTime.getTime() - startTime.getTime();
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours}H`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}Min`);
    }

    if (parts.length === 0) {
        return '0Min';
    }
    
    return parts.join(' - ');
};


const TimeCard: React.FC<TimeCardProps> = ({ session, isExpanded, onToggle, onEdit, onDelete }) => {
  const detailDateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const sessionDate = session.startTime.toLocaleDateString('es-ES', detailDateOptions);

  const summaryDateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
  const summaryDate = session.startTime.toLocaleDateString('es-ES', summaryDateOptions);
  
  const displayDuration = formatSessionDuration(session.startTime, session.endTime);

  return (
    <div className="bg-black/30 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg transition-all duration-300 hover:border-purple-500 hover:scale-[1.01]">
      {/* Clickable Summary Row */}
      <div onClick={onToggle} className="flex justify-between items-center p-4 cursor-pointer">
        <div className="font-medium text-slate-200 capitalize">
          {summaryDate}
        </div>
        <div className="font-semibold text-purple-400 text-base sm:text-lg">
          Total Horas: {displayDuration}
        </div>
      </div>

      {/* Expandable Details View */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
           <div className="flex items-center text-slate-400 my-2">
                <CalendarIcon className="w-5 h-5 mr-2" />
                <span className="font-medium capitalize">{sessionDate}</span>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mt-2">
            <div className="flex flex-col p-3 bg-black/20 rounded-lg">
              <span className="text-sm font-medium text-pink-400">ENTRADA</span>
              <span className="text-xl font-semibold text-slate-200">{session.startTime.toLocaleTimeString('es-ES')}</span>
            </div>
            <div className="flex flex-col p-3 bg-black/20 rounded-lg">
              <span className="text-sm font-medium text-red-400">SALIDA</span>
              <span className="text-xl font-semibold text-slate-200">{session.endTime.toLocaleTimeString('es-ES')}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-purple-900/40 rounded-lg sm:col-span-1">
              <span className="text-sm font-medium text-purple-400">TOTAL TRABAJADO</span>
              <div className="flex items-center mt-1">
                  <ClockIcon className="w-6 h-6 mr-2 text-purple-400" />
                  <span className="text-2xl font-bold text-white tracking-wider">{displayDuration}</span>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={onEdit} 
                className="flex items-center text-xs px-3 py-1.5 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                  <PencilIcon className="w-4 h-4 mr-1.5" />
                  Editar
              </button>
              <button 
                onClick={onDelete} 
                className="flex items-center text-xs px-3 py-1.5 rounded-md text-red-300 bg-red-900/50 hover:bg-red-900/80 transition-colors"
              >
                  <TrashIcon className="w-4 h-4 mr-1.5" />
                  Eliminar
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeCard;