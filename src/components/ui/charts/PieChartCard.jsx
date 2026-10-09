import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartCard from './ChartCard';
import { chartPalette } from '../../../theme/tokens';

/**
 * <PieChartCard title="By Status" data={data} nameKey="status" valueKey="count" />
 */
const PieChartCard = ({
  title,
  subtitle,
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  height = 300,
  donut = true,
  action,
}) => (
  <ChartCard title={title} subtitle={subtitle} height={height} action={action}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={donut ? 60 : 0}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </ChartCard>
);

export default PieChartCard;
