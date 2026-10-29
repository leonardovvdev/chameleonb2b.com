type IconProps = {
  className?: string;
};

export const iconJobPosition = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="25 20 140 190"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Caja superior */}
    <rect x="100" y="30" width="50" height="50" fill="currentColor" />

    {/* Caja inferior */}
    <rect x="78" y="78" width="72" height="72" fill="currentColor" />

    {/* Cabeza */}
    <circle cx="52" cy="76" r="14" fill="currentColor" />

    {/* Torso (inclinado hacia las cajas) */}
    <path
      d="M54 96 L64 148"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
    />

    {/* Brazo hacia las cajas */}
    <path
      d="M50 100 L88 122"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
    />

    {/* Pierna delantera */}
    <path
      d="M66 150 L72 196"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinecap="round"
    />

    {/* Pierna trasera */}
    <path
      d="M60 150 L50 178 L46 196"
      stroke="currentColor"
      strokeWidth="13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);