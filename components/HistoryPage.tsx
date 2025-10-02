import React, { useMemo, useState, useEffect } from 'react';
import { WorkSession } from '../types';
import HistoryList from './HistoryList';

// --- HELPER FUNCTIONS ---

/**
 * Gets a YYYY-MM-DD string from a Date object in the local timezone.
 */
const getLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


/**
 * Gets the Monday of the week for a given date.
 * @param d The date.
 * @returns A new Date object set to the beginning of that Monday.
 */
const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Calculates the duration of overlap between two time intervals.
 */
const calculateIntervalOverlap = (start1: number, end1: number, start2: number, end2: number): number => {
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return Math.max(0, overlapEnd - overlapStart);
};


/**
 * Calculates the total duration of night hours (22:00 - 06:00) within a work session
 * and returns the specific dates on which those hours occurred.
 */
const calculateNightDuration = (session: WorkSession): { duration: number; dates: Date[] } => {
    let totalNightMs = 0;
    const nightDates = new Set<string>();
    const sessionStart = session.startTime.getTime();
    const sessionEnd = session.endTime.getTime();

    const loopStartDate = new Date(session.startTime);
    loopStartDate.setHours(0, 0, 0, 0);

    for (let dayTime = loopStartDate.getTime(); dayTime < sessionEnd; dayTime += 24 * 60 * 60 * 1000) {
        const currentDay = new Date(dayTime);
        const dayStart = currentDay.getTime();

        // Night period 1: 00:00 to 06:00
        const nightStart1 = dayStart;
        const nightEnd1 = dayStart + 6 * 60 * 60 * 1000;
        const overlap1 = calculateIntervalOverlap(sessionStart, sessionEnd, nightStart1, nightEnd1);
        if (overlap1 > 0) {
            totalNightMs += overlap1;
            nightDates.add(getLocalDateString(currentDay));
        }

        // Night period 2: 22:00 to 24:00
        const nightStart2 = dayStart + 22 * 60 * 60 * 1000;
        const nightEnd2 = dayStart + 24 * 60 * 60 * 1000;
        const overlap2 = calculateIntervalOverlap(sessionStart, sessionEnd, nightStart2, nightEnd2);
        if (overlap2 > 0) {
            totalNightMs += overlap2;
            nightDates.add(getLocalDateString(currentDay));
        }
    }

    const dates = Array.from(nightDates).map(dateStr => new Date(`${dateStr}T00:00:00`));
    return { duration: totalNightMs, dates };
};

/**
 * Calculates the total duration of holiday hours (Sundays) within a work session
 * and returns the specific dates of the holidays worked.
 */
const calculateHolidayDuration = (session: WorkSession): { duration: number; dates: Date[] } => {
    let totalHolidayMs = 0;
    const holidayDates = new Set<string>();
    const sessionStart = session.startTime.getTime();
    const sessionEnd = session.endTime.getTime();

    const loopStartDate = new Date(session.startTime);
    loopStartDate.setHours(0, 0, 0, 0);

    for (let dayTime = loopStartDate.getTime(); dayTime < sessionEnd; dayTime += 24 * 60 * 60 * 1000) {
        const currentDay = new Date(dayTime);
        if (currentDay.getDay() === 0) { // Sunday
            const dayStart = currentDay.getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const overlap = calculateIntervalOverlap(sessionStart, sessionEnd, dayStart, dayEnd);
            if (overlap > 0) {
                totalHolidayMs += overlap;
                holidayDates.add(getLocalDateString(currentDay));
            }
        }
    }
    const dates = Array.from(holidayDates).map(dateStr => new Date(`${dateStr}T00:00:00`));
    return { duration: totalHolidayMs, dates };
};


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


interface WeekData {
  id: string;
  startDate: Date;
  endDate: Date;
  sessions: WorkSession[];
  totalDuration: number;
  totalDurationWithBreaks: number;
}

// --- ICONS ---
const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

interface StatCardProps {
    title: string;
    subTitle?: string;
    value: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
    isExpandable?: boolean;
    isDetailsVisible?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({title, subTitle, value, icon, children, onClick, isExpandable, isDetailsVisible}) => (
    <div 
        className={`flex flex-col p-3 bg-black/20 rounded-lg transition-colors ${onClick ? 'cursor-pointer hover:bg-black/40' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : 'figure'}
        aria-expanded={isExpandable ? isDetailsVisible : undefined}
    >
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium text-slate-400">{title}</span>
                {isExpandable && (
                    <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isDetailsVisible ? 'rotate-180' : ''}`} />
                )}
            </div>
            {subTitle && <span className="text-xs text-slate-500">{subTitle}</span>}
            <span className={`text-xl font-semibold text-slate-100 ${subTitle ? 'mt-0' : 'mt-1'}`}>{value}</span>
        </div>
        {children && (
             <div className={`transition-all duration-500 ease-in-out overflow-y-auto ${isDetailsVisible ? 'max-h-96' : 'max-h-0'}`}>
                {children}
            </div>
        )}
    </div>
);

