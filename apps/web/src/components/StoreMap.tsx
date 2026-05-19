type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  label?: string;
  className?: string;
};

export function StoreMap({ lat, lng, zoom = 17, label, className }: Props) {
  const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  return (
    <div className={`relative w-full h-full ${className ?? ""}`}>
      <iframe
        title={label ?? "Store location map"}
        src={src}
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

type DirectionsProps = {
  lat: number;
  lng: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function DirectionsLink({ lat, lng, children, className, style }: DirectionsProps) {
  return (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {children ?? "Get Directions ↗"}
    </a>
  );
}
