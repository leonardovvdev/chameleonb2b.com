type IconProps = {
  className?: string;
};

export const iconFile = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Parte trasera de la carpeta (contorno con pestaña) */}
      <path
        d="
          M3 19
          V5
          C3 4.4 3.4 4 4 4
          H9
          L11 6.5
          H18
          C18.6 6.5 19 6.9 19 7.5
          V10
        "
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Solapa frontal inclinada (sólida) */}
      <path
        d="
          M6.2 10
          H21.3
          C21.9 10 22.2 10.5 22 11
          L19.8 18.3
          C19.6 18.7 19.3 19 18.8 19
          H3
          L5.4 10.7
          C5.5 10.3 5.8 10 6.2 10
          Z
        "
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};