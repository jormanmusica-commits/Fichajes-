import React from 'react';

interface CurrentStatusProps {
  currentTime: Date;
  activeSession: { startTime: Date } | null;
  onClockInClick: () => void;
  onClockOutClick: () => void;
  formatDuration: (ms: number) => string;
  onGoToHistory: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlayIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

const ExportIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const ImportIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const CurrentStatus: React.FC<CurrentStatusProps> = ({ currentTime, activeSession, onClockInClick, onClockOutClick, formatDuration, onGoToHistory, onExport, onImport }) => {
    
    const runningDuration = activeSession ? currentTime.getTime() - activeSession.startTime.getTime() : 0;

    return (
        <div className="bg-black/30 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 mb-10 text-center flex flex-col items-center">
            <h2 className="text-lg font-semibold text-slate-400 tracking-widest mb-2">RELOJ</h2>
            <p className="font-orbitron text-5xl sm:text-6xl font-bold tracking-wider text-slate-100 mb-6">
                {currentTime.toLocaleTimeString('es-ES')}
            </p>
            
            <div className="w-full flex flex-col items-center justify-center gap-4">
                 {activeSession ? (
                    <>
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <span className="text-lg font-bold text-green-400 animate-pulse">TURNO ACTIVO</span>
                            <span className="font-orbitron text-4xl text-slate-200">{formatDuration(runningDuration)}</span>
                        </div>
                        <button
                            onClick={onClockOutClick}
                            className="flex items-center justify-center w-64 h-14 text-lg font-bold text-white rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            <StopIcon />
                            Fichar Salida
                        </button>
                    </>
                 ) : (
                    <button
                        onClick={onClockInClick}
                        className="flex items-center justify-center w-64 h-14 text-lg font-bold text-white rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    >
                        <PlayIcon />
                        Fichar Entrada
                    </button>
                 )}
            </div>
             <div className="mt-8">
                <button
                    onClick={onGoToHistory}
                    className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 group flex items-center gap-2"
                >
                    <span>Ver historial completo</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                </button>
            </div>
            <div className="w-full border-t border-slate-700/50 mt-8 pt-6">
                <h3 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Gestión de Datos
                </h3>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={onExport}
                        className="flex items-center justify-center w-full sm:w-auto text-sm font-semibold px-6 py-3 rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 shadow-lg"
                        aria-label="Exportar todos los datos a un archivo JSON"
                    >
                        <ExportIcon />
                        Exportar Datos
                    </button>
                    
                    <label className="flex items-center justify-center w-full sm:w-auto text-sm font-semibold px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg cursor-pointer" aria-label="Importar datos desde un archivo JSON">
                        <ImportIcon />
                        Importar Datos
                        <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={onImport}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default CurrentStatus;