const DateList: React.FC<{ dates: Date[] }> = ({ dates }) => {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <div className="flex flex-wrap gap-2 justify-center pt-2">
            {dates.map(date => (
                <span key={date.toISOString()} className="bg-slate-700/50 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                    {formatDate(date)}
                </span>
            ))}
        </div>
    );
};

const WeeklyBreakdownList: React.FC<{
    weeks: WeekData[];
    dataType: 'bruto' | 'real';
}> = ({ weeks, dataType }) => {
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

    if (weeks.length === 0) {
        return (
            <div className="w-full mt-3 pt-3 border-t border-slate-700/50 text-center text-slate-500 text-sm">
                No hay datos para mostrar.
            </div>
        );
    }

    return (
        <div className="w-full mt-3 pt-3 border-t border-slate-700/50 space-y-2 text-sm">
            {weeks.map(week => (
                <div key={week.id} className="flex justify-between items-center px-2">
                    <span className="text-slate-400">
                        {`${week.startDate.toLocaleDateString('es-ES', dateOptions)} - ${week.endDate.toLocaleDateString('es-ES', dateOptions)}`}
                    </span>
                    <span className="font-semibold text-slate-200">
                        {formatHoursMinutes(dataType === 'bruto' ? week.totalDuration : week.totalDurationWithBreaks)}
                    </span>
                </div>
            ))}
        </div>
    );
};


// --- GLOBAL SUMMARY COMPONENT ---
interface GlobalSummaryCardProps {
    summary: {
        totalDuration: number;
        totalDurationWithBreaks: number;
        nightDuration: number;
        holidayDuration: number;
        nocturnalDates: Date[];
        holidayDates: Date[];
    };
    weeklyData: WeekData[];
}

const GlobalSummaryCard: React.FC<GlobalSummaryCardProps> = ({ summary, weeklyData }) => {
    const [detailsVisible, setDetailsVisible] = useState<'none' | 'nocturnal' | 'holiday' | 'bruto' | 'real'>('none');
    const hasNocturnalHours = summary.nocturnalDates.length > 0;
    const hasHolidayHours = summary.holidayDates.length > 0;

    return (
        <div className="bg-black/30 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-200 text-center mb-4">Resumen Total</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatCard 
                    title="TOTAL BRUTO" 
                    value={formatHoursMinutes(summary.totalDuration)} 
                    icon={<span className="text-purple-400 text-lg font-bold">Σ</span>}
                    isExpandable={weeklyData.length > 0}
                    isDetailsVisible={detailsVisible === 'bruto'}
                    onClick={weeklyData.length > 0 ? () => setDetailsVisible(prev => prev === 'bruto' ? 'none' : 'bruto') : undefined}
                >
                    <WeeklyBreakdownList weeks={weeklyData} dataType="bruto" />
                </StatCard>
                
                <StatCard 
                    title="TOTAL REAL"
                    subTitle="(-30 min/día)"
                    value={formatHoursMinutes(summary.totalDurationWithBreaks)} 
                    icon={<span className="text-green-400 text-lg font-bold">✓</span>}
                    isExpandable={weeklyData.length > 0}
                    isDetailsVisible={detailsVisible === 'real'}
                    onClick={weeklyData.length > 0 ? () => setDetailsVisible(prev => prev === 'real' ? 'none' : 'real') : undefined}
                >
                     <WeeklyBreakdownList weeks={weeklyData} dataType="real" />
                </StatCard>

                <StatCard 
                    title="NOCTURNAS" 
                    value={formatHoursMinutes(summary.nightDuration)} 
                    icon={<span className="text-blue-400">🌙</span>}
                    isExpandable={hasNocturnalHours}
                    isDetailsVisible={detailsVisible === 'nocturnal'}
                    onClick={hasNocturnalHours ? () => setDetailsVisible(prev => prev === 'nocturnal' ? 'none' : 'nocturnal') : undefined}
                >
                    {hasNocturnalHours && (
                        <div className="w-full mt-3 pt-3 border-t border-slate-700/50">
                            <DateList dates={summary.nocturnalDates} />
                        </div>
                    )}
                </StatCard>

                <StatCard 
                    title="FESTIVAS" 
                    value={formatHoursMinutes(summary.holidayDuration)} 
                    icon={<span className="text-yellow-400">☀️</span>}
                    isExpandable={hasHolidayHours}
                    isDetailsVisible={detailsVisible === 'holiday'}
                    onClick={hasHolidayHours ? () => setDetailsVisible(prev => prev === 'holiday' ? 'none' : 'holiday') : undefined}
                >
                    {hasHolidayHours && (
                        <div className="w-full mt-3 pt-3 border-t border-slate-700/50">
                            <DateList dates={summary.holidayDates} />
                        </div>
                    )}
                </StatCard>
            </div>
        </div>
    );
};


