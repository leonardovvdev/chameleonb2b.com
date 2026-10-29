type IconProps = {
  className?: string;
};

export const iconMap = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Pliegue izquierdo del mapa */}
      <path
        d="M2 8 L8 6 V17 L2 19 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pliegue central del mapa */}
      <path
        d="M8 6 L15 8 V19 L8 17 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pliegue derecho del mapa */}
      <path
        d="M15 8 L22 6 V17 L15 19 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ruta punteada */}
      <path
        d="M4.5 15 C7 11 10 11 12 15 C14 19 17 19 19.5 15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1.5 2"
      />

      {/* Pin de ubicacion */}
      <path
        d="
          M12 1
          C9.5 1 7.5 3 7.5 5.5
          C7.5 8.5 12 13 12 13
          C12 13 16.5 8.5 16.5 5.5
          C16.5 3 14.5 1 12 1
          Z
        "
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="12"
        cy="5.3"
        r="1.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
};