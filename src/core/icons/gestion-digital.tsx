type IconProps = {
  className?: string;
};

export const iconGestionDigital = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Monitor */}
    <rect
      x="1"
      y="3"
      width="14"
      height="10"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Base del monitor */}
    <path
      d="M6 16 H10 M8 13 V16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Globo terráqueo dentro del monitor */}
    <circle
      cx="5.5"
      cy="8"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="
        M3 8 H8
        M5.5 5.5
        C4.3 6.6 4.3 9.4 5.5 10.5
        C6.7 9.4 6.7 6.6 5.5 5.5
        Z
      "
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Líneas de texto junto al globo */}
    <path
      d="M9.5 6.5 H12.5 M9.5 8 H12.5 M9.5 9.5 H11"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Engranaje */}
    <circle
      cx="18"
      cy="10"
      r="2.2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="
        M18 6.5 V7.5
        M18 12.5 V13.5
        M14.5 10 H15.5
        M20.5 10 H21.5
        M15.4 6.9 L16.1 7.6
        M19.9 12.4 L20.6 13.1
        M20.6 6.9 L19.9 7.6
        M16.1 12.4 L15.4 13.1
      "
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Wifi */}
    <path
      d="
        M19.5 3.5
        C20.6 3.5 21.5 4.4 21.5 5.5
        M18.7 4.8
        C19.1 4.8 19.5 5.2 19.5 5.6
      "
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Teléfono */}
    <rect
      x="16.5"
      y="15"
      width="6"
      height="8.5"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Gráfico circular en el teléfono */}
    <circle
      cx="19.5"
      cy="18.5"
      r="1.6"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.5 16.9 V18.5 L20.7 19.1"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Línea inferior del teléfono */}
    <path
      d="M18 21.5 H21"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);