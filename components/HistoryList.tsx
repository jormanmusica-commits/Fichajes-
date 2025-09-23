import React, { useState } from 'react';
import { WorkSession } from '../types';
import TimeCard from './TimeCard';

interface HistoryListProps {
  sessions: WorkSession[];
  onEdit: (session: WorkSession) => void;
  onDelete: (sessionId: number) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ sessions, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };

  return (
    <div className="space-y-4">
        {sessions.map(session => (
            <TimeCard 
            key={session.id} 
            session={session}
            isExpanded={expandedId === session.id}
            onToggle={() => handleToggle(session.id)}
            onEdit={() => onEdit(session)}
            onDelete={() => onDelete(session.id)}
            />
        ))}
    </div>
  );
};

export default HistoryList;