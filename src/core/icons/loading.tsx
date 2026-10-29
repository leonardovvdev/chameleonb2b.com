type IconProps = {
  className?: string;
};

export const iconLoading = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      stroke="currentColor"
      strokeWidth="4"
      strokeOpacity="0.25"
    />

    <path
      d="M45 25A20 20 0 0030 5"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);