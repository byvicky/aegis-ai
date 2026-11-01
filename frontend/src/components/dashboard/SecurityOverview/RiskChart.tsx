import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { riskHistory } from "./mockData";

export function RiskChart() {
  return (
    <ResponsiveContainer
      width="100%"
      height={320}
    >
      <AreaChart data={riskHistory}>

        <defs>

          <linearGradient
            id="riskGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >

            <stop
              offset="5%"
              stopColor="#7C3AED"
              stopOpacity={0.35}
            />

            <stop
              offset="95%"
              stopColor="#7C3AED"
              stopOpacity={0}
            />

          </linearGradient>

        </defs>

        <CartesianGrid
          stroke="#27272A"
          vertical={false}
        />

        <XAxis
          dataKey="scan"
          stroke="#71717A"
        />

        <YAxis
          stroke="#71717A"
          domain={[0, 100]}
        />

        <Tooltip />

        <Area
          dataKey="vulnerabilities"
          fill="url(#riskGradient)"
          stroke="transparent"
        />

        <Line
          dataKey="score"
          stroke="#8B5CF6"
          strokeWidth={4}
          dot={{
            r: 5,
          }}
        />

      </AreaChart>
    </ResponsiveContainer>
  );
}