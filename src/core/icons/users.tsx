type IconProps = {
  className?: string;
};

export const iconUsers = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cabeza usuario principal */}
      <circle
        cx="9"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Cuerpo usuario principal */}
      <path
        d="M2.5 20C2.5 16.5 5.4 14 9 14C12.6 14 15.5 16.5 15.5 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Cabeza usuario secundario (atras, mas chica) */}
      <path
        d="M16.5 5.5C18 5.8 19 7 19 8.5C19 10 18 11.2 16.5 11.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Cuerpo usuario secundario (atras) */}
      <path
        d="M17.5 14.3C20.2 14.9 21.5 17 21.5 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};