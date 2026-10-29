type IconProps = {
  className?: string;
};

export const iconRol = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cabeza de la persona */}
      <circle
        cx="9.5"
        cy="5.5"
        r="2.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hombros de la persona */}
      <path
        d="M4.5 13.5 C4.5 10.3 6.6 8.7 9.5 8.7 C11 8.7 12.2 9.1 13 9.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Circulo central del engranaje */}
      <circle
        cx="16"
        cy="16"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dientes del engranaje */}
      <path
        d="M16 11.6 V10.2 M16 21.8 V20.4 M20.4 16 H21.8 M10.2 16 H11.6 M19.1 12.9 L20.1 11.9 M11.9 20.1 L12.9 19.1 M19.1 19.1 L20.1 20.1 M11.9 11.9 L12.9 12.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};