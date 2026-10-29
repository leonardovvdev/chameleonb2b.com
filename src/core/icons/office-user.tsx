type IconProps = {
  className?: string;
};

export const iconOfficeUser = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="40 60 265 255"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cabeza */}
    <circle cx="250" cy="87" r="28" fill="currentColor" />

    {/* Torso (erguido, apoyado en el asiento) */}
    <path
      d="M250 142 L256 212"
      stroke="currentColor"
      strokeWidth="44"
      strokeLinecap="round"
    />

    {/* Brazo hacia la laptop */}
    <path
      d="M240 140 L172 146"
      stroke="currentColor"
      strokeWidth="18"
      strokeLinecap="round"
    />

    {/* Muslo (horizontal sobre el asiento) */}
    <path
      d="M256 218 L178 218"
      stroke="currentColor"
      strokeWidth="28"
      strokeLinecap="round"
    />

    {/* Espinilla (vertical hasta el piso) */}
    <path
      d="M178 218 L170 294"
      stroke="currentColor"
      strokeWidth="28"
      strokeLinecap="round"
    />

    {/* Respaldo de la silla */}
    <path
      d="M292 152 Q296 195 288 232"
      stroke="currentColor"
      strokeWidth="12"
      strokeLinecap="round"
    />

    {/* Asiento */}
    <rect x="222" y="234" width="70" height="13" rx="6" fill="currentColor" />

    {/* Pilar de la silla */}
    <rect x="251" y="246" width="12" height="44" fill="currentColor" />

    {/* Base de la silla */}
    <path
      d="M222 304 V297 Q222 289 232 289 H282 Q292 289 292 297 V304"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Escritorio: tapa */}
    <rect x="44" y="165" width="130" height="14" fill="currentColor" />

    {/* Escritorio: cuerpo */}
    <rect x="57" y="179" width="95" height="123" fill="currentColor" />

    {/* Laptop: base */}
    <rect x="90" y="157" width="62" height="8" rx="2" fill="currentColor" />

    {/* Laptop: pantalla */}
    <path
      d="M82 92 L98 158"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);