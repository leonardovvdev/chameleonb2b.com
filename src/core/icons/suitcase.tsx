type IconProps = {
  className?: string;
};

export const iconSuitcase = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Maleta */}
    <rect
      x="3"
      y="7"
      width="18"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />

    {/* Asa de la maleta */}
    <path
      d="M8 7V5.5C8 4.67 8.67 4 9.5 4H14.5C15.33 4 16 4.67 16 5.5V7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Separación central */}
    <path
      d="M3 12H21"
      stroke="currentColor"
      strokeWidth="1.6"
    />

    {/* Cierre / broche */}
    <path
      d="M10 12V14H14V12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
