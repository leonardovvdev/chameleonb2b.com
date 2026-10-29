type IconProps = {
  className?: string;
};

export const iconBell = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cuerpo de la campana */}
      <path
        d="
          M6 10
          C6 6.7 8.7 4 12 4
          C15.3 4 18 6.7 18 10
          V14.5
          L20 17.5
          H4
          L6 14.5
          Z
        "
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Badge/campanilla superior */}
      <path
        d="M12 2 V4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Badajo inferior (campanilla) */}
      <path
        d="M9.5 17.5 C9.5 18.9 10.6 20 12 20 C13.4 20 14.5 18.9 14.5 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};