// --- WEEK SUMMARY COMPONENT ---
interface WeekSummaryCardProps {
    week: WeekData;
    onEdit: (session: WorkSession) => void;
    onDelete: (sessionId: number) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

const WeekSummaryCard: React.FC<WeekSummaryCardProps> = ({ week, onEdit, onDelete, isExpanded, onToggle }) => {
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const weekRange = `${week.startDate.toLocaleDateString('es-ES', dateOptions)} - ${week.endDate.toLocaleDateString('es-ES', dateOptions)}`;

    return (
        <div className="bg-black/30 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg">
             <div onClick={onToggle} className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/20 rounded-t-xl transition-colors">
                <div>
                    <p className="text-sm text-slate-400">Semana</p>
                    <p className="font-semibold text-slate-200 text-lg">{weekRange}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-purple-400 text-lg">{formatHoursMinutes(week.totalDuration)}</span>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
             </div>

             {/* Collapsible individual sessions list */}
             <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                    <HistoryList 
                        sessions={week.sessions}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </div>
             </div>
        </div>
    )
}


// --- HISTORY PAGE COMPONENT ---

interface HistoryPageProps {
  sessions: WorkSession[];
  onBack: () => void;
  onEdit: (session: WorkSession) => void;
  onDelete: (sessionId: number) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ sessions, onBack, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const [expandedWeeks, setExpandedWeeks] = useState<Set<string> | null>(() => {
        const savedState = localStorage.getItem('historyPageExpandedWeeks');
        if (savedState) {
            try {
                return new Set(JSON.parse(savedState));
            } catch (e) {
                console.error('Error parsing expanded weeks from localStorage:', e);
            }
        }
        return null; // Null signifies that we need to set the default state
    });

    const filteredSessions = useMemo(() => {
        if (!searchTerm.trim()) {
            return sessions;
        }

        const normalizedSearch = searchTerm
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const searchKeywords = normalizedSearch.split(' ').filter(Boolean);

        return sessions.filter(session => {
            const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            };
            const sessionDateStr = session.startTime.toLocaleDateString('es-ES', dateOptions);
            const normalizedSessionDateStr = sessionDateStr
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const hasNightHours = calculateNightDuration(session).duration > 0;
            const hasHolidayHours = calculateHolidayDuration(session).duration > 0;

            // Handle combined searches like "miercoles nocturna"
            return searchKeywords.every(keyword => {
                 const isDateMatch = normalizedSessionDateStr.includes(keyword);
                 const isNightMatch = ('nocturna'.includes(keyword) || 'noche'.includes(keyword)) && hasNightHours;
                 const isHolidayMatch = ('festivo'.includes(keyword) || 'domingo'.includes(keyword)) && hasHolidayHours;

                 return isDateMatch || isNightMatch || isHolidayMatch;
            });
        });
    }, [sessions, searchTerm]);

    const globalSummary = useMemo(() => {
        let totalDuration = 0;
        let nightDuration = 0;
        let holidayDuration = 0;
        const nocturnalDates = new Set<string>();
        const holidayDates = new Set<string>();
        const workedDays = new Set<string>();

        filteredSessions.forEach(s => {
            totalDuration += s.endTime.getTime() - s.startTime.getTime();
            
            const nightInfo = calculateNightDuration(s);
            nightDuration += nightInfo.duration;
            nightInfo.dates.forEach(d => nocturnalDates.add(getLocalDateString(d)));

            const holidayInfo = calculateHolidayDuration(s);
            holidayDuration += holidayInfo.duration;
            holidayInfo.dates.forEach(d => holidayDates.add(getLocalDateString(d)));
            
            // Find all unique calendar days the session touches
            const loopStartDate = new Date(s.startTime);
            loopStartDate.setHours(0, 0, 0, 0);

            for (let dayTime = loopStartDate.getTime(); dayTime < s.endTime.getTime(); dayTime += 24 * 60 * 60 * 1000) {
                const currentDay = new Date(dayTime);
                const dayStart = currentDay.getTime();
                const dayEnd = dayStart + 24 * 60 * 60 * 1000;
                
                const overlap = calculateIntervalOverlap(s.startTime.getTime(), s.endTime.getTime(), dayStart, dayEnd);
                if (overlap > 0) {
                    workedDays.add(getLocalDateString(currentDay));
                }
            }
        });
        
        const totalBreakTimeMs = workedDays.size * 30 * 60 * 1000;
        const totalDurationWithBreaks = Math.max(0, totalDuration - totalBreakTimeMs);
        
        return {
            totalDuration,
            totalDurationWithBreaks,
            nightDuration,
            holidayDuration,
            nocturnalDates: Array.from(nocturnalDates).map(ds => new Date(`${ds}T00:00:00`)).sort((a,b) => a.getTime() - b.getTime()),
            holidayDates: Array.from(holidayDates).map(ds => new Date(`${ds}T00:00:00`)).sort((a,b) => a.getTime() - b.getTime()),
        };
    }, [filteredSessions]);

