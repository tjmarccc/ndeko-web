interface NdekoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export function NdekoLogo({ size = 'md', showTagline = true, className = '' }: NdekoLogoProps) {
  const scales = {
    sm: 0.45,
    md: 0.65,
    lg: 0.9,
    xl: 1.2,
  };

  const scale = scales[size];
  const pillW = 139.444 * scale;
  const pillH = 95.659 * scale;
  const overlap = 40 * scale;
  const totalW = pillW * 2 - overlap;
  const fontSize = 61.869 * scale;
  const tagFontSize = 23.796 * scale;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`} style={{ fontFamily: "'Gluten', sans-serif" }}>
      <div style={{ position: 'relative', width: totalW, height: pillH }}>
        {/* Green pill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: pillW,
            height: pillH,
            background: '#3e8e67',
            borderRadius: pillH / 2,
          }}
        />
        {/* Maroon pill */}
        <div
          style={{
            position: 'absolute',
            left: pillW - overlap,
            top: 0,
            width: pillW,
            height: pillH,
            background: '#9d1c43',
            borderRadius: pillH / 2,
          }}
        />
        {/* NDEKO text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: fontSize,
            fontWeight: 'normal',
            letterSpacing: '-1px',
            zIndex: 2,
            lineHeight: 1,
            fontFamily: "'Gluten', sans-serif",
          }}
        >
          NDEKO
        </div>
      </div>
      {showTagline && (
        <p
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: tagFontSize,
            fontFamily: "'Gluten', sans-serif",
            fontWeight: 'normal',
            marginTop: 4,
            letterSpacing: '0.5px',
          }}
        >
          Smarter Is Better
        </p>
      )}
    </div>
  );
}
