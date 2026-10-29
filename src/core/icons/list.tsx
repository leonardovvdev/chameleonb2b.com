type IconProps = {
  className?: string;
};

export const iconList = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cuerpo de la tablilla (abierto arriba donde va el sujetapapeles) */}
      <path
        d="M9 4 H6 A2 2 0 0 0 4 6 V20 A2 2 0 0 0 6 22 H18 A2 2 0 0 0 20 20 V6 A2 2 0 0 0 18 4 H15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sujetapapeles superior */}
      <path
        d="M9 4 V3.5 A1.5 1.5 0 0 1 10.5 2 H13.5 A1.5 1.5 0 0 1 15 3.5 V4 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Casillas de asistencia */}
      <rect
        x="7"
        y="8.25"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="11.25"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="14.25"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="17.25"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Líneas de cada fila (nombres) */}
      <path
        d="M12 9.5 H17 M12 12.5 H17 M12 15.5 H17 M12 18.5 H17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};