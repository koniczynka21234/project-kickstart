// Proste komponenty wykresów bez Recharts - renderują się lepiej w PDF
interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export const SimplePieChart = ({ data, size = 200 }: { data: PieChartData[]; size?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const innerRadius = size * 0.2;

  // Calculate segments
  const segments: { item: PieChartData; startAngle: number; endAngle: number }[] = [];
  let accumulatedAngle = -90; // Start from top

  data.forEach((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    segments.push({
      item,
      startAngle: accumulatedAngle,
      endAngle: accumulatedAngle + angle,
    });
    accumulatedAngle += angle;
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const start = polarToCartesian(centerX, centerY, outerR, endAngle);
    const end = polarToCartesian(centerX, centerY, outerR, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerR, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerR, startAngle);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((segment, index) => {
        // Skip segments with no value
        if (segment.endAngle - segment.startAngle < 0.1) return null;
        
        return (
          <path
            key={index}
            d={createArcPath(segment.startAngle, segment.endAngle, radius, innerRadius)}
            fill={segment.item.color}
          />
        );
      })}
      {/* Center text */}
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={size * 0.12}
        fontWeight="bold"
      >
        {data[0] && total > 0 ? `${Math.round((data[0].value / total) * 100)}%` : '0%'}
      </text>
    </svg>
  );
};

interface BarChartData {
  label: string;
  value: number;
}

export const SimpleBarChart = ({
  data,
  width = 400,
  height = 200,
  color = "#ec4899"
}: {
  data: BarChartData[];
  width?: number;
  height?: number;
  color?: string;
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 15, right: 15, bottom: 25, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barGap = 8;
  const barWidth = Math.max((chartWidth - barGap * (data.length - 1)) / data.length, 10);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Y axis */}
      <line 
        x1={padding.left} 
        y1={padding.top} 
        x2={padding.left} 
        y2={height - padding.bottom} 
        stroke="#3f3f46" 
        strokeWidth="1" 
      />
      {/* X axis */}
      <line 
        x1={padding.left} 
        y1={height - padding.bottom} 
        x2={width - padding.right} 
        y2={height - padding.bottom} 
        stroke="#3f3f46" 
        strokeWidth="1" 
      />

      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding.left + index * (barWidth + barGap) + barGap / 2;
        const y = height - padding.bottom - barHeight;

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              fill={color}
              rx="3"
            />
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
            >
              {item.label}
            </text>
            {/* Value on top of bar */}
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fill="#d4d4d8"
              fontSize="8"
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

interface LineChartData {
  label: string;
  value1: number;
  value2: number;
}

export const SimpleLineChart = ({
  data,
  width = 400,
  height = 200,
  color1 = "#ec4899",
  color2 = "#3b82f6",
  label1 = "Zasięg",
  label2 = "Kliknięcia"
}: {
  data: LineChartData[];
  width?: number;
  height?: number;
  color1?: string;
  color2?: string;
  label1?: string;
  label2?: string;
}) => {
  // Use separate scales for each line (dual-axis)
  const maxValue1 = Math.max(...data.map(d => d.value1), 1);
  const maxValue2 = Math.max(...data.map(d => d.value2), 1);
  
  const padding = { top: 30, right: 15, bottom: 25, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const getY1 = (value: number) => {
    return padding.top + chartHeight - (value / maxValue1) * chartHeight;
  };

  const getY2 = (value: number) => {
    return padding.top + chartHeight - (value / maxValue2) * chartHeight;
  };

  const getX = (index: number) => {
    return padding.left + index * stepX;
  };

  // Create smooth curved paths using quadratic bezier
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpX + (curr.x - cpX) * 0.5} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  const points1 = data.map((item, index) => ({ x: getX(index), y: getY1(item.value1) }));
  const points2 = data.map((item, index) => ({ x: getX(index), y: getY2(item.value2) }));

  // Simple line paths (fallback to straight lines for reliability)
  const path1 = data
    .map((item, index) => {
      const x = getX(index);
      const y = getY1(item.value1);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  const path2 = data
    .map((item, index) => {
      const x = getX(index);
      const y = getY2(item.value2);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Create gradient fill areas
  const areaPath1 = path1 + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;
  const areaPath2 = path2 + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color1} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color1} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color2} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color2} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Legend */}
      <g transform={`translate(${padding.left}, 8)`}>
        <circle cx="0" cy="6" r="4" fill={color1} />
        <text x="8" y="10" fill="#d4d4d8" fontSize="8" fontWeight="500">{label1}</text>
        <circle cx={width / 2 - 20} cy="6" r="4" fill={color2} />
        <text x={width / 2 - 12} y="10" fill="#d4d4d8" fontSize="8" fontWeight="500">{label2}</text>
      </g>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={padding.top + chartHeight * (1 - ratio)}
          x2={width - padding.right}
          y2={padding.top + chartHeight * (1 - ratio)}
          stroke="#27272a"
          strokeWidth="1"
          strokeDasharray={ratio === 0 ? "0" : "2,2"}
        />
      ))}

      {/* Area fills */}
      <path d={areaPath1} fill="url(#gradient1)" />
      <path d={areaPath2} fill="url(#gradient2)" />

      {/* Line 1 */}
      <path
        d={path1}
        fill="none"
        stroke={color1}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Line 2 */}
      <path
        d={path2}
        fill="none"
        stroke={color2}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points and labels */}
      {data.map((item, index) => {
        const x = getX(index);
        return (
          <g key={index}>
            {/* Glow effect for points */}
            <circle cx={x} cy={getY1(item.value1)} r="5" fill={color1} opacity="0.3" />
            <circle cx={x} cy={getY1(item.value1)} r="3" fill={color1} />
            <circle cx={x} cy={getY2(item.value2)} r="5" fill={color2} opacity="0.3" />
            <circle cx={x} cy={getY2(item.value2)} r="3" fill={color2} />
            <text
              x={x}
              y={height - 8}
              textAnchor="middle"
              fill="#71717a"
              fontSize="9"
              fontWeight="500"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};