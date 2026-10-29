type IconProps = {
  className?: string;
};

export const iconAlert = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Triángulo con esquinas redondeadas */}
      <path
        d="M10.3 4.2 L2.8 17.6 A2 2 0 0 0 4.5 20.6 H19.5 A2 2 0 0 0 21.2 17.6 L13.7 4.2 A2 2 0 0 0 10.3 4.2 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Línea del signo de exclamación */}
      <path
        d="M12 9.5 V13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Punto del signo de exclamación */}
      <path
        d="M12 17 H12.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};