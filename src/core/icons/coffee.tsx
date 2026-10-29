type IconProps = {
  className?: string;
};

export const iconCoffee = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 9H16V14C16 16.2091 14.2091 18 12 18H9C6.79086 18 5 16.2091 5 14V9Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 11H17.5C18.8807 11 20 12.1193 20 13.5C20 14.8807 18.8807 16 17.5 16H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 3V5M12 3V5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);