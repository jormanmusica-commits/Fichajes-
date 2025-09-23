
import React from 'react';

const ClockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center py-6 mb-8 border-b-2 border-slate-700">
      <ClockIcon />
      <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-slate-100">
        Control de Horario
      </h1>
    </header>
  );
};

export default Header;