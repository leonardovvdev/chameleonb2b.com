type IconProps = {
  className?: string;
};

export const iconLogo = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Círculo exterior */}
    <circle
      cx="12"
      cy="12"
      r="10.5"
      stroke="currentColor"
      strokeWidth="1.4"
    />

    {/* Barra superior corta */}
    <rect
      x="9.5"
      y="4.8"
      width="5"
      height="1.6"
      rx="0.6"
      fill="currentColor"
    />

    {/* Barra ancha superior */}
    <rect
      x="6"
      y="8.3"
      width="12"
      height="1.6"
      rx="0.6"
      fill="currentColor"
    />

    {/* Barra ancha inferior */}
    <rect
      x="6"
      y="14.1"
      width="12"
      height="1.6"
      rx="0.6"
      fill="currentColor"
    />

    {/* Barra inferior corta */}
    <rect
      x="9.5"
      y="17.6"
      width="5"
      height="1.6"
      rx="0.6"
      fill="currentColor"
    />
  </svg>
);