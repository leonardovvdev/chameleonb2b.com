type IconProps = {
  className?: string;
};

export const iconAdvertisement = ({ className }: IconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* Cuerpo del megafono */}
      <path
        d="
          M3 10
          V14
          H5.5
          L15 19
          V5
          L5.5 10
          H3
          Z
        "
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mango/asa inferior */}
      <path
        d="
          M6 14
          V17
          C6 18.1 6.9 19 8 19
          C8 17.5 8 15.5 8 14.3
        "
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ondas de sonido */}
      <path
        d="M18 8 C19.5 9.5 19.5 14.5 18 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 6 C22.8 8.5 22.8 15.5 20.5 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};