    const weeklyData = useMemo<WeekData[]>(() => {
        const groupedByWeek: Record<string, { startDate: Date, sessions: WorkSession[] }> = {};

        filteredSessions.forEach(session => {
            const monday = getMonday(session.startTime);
            const weekId = monday.toISOString().substring(0, 10);

            if (!groupedByWeek[weekId]) {
                groupedByWeek[weekId] = { startDate: monday, sessions: [] };
            }
            groupedByWeek[weekId].sessions.push(session);
        });

        return Object.values(groupedByWeek)
            .map(({ startDate, sessions }) => {
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);

                let totalDuration = 0;
                const workedDays = new Set<string>();

                sessions.forEach(s => {
                    totalDuration += s.endTime.getTime() - s.startTime.getTime();

                    // Find all unique calendar days the session touches for this week
                    const loopStartDate = new Date(s.startTime);
                    loopStartDate.setHours(0, 0, 0, 0);

                    for (let dayTime = loopStartDate.getTime(); dayTime < s.endTime.getTime(); dayTime += 24 * 60 * 60 * 1000) {
                        const currentDay = new Date(dayTime);
                        const dayStart = currentDay.getTime();
                        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
                        
                        const overlap = calculateIntervalOverlap(s.startTime.getTime(), s.endTime.getTime(), dayStart, dayEnd);
                        if (overlap > 0) {
                            workedDays.add(getLocalDateString(currentDay));
                        }
                    }
                });
                
                const totalBreakTimeMs = workedDays.size * 30 * 60 * 1000;
                const totalDurationWithBreaks = Math.max(0, totalDuration - totalBreakTimeMs);
                
                return {
                    id: startDate.toISOString(),
                    startDate,
                    endDate,
                    sessions,
                    totalDuration,
                    totalDurationWithBreaks,
                };
            })
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    }, [filteredSessions]);

    useEffect(() => {
        if (expandedWeeks === null && weeklyData.length > 0) {
            setExpandedWeeks(new Set(weeklyData.map(w => w.id)));
        } else if (expandedWeeks !== null) {
            localStorage.setItem('historyPageExpandedWeeks', JSON.stringify(Array.from(expandedWeeks)));
        }
    }, [expandedWeeks, weeklyData]);

    const handleToggleWeek = (weekId: string) => {
        setExpandedWeeks(prev => {
            const currentWeeks = prev === null ? new Set(weeklyData.map(w => w.id)) : prev;
            const newSet = new Set(currentWeeks);
            if (newSet.has(weekId)) {
                newSet.delete(weekId);
            } else {
                newSet.add(weekId);
            }
            return newSet;
        });
    };

    return (
        <>
            <header>
                <div className="container mx-auto max-w-4xl flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
                    <h3 className="text-2xl font-semibold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">Historial de Fichajes</h3>
                </div>
            </header>

            <main className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                {sessions.length > 0 && <GlobalSummaryCard summary={globalSummary} weeklyData={weeklyData} />}
                
                <form
                    onSubmit={(e) => e.preventDefault()}
                    role="search"
                    className="relative mb-6"
                >
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        inputMode="search"
                        placeholder="Buscar por día, fecha, 'nocturna', 'festivo'..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-slate-200 bg-black/30 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                        aria-label="Buscar en el historial de fichajes"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </form>

                {weeklyData.length === 0 ? (
                     <div className="text-center py-10 px-6 bg-black/30 backdrop-blur-md border border-slate-700/50 rounded-lg">
                        {searchTerm ? (
                            <>
                                <p className="text-slate-400">No se encontraron resultados para <span className="font-semibold text-slate-200">"{searchTerm}"</span>.</p>
                                <p className="text-slate-500 mt-2">Intenta con otra búsqueda o borra el filtro.</p>
                            </>
                        ) : (
                            <>
                                 <p className="text-slate-400">No hay fichajes registrados todavía.</p>
                                 <p className="text-slate-500 mt-2">Usa el botón "Fichar Entrada" para empezar a registrar tu jornada.</p>
                            </>
                        )}
                     </div>
                ) : (
                    <div className="space-y-6">
                        {weeklyData.map(week => (
                            <WeekSummaryCard
                                key={week.id}
                                week={week}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                isExpanded={expandedWeeks === null || expandedWeeks.has(week.id)}
                                onToggle={() => handleToggleWeek(week.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </>
    );
};

export default HistoryPage;