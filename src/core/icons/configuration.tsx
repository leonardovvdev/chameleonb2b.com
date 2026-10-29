type IconProps = {
  className?: string;
};

export const iconConfiguration = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cuerpo de la tuerca con dientes */}
    <path
      d="
        M10.5 2
        H13.5
        L14 4.2
        C14.9 4.45 15.75 4.85 16.5 5.35
        L18.5 4.2
        L20.5 6.2
        L19.35 8.2
        C19.85 8.95 20.25 9.8 20.5 10.7
        L22.7 11.2
        V14.2
        L20.5 14.7
        C20.25 15.6 19.85 16.45 19.35 17.2
        L20.5 19.2
        L18.5 21.2
        L16.5 20.05
        C15.75 20.55 14.9 20.95 14 21.2
        L13.5 23.4
        H10.5
        L10 21.2
        C9.1 20.95 8.25 20.55 7.5 20.05
        L5.5 21.2
        L3.5 19.2
        L4.65 17.2
        C4.15 16.45 3.75 15.6 3.5 14.7
        L1.3 14.2
        V11.2
        L3.5 10.7
        C3.75 9.8 4.15 8.95 4.65 8.2
        L3.5 6.2
        L5.5 4.2
        L7.5 5.35
        C8.25 4.85 9.1 4.45 10 4.2
        Z
      "
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0, -1)"
    />

    {/* Circulo central hueco */}
    <circle
      cx="12"
      cy="11.7"
      r="3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);