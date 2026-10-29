type IconProps = {
  className?: string;
};

export const iconDatabase = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Parte superior */}
      <ellipse
        cx="12"
        cy="5"
        rx="6"
        ry="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Lados */}
      <path
        d="M6 5V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M18 5V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Línea central */}
      <path
        d="M6 11C6 13 18 13 18 11"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Parte inferior */}
      <ellipse
        cx="12"
        cy="18"
        rx="6"
        ry="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
};