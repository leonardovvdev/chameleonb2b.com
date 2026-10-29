type IconProps = {
  className?: string;
};

export const iconCalendar = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cuerpo principal del calendario */}
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Línea horizontal que separa el encabezado del mes */}
      <path
        d="M3 9 H21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Anilla / Soporte izquierdo */}
      <path
        d="M8 2 V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Anilla / Soporte derecho */}
      <path
        d="M16 2 V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cuadrícula de días: Fila 1 */}
      <path
        d="M7 13 H7.01 M12 13 H12.01 M17 13 H17.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cuadrícula de días: Fila 2 */}
      <path
        d="M7 17 H7.01 M12 17 H12.01 M17 17 H17.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
