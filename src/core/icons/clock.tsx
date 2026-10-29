type IconProps = {
  className?: string;
};

export const iconClock = ({ className }: IconProps) => (
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
      r="9.5"
      stroke="currentColor"
      strokeWidth="2.4"
    />

    {/* Manecillas */}
    <path
      d="M10.2 6.5 V12.4 L15.2 15.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  </svg>
);