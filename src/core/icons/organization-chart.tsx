type IconProps = {
  className?: string;
};

export const iconOrganizationChart = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Persona superior - cabeza */}
      <circle
        cx="12"
        cy="4.3"
        r="1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Persona superior - hombros */}
      <path
        d="M8.3 9.5 C8.3 7.2 9.9 6.3 12 6.3 C14.1 6.3 15.7 7.2 15.7 9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lineas del organigrama */}
      <path
        d="M12 9.8 V12.3 M4.5 12.3 H19.5 M4.5 12.3 V14.3 M12 12.3 V14.3 M19.5 12.3 V14.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Persona inferior izquierda - cabeza */}
      <circle
        cx="4.5"
        cy="16.3"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Persona inferior izquierda - hombros */}
      <path
        d="M1.2 21 C1.2 18.9 2.6 18.1 4.5 18.1 C6.4 18.1 7.8 18.9 7.8 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Persona inferior centro - cabeza */}
      <circle
        cx="12"
        cy="16.3"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Persona inferior centro - hombros */}
      <path
        d="M8.7 21 C8.7 18.9 10.1 18.1 12 18.1 C13.9 18.1 15.3 18.9 15.3 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Persona inferior derecha - cabeza */}
      <circle
        cx="19.5"
        cy="16.3"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Persona inferior derecha - hombros */}
      <path
        d="M16.2 21 C16.2 18.9 17.6 18.1 19.5 18.1 C21.4 18.1 22.8 18.9 22.8 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};