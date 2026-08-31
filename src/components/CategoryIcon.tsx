interface Props {
  icon: string;
  size?: number;
  className?: string;
}

// If `icon` looks like a URL/path (http.., /icons/..) render it as an <img>,
// otherwise treat it as a plain emoji/text glyph. This lets category icons
// be swapped between emoji and real Minecraft item textures purely by
// changing the `icon` value in the categories table — no code change needed.
function isImagePath(icon: string): boolean {
  return /^(https?:\/\/|\/)/.test(icon.trim());
}

export default function CategoryIcon({ icon, size = 20, className = '' }: Props) {
  if (isImagePath(icon)) {
    return (
      <img
        src={icon}
        width={size}
        height={size}
        alt=""
        className={`inline-block align-middle ${className}`}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }
  return (
    <span className={`inline-block align-middle ${className}`} style={{ fontSize: size * 0.9 }}>
      {icon}
    </span>
  );
}
