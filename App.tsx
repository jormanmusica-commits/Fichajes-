import React, { useState, useEffect, useMemo } from 'react';
import { WorkSession } from './types';
import Header from './components/Header';
import CurrentStatus from './components/CurrentStatus';
import HistoryPage, { WeekData } from './components/HistoryPage';
import SessionModal from './components/SessionModal';

type ActiveSession = {
    id: number;
    startTime: Date;
}

// --- WeeklyBreakdownPage Component (defined in App.tsx to avoid creating new files) ---

/**
 * Formats milliseconds into a "XH YMin" string.
 */
const formatHoursMinutes = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0 && minutes === 0) return "0 Min";
    const parts = [];
    if (hours > 0) parts.push(`${hours}H`);
    if (minutes > 0) parts.push(`${minutes}Min`);
    return parts.join(' ');
};

const ArrowLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

interface WeeklyBreakdownPageProps {
  weeklyData: WeekData[];
  dataType: 'bruto' | 'real' | 'nocturnal' | 'holiday';
  onBack: () => void;
}

const WeeklyBreakdownPage: React.FC<WeeklyBreakdownPageProps> = ({ weeklyData, dataType, onBack }) => {
    const config = useMemo(() => ({
        bruto: {
            title: 'Total Bruto',
            subTitle: 'Horas totales trabajadas antes de descansos',
            getTotal: (data: WeekData[]) => data.reduce((acc, week) => acc + week.totalDuration, 0),
            getWeekValue: (week: WeekData) => week.totalDuration,
        },
        real: {
            title: 'Total Real',
            subTitle: 'Horas con descansos aplicados (-30 min/día)',
            getTotal: (data: WeekData[]) => data.reduce((acc, week) => acc + week.totalDurationWithBreaks, 0),
            getWeekValue: (week: WeekData) => week.totalDurationWithBreaks,
        },
        nocturnal: {
            title: 'Total Nocturnas',
            subTitle: 'Horas trabajadas entre las 22:00 y las 06:00',
            getTotal: (data: WeekData[]) => data.reduce((acc, week) => acc + week.nightDuration, 0),
            getWeekValue: (week: WeekData) => week.nightDuration,
        },
        holiday: {
            title: 'Total Festivas',
            subTitle: 'Horas trabajadas en domingos o festivos',
            getTotal: (data: WeekData[]) => data.reduce((acc, week) => acc + week.holidayDuration, 0),
            getWeekValue: (week: WeekData) => week.holidayDuration,
        }
    }), []);
    
    const { title, subTitle, getTotal, getWeekValue } = config[dataType];
    const totalHours = getTotal(weeklyData);
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };

  return (
    <>
      <header>
        <div className="container mx-auto max-w-4xl flex items-center py-8 px-4 sm:px-6 lg:px-8">
            <button 
              onClick={onBack} 
              className="p-2 -ml-2 mr-2 sm:mr-4 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Volver al historial"
            >
                <ArrowLeftIcon />
            </button>
            <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Desglose Semanal</h3>
                <p className="text-slate-400 text-sm sm:text-base">{title}</p>
            </div>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-center mb-8 bg-black/30 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
            <p className="text-3xl font-bold text-purple-300">{formatHoursMinutes(totalHours)}</p>
            <p className="text-slate-300 text-sm mt-1">{subTitle}</p>
        </div>
        
        <div className="space-y-4">
            {weeklyData.length > 0 ? weeklyData.map(week => (
                <div key={week.id} className="bg-black/20 backdrop-blur-sm border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                    <div className="font-medium text-slate-300">
                        <p className="text-xs text-slate-400">Semana del</p>
                        <p className="text-md sm:text-lg capitalize">
                            {`${week.startDate.toLocaleDateString('es-ES', dateOptions)}`}
                        </p>
                    </div>
                    <div className="font-bold text-xl sm:text-2xl text-slate-100">
                        {formatHoursMinutes(getWeekValue(week))}
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 text-slate-400">No hay datos semanales para mostrar.</div>
            )}
        </div>
      </main>
    </>
  );
};


