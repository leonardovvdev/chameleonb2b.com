type IconProps = {
  className?: string;
};

export const iconGlobo = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Circulo exterior */}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Meridiano central (vertical) */}
    <path
      d="
        M12 3
        C9.5 3 8 7 8 12
        C8 17 9.5 21 12 21
        C14.5 21 16 17 16 12
        C16 7 14.5 3 12 3
        Z
      "
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Lineas de latitud horizontales */}
    <path
      d="M3.3 9 H20.7 M3.3 15 H20.7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);