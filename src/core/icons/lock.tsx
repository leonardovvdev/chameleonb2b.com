type IconProps = {
  className?: string;
};

export const iconLock = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Arco del candado */}
      <path
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Cuerpo */}
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Punto central */}
      <circle
        cx="12"
        cy="15.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
};