// --- App Component ---

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [modalMode, setModalMode] = useState<'start' | 'end' | 'edit' | null>(null);

  const [view, setView] = useState<'home' | 'history' | 'weeklyBreakdown'>('home');
  const [breakdownType, setBreakdownType] = useState<'bruto' | 'real' | 'nocturnal' | 'holiday' | null>(null);
  const [breakdownData, setBreakdownData] = useState<WeekData[] | null>(null);


  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);


  useEffect(() => {
    // Load saved sessions from local storage
    const savedSessions = localStorage.getItem('workSessions');
    if (savedSessions) {
      const parsedSessions: WorkSession[] = JSON.parse(savedSessions).map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      }));
      setWorkSessions(parsedSessions);
    }
    
    // Load active session from local storage
    const savedActiveSession = localStorage.getItem('activeSession');
    if (savedActiveSession) {
        const parsedActiveSession = JSON.parse(savedActiveSession);
        setActiveSession({
            ...parsedActiveSession,
            startTime: new Date(parsedActiveSession.startTime)
        });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('workSessions', JSON.stringify(workSessions));
  }, [workSessions]);

  useEffect(() => {
    if (activeSession) {
        localStorage.setItem('activeSession', JSON.stringify(activeSession));
    } else {
        localStorage.removeItem('activeSession');
    }
  }, [activeSession]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatDuration = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleClockInClick = () => {
    setModalMode('start');
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleClockOutClick = () => {
    setModalMode('end');
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleSaveSession = (sessionData: { startTime?: Date; endTime?: Date; id?: number }) => {
    if (modalMode === 'start' && sessionData.startTime) {
      // Start a new active session
      setActiveSession({
        id: Date.now(),
        startTime: sessionData.startTime
      });
    } else if (modalMode === 'end' && sessionData.endTime && activeSession) {
      // End the active session and create a full work session record
      const durationMs = sessionData.endTime.getTime() - activeSession.startTime.getTime();
      const newSession: WorkSession = {
        id: activeSession.id,
        startTime: activeSession.startTime,
        endTime: sessionData.endTime,
        duration: formatDuration(durationMs)
      };
      setWorkSessions(prev => 
        [...prev, newSession]
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      );
      setActiveSession(null);
    } else if (modalMode === 'edit' && sessionData.startTime && sessionData.endTime && sessionData.id) {
      // Update an existing session from history
      const durationMs = sessionData.endTime.getTime() - sessionData.startTime.getTime();
      const updatedSession: WorkSession = {
        id: sessionData.id,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        duration: formatDuration(durationMs)
      };
      setWorkSessions(prev => 
        prev.map(s => s.id === sessionData.id ? updatedSession : s)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      );
    }
    closeModal();
  };

  const handleDeleteSession = (sessionId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este fichaje?')) {
        setWorkSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };
  
  const openEditModal = (session: WorkSession) => {
    setModalMode('edit');
    setEditingSession(session);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
    setModalMode(null);
  };

  const handleExportData = async () => {
    try {
        const dataToExport = {
            workSessions: workSessions,
            activeSession: activeSession,
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        
        const date = new Date();
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const fileName = `Fichaje-${month}-${day}.json`;

        const blob = new Blob([jsonString], { type: "application/json" });
        const file = new File([blob], fileName, { type: blob.type });

        // Use Web Share API if available
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Copia de Seguridad de Fichajes',
                text: `Copia de seguridad del ${day} de ${month}.`,
                files: [file],
            });
        } else {
            // Fallback to download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        // Avoid showing an error if the user cancels the share dialog
        if ((error as DOMException).name === 'AbortError') {
            console.log("Share action was cancelled by the user.");
        } else {
            console.error("Error exporting data:", error);
            alert("Hubo un error al exportar los datos.");
        }
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres importar los datos? Esto sobreescribirá todos los datos actuales.')) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not a string.");
        }
        const data = JSON.parse(text);

        if (!data || !Array.isArray(data.workSessions)) {
          throw new Error("Invalid file format: 'workSessions' array not found.");
        }
        
        const parsedSessions: WorkSession[] = data.workSessions.map((s: any) => ({
          id: s.id,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          duration: s.duration,
        }));

        let parsedActiveSession: ActiveSession | null = null;
        if (data.activeSession) {
             parsedActiveSession = {
                id: data.activeSession.id,
                startTime: new Date(data.activeSession.startTime)
             }
        }
        
        setWorkSessions(parsedSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
        setActiveSession(parsedActiveSession);

        alert("Datos importados correctamente.");
      } catch (error) {
        console.error("Error importing data:", error);
        alert("Hubo un error al importar el archivo. Asegúrate de que es un archivo de copia de seguridad válido.");
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isModalOpen) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || isModalOpen) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    const minSwipeDist = 75;

    // Ensure it's a horizontal swipe, not a vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDist) {
        // Swipe Right -> Go Back
        if (diffX > 0) {
            if (view === 'history') {
                setView('home');
            } else if (view === 'weeklyBreakdown') {
                setView('history');
            }
        }
        // Swipe Left -> Go Forward
        else if (diffX < 0 && view === 'home') {
            setView('history');
        }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };
  
  const handleGoToBrutoBreakdown = (data: WeekData[]) => {
    setBreakdownData(data);
    setBreakdownType('bruto');
    setView('weeklyBreakdown');
  };

  const handleGoToRealBreakdown = (data: WeekData[]) => {
    setBreakdownData(data);
    setBreakdownType('real');
    setView('weeklyBreakdown');
  };

  const handleGoToNocturnalBreakdown = (data: WeekData[]) => {
    setBreakdownData(data);
    setBreakdownType('nocturnal');
    setView('weeklyBreakdown');
  };

  const handleGoToHolidayBreakdown = (data: WeekData[]) => {
    setBreakdownData(data);
    setBreakdownType('holiday');
    setView('weeklyBreakdown');
  };

  return (
    <div 
      className="min-h-screen text-slate-100 relative overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* --- Home View --- */}
      <div aria-hidden={view !== 'home'}>
          <Header />
          <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
              <CurrentStatus
                  currentTime={currentTime}
                  activeSession={activeSession}
                  onClockInClick={handleClockInClick}
                  onClockOutClick={handleClockOutClick}
                  formatDuration={formatDuration}
                  onGoToHistory={() => setView('history')}
                  onExport={handleExportData}
                  onImport={handleImportData}
              />
          </main>
      </div>

      {/* --- History View (Sliding Panel) --- */}
      <div
        className={`fixed inset-0 transition-transform duration-500 ease-in-out z-10 overflow-y-auto ${view === 'history' ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundImage: 'linear-gradient(to bottom right, #1e3a8a, #0f172a, #000000)',
          // Replicate body padding for safe areas on iOS
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-hidden={view !== 'history'}
      >
        <HistoryPage 
            sessions={workSessions}
            onBack={() => setView('home')}
            onEdit={openEditModal}
            onDelete={handleDeleteSession}
            onGoToBrutoBreakdown={handleGoToBrutoBreakdown}
            onGoToRealBreakdown={handleGoToRealBreakdown}
            onGoToNocturnalBreakdown={handleGoToNocturnalBreakdown}
            onGoToHolidayBreakdown={handleGoToHolidayBreakdown}
        />
      </div>

      {/* --- Weekly Breakdown View (Sliding Panel) --- */}
      <div
        className={`fixed inset-0 transition-transform duration-500 ease-in-out z-20 overflow-y-auto ${view === 'weeklyBreakdown' ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundImage: 'linear-gradient(to bottom right, #1e3a8a, #0f172a, #000000)',
          // Replicate body padding for safe areas on iOS
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-hidden={view !== 'weeklyBreakdown'}
      >
        {breakdownData && breakdownType && (
            <WeeklyBreakdownPage 
                weeklyData={breakdownData}
                dataType={breakdownType}
                onBack={() => setView('history')}
            />
        )}
      </div>
      
      {/* --- Modal (Stays on top) --- */}
      <SessionModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveSession}
        sessionToEdit={editingSession}
        modalMode={modalMode}
        currentTime={currentTime}
        activeSessionStartTime={activeSession?.startTime}
      />
    </div>
  );
};

export default App;