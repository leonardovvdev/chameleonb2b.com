type IconProps = {
  className?: string;
};

export const iconStatistics = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Barra izquierda (baja) */}
      <rect
        x="3"
        y="15"
        width="4"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Barra central (media) */}
      <rect
        x="10"
        y="12"
        width="4"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Barra derecha (alta) */}
      <rect
        x="17"
        y="9"
        width="4"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Línea de tendencia ascendente */}
      <path
        d="M3 10 L9 5.5 L13 8 L20 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Punta de la flecha */}
      <path
        d="M16 3 H20 V7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};