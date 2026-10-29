type IconProps = {
  className?: string;
};

export const iconColorPalette = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cuerpo de la paleta */}
    <path
      d="
        M12 3
        C6.48 3 2 6.86 2 11.5
        C2 14.54 4.46 16 6.5 16
        H8
        C8.83 16 9.5 16.67 9.5 17.5
        C9.5 18 9.3 18.35 9.1 18.6
        C8.8 19 8.5 19.4 8.5 20
        C8.5 21.1 9.7 21.9 11 21.9
        C16.8 21.9 22 17.5 22 12
        C22 6.98 17.52 3 12 3
        Z
      "
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Manchas de color */}
    <circle cx="7" cy="10" r="1.2" fill="currentColor" />
    <circle cx="11" cy="7" r="1.2" fill="currentColor" />
    <circle cx="16" cy="8" r="1.2" fill="currentColor" />
    <circle cx="18" cy="12.5" r="1.2" fill="currentColor" />
  </svg>
);