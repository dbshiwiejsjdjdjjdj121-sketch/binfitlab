export function BrandArt() {
  return (
    <svg
      className="brand-art"
      viewBox="0 0 620 480"
      role="img"
      aria-label="Illustration of modular green storage bins arranged on a Gridfinity baseplate"
    >
      <defs>
        <pattern
          id="art-grid"
          width="42"
          height="42"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="40"
            height="40"
            x="1"
            y="1"
            rx="6"
            fill="none"
            stroke="#aeb9a0"
            strokeWidth="2"
          />
        </pattern>
        <linearGradient id="bin-wall" x2="0" y2="1">
          <stop stopColor="#d8e99c" />
          <stop offset="1" stopColor="#c1d37e" />
        </linearGradient>
        <filter id="art-shadow">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="315"
        cy="370"
        rx="204"
        ry="38"
        fill="#49562d"
        opacity=".13"
        filter="url(#art-shadow)"
      />
      <g transform="translate(80 208) rotate(-26) skewX(28) scale(1 .78)">
        <rect x="-3" y="30" width="405" height="268" rx="12" fill="#9fae8d" />
        <rect width="402" height="282" rx="10" fill="#d2d8c8" />
        <rect x="12" y="12" width="378" height="252" fill="url(#art-grid)" />
        {[
          [23, 23, 112, 154, 45],
          [148, 23, 112, 70, 35],
          [272, 23, 112, 70, 35],
          [148, 109, 236, 70, 40],
          [23, 194, 112, 70, 30],
          [148, 194, 112, 70, 30],
          [272, 194, 112, 70, 30],
        ].map(([x, y, w, h, z], i) => (
          <g key={i}>
            <path
              d={`M${x},${y} h${w} v${h} l0,${z} h-${w}z`}
              fill={i === 4 ? "#939e8c" : "#adc16d"}
            />
            <rect
              x={x}
              y={y - z}
              width={w}
              height={h}
              rx="10"
              fill={i === 4 ? "#c3cdc0" : "#d7e895"}
              stroke={i === 4 ? "#adbaa6" : "#bdce80"}
              strokeWidth="2"
            />
            <rect
              x={x + 8}
              y={y - z + 8}
              width={w - 16}
              height={h - 16}
              rx="6"
              fill={i === 4 ? "#9ba991" : "#abbf69"}
            />
            <path
              d={`M${x + 8},${y - z + 14}q0,-6 6,-6h${w - 28}q6,0 6,6v${h - 24}h-${w - 16}z`}
              fill={i === 4 ? "#b1bda8" : "url(#bin-wall)"}
            />
            {i === 0 && (
              <path
                d={`M${x + 8} ${y - z + h / 2}h${w - 16}`}
                stroke="#92a959"
                strokeWidth="7"
              />
            )}
            {i === 3 && (
              <path
                d={`M${x + w / 2} ${y - z + 8}v${h - 16}`}
                stroke="#a4b867"
                strokeWidth="7"
              />
            )}
          </g>
        ))}
      </g>
      <g fill="#758269" fontFamily="monospace" fontSize="11">
        <text x="452" y="108">
          42 mm GRID
        </text>
        <path d="M447 111H405L380 150" fill="none" stroke="#a5ad99" />
        <circle cx="380" cy="150" r="3" />
        <text x="98" y="427">
          LESS CLUTTER. MORE POSSIBILITY.
        </text>
      </g>
    </svg>
  );
}
