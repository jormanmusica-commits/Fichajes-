import React from 'react';
import { WorkSession } from '../types';
import TimeCard from './TimeCard';

interface HistoryListProps {
  sessions: WorkSession[];
  onEdit: (session: WorkSession) => void;
  onDelete: (sessionId: number) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ sessions, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
        {sessions.map(session => (
            <TimeCard 
                key={session.id} 
                session={session}
                onEdit={() => onEdit(session)}
                onDelete={() => onDelete(session.id)}
            />
        ))}
    </div>
  );
};

export default HistoryList;