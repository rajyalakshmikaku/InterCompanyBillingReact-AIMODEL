import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartCard from './ChartCard';
import { chartPalette, colors } from '../../../theme/tokens';

/**
 * <LineChartCard title="Revenue" data={data} xKey="month"
 *   lines={[{ key: 'revenue', name: 'Revenue' }]} />
 */
const LineChartCard = ({ title, subtitle, data = [], xKey, lines = [], height = 300, action }) => (
  <ChartCard title={title} subtitle={subtitle} height={height} action={action}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: colors.inkSoft, fontSize: 12 }} />
        <YAxis tick={{ fill: colors.inkSoft, fontSize: 12 }} />
        <Tooltip />
        {lines.length > 1 && <Legend />}
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name || l.key}
            stroke={l.color || chartPalette[i % chartPalette.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

export default LineChartCard;
