import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartCard from './ChartCard';
import { chartPalette, colors } from '../../../theme/tokens';

/**
 * <BarChartCard title="Invoices" data={data} xKey="month"
 *   bars={[{ key: 'paid', name: 'Paid' }, { key: 'due', name: 'Due' }]} />
 */
const BarChartCard = ({ title, subtitle, data = [], xKey, bars = [], height = 300, action }) => (
  <ChartCard title={title} subtitle={subtitle} height={height} action={action}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: colors.inkSoft, fontSize: 12 }} />
        <YAxis tick={{ fill: colors.inkSoft, fontSize: 12 }} />
        <Tooltip />
        {bars.length > 1 && <Legend />}
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name || b.key}
            fill={b.color || chartPalette[i % chartPalette.length]}
            radius={[6, 6, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);

export default BarChartCard;
