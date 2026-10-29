type IconProps = {
  className?: string;
};

export const iconFotocheck = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cuerpo de la credencial */}
      <rect
        x="4"
        y="4"
        width="16"
        height="19"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Presilla / clip superior */}
      <path
        d="M9.5 4 V2.7 C9.5 1.9 10.2 1.2 11 1.2 H13 C13.8 1.2 14.5 1.9 14.5 2.7 V4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Orificio del clip */}
      <circle
        cx="12"
        cy="2.7"
        r="0.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cabeza de la persona */}
      <circle
        cx="12"
        cy="11.3"
        r="2.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hombros de la persona */}
      <path
        d="M7.5 19 C7.5 16 9.5 14.6 12 14.6 C14.5 14.6 16.5 16 16.5 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Linea inferior tipo firma / franja de cargo */}
      <path
        d="M7 21.2 H17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};