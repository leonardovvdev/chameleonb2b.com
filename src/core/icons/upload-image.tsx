
type IconProps = {
  className?: string;
};

/** Icono "subir imagen". El tamaño lo define la clase CSS que se le pase. */
export const iconUploadImage = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.6" />
    <path d="M21 15l-4.5-4.5L8 19" />
    <path d="M12 16v-5m0 0l-2 2m2-2l2 2" />
  </svg>
);
