import "../styles/graph.css";

function LineGraph({ data, width = 320, height = 160, gradientId = "graphGradient", gridLines = 4 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const stepX = width / (data.length - 1);

  const points = data
    .map((value, index) => {
      const ratio = max === min ? 0.5 : (value - min) / (max - min);
      const x = index * stepX;
      const y = height - ratio * height;
      return `${x},${y}`;
    })
    .join(" ");

  const grid = Array.from({ length: gridLines + 1 }, (_, index) => {
    const y = (height / gridLines) * index;
    return (
      <line
        key={`grid-${index}`}
        x1="0"
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeDasharray="4 4"
      />
    );
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="line-graph"
      role="img"
      aria-label="Trend visualization"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d6ff" />
          <stop offset="100%" stopColor="#03a64f" />
        </linearGradient>
      </defs>
      <g className="line-graph-grid">{grid}</g>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="rgba(3, 166, 79, 0.15)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default LineGraph;