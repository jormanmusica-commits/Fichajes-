import React, { useState, useEffect } from 'react';
import { WorkSession } from './types';
import Header from './components/Header';
import CurrentStatus from './components/CurrentStatus';
import HistoryPage from './components/HistoryPage';
import SessionModal from './components/SessionModal';

type ActiveSession = {
    id: number;
    startTime: Date;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [modalMode, setModalMode] = useState<'start' | 'end' | 'edit' | null>(null);

  const [view, setView] = useState<'home' | 'history'>('home');

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
        if (diffX > 0 && view === 'history') {
            setView('home');
        }
        // Swipe Left -> Go Forward
        else if (diffX < 0 && view === 'home') {
            setView('history');
        }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div 
      className="min-h-screen text-slate-100 relative overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* --- Home View --- */}
      <div aria-hidden={view === 'history'}>
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
        aria-hidden={view === 'home'}
      >
        <HistoryPage 
            sessions={workSessions}
            onBack={() => setView('home')}
            onEdit={openEditModal}
            onDelete={handleDeleteSession}
        />
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
