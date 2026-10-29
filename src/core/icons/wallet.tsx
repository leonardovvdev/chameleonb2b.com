type IconProps = {
  className?: string;
};

export const iconWallet = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cuerpo principal de la billetera */}
    <path
      d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Solapa / Cierre de la billetera */}
    <path
      d="M16 12H20C20.5523 12 21 11.5523 21 11V13C21 13.5523 20.5523 14 20 14H16C14.8954 14 14 13.1046 14 12C14 10.8954 14.8954 10 16 10Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Detalle del botón / broche */}
    <circle 
      cx="17.5" 
      cy="12" 
      r="1" 
      fill="currentColor" 
    />
  </svg>
);