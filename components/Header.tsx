import React from 'react';

const ClockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-b from-[#111827] to-transparent">
      <div className="container mx-auto max-w-4xl flex items-center justify-center pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <ClockIcon />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-slate-100 [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
          Control de Horario
        </h1>
      </div>
    </header>
  );
};

export default Header;