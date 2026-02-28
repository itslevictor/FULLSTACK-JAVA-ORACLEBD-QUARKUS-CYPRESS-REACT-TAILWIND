import React from 'react';

const IconButton = ({ children, onClick, className = "", title = "" }) => {
  return (
    <button 
      onClick={onClick}
      title={title}
      type="button" // Evita comportamentos de submit acidentais
      className={`cursor-pointer !pointer-events-auto transition-all active:scale-95 hover:opacity-70 flex items-center justify-center ${className}`}
      style={{ cursor: 'pointer' }} // Reforço inline para garantir a "mãozinha"
    >
      {children}
    </button>
  );
};

export default IconButton;