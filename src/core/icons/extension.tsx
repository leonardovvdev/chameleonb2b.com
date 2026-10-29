type IconProps = {
  className?: string;
};

export const iconExtension = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Forma de pieza de rompecabezas */}
    <path
      d="
        M4 4
        H9
        A3 3 0 0 1 15 4
        H20
        V9
        A3 3 0 0 1 20 15
        V20
        H15
        A3 3 0 0 0 9 20
        H4
        V15
        A3 3 0 0 0 4 9
        Z
      "
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);