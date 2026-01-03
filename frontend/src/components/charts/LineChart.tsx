import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: DataPoint[];
  lines: { key: string; color: string; name: string }[];
  height?: number;
}

const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export function LineChart({ data, lines, height = 300 }: LineChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    formattedTime: format(parseISO(d.timestamp), 'MMM d, HH:mm'),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
        <XAxis
          dataKey="formattedTime"
          tick={{ fontSize: 12, fill: '#737373' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E5E5' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#737373' }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          iconType="circle"
          iconSize={8}
        />
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color || colors[index % colors.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
