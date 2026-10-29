type IconProps = {
  className?: string;
};

export const iconAttendance = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Hoja */}
    <rect
      x="3"
      y="3"
      width="14"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Casilla 1 (marcada) */}
    <rect
      x="5.2"
      y="6.2"
      width="2.6"
      height="2.6"
      rx="0.6"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path
      d="M5.8 7.5 L6.4 8.1 L7.4 6.8"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Casilla 2 (marcada) */}
    <rect
      x="5.2"
      y="9.7"
      width="2.6"
      height="2.6"
      rx="0.6"
      stroke="currentColor"
      strokeWidth="1"
    />
    <path
      d="M5.8 11 L6.4 11.6 L7.4 10.3"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Casilla 3 (vacía) */}
    <rect
      x="5.2"
      y="13.2"
      width="2.6"
      height="2.6"
      rx="0.6"
      stroke="currentColor"
      strokeWidth="1"
    />

    {/* Casilla 4 (vacía) */}
    <rect
      x="5.2"
      y="16.7"
      width="2.6"
      height="2.6"
      rx="0.6"
      stroke="currentColor"
      strokeWidth="1"
    />

    {/* Líneas de texto */}
    <line
      x1="9.5"
      y1="7.5"
      x2="14"
      y2="7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <line
      x1="9.5"
      y1="11"
      x2="12.5"
      y2="11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <line
      x1="9.5"
      y1="14.5"
      x2="10.5"
      y2="14.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <line
      x1="9.5"
      y1="18"
      x2="13"
      y2="18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Lápiz */}
    <path
      d="M21.2 4.8C21.6 4.4 21.6 3.8 21.2 3.4C20.8 3 20.2 3 19.8 3.4L11 12.2V15H13.8L22.6 6.2C23 5.8 23 5.2 22.6 4.8L21.2 4.8Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />

    <line
      x1="18"
      y1="5.5"
      x2="20.5"
      y2="8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);