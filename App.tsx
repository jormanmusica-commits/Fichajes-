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

  return (
    <div className="min-h-screen text-slate-100">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <Header />
        {view === 'home' ? (
            <main>
                <CurrentStatus
                    currentTime={currentTime}
                    activeSession={activeSession}
                    onClockInClick={handleClockInClick}
                    onClockOutClick={handleClockOutClick}
                    formatDuration={formatDuration}
                    onGoToHistory={() => setView('history')}
                />
            </main>
        ) : (
            <HistoryPage 
                sessions={workSessions}
                onBack={() => setView('home')}
                onEdit={openEditModal}
                onDelete={handleDeleteSession}
            />
        )}
      </div>
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