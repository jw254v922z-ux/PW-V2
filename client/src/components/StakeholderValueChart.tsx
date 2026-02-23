import { useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SolarResults } from '@/lib/calculator';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';

interface StakeholderValueChartProps {
  results: SolarResults;
}

export function StakeholderValueChart({ results }: StakeholderValueChartProps) {
  const [showChart, setShowChart] = useState(true);

  // Calculate the proportional values
  // Project: Total Discounted NPV (absolute value for visualization)
  // Offtaker: Total Savings
  // Landowner: Total Rental Income
  // Developer: Total Developer Premium
  
  // Show 0 for negative values
  const projectValue = Math.max(0, results.summary.totalDiscountedCashFlow);
  const offtakerValue = Math.max(0, results.summary.totalSavings);
  const landownerValue = Math.max(0, results.summary.totalLandOptionIncome);
  const developerValue = Math.max(0, results.summary.totalDeveloperPremium);
  
  const totalValue = projectValue + offtakerValue + landownerValue + developerValue;
  
  const data = [
    {
      name: 'Project',
      value: projectValue,
      percentage: totalValue > 0 ? ((projectValue / totalValue) * 100).toFixed(1) : 0,
      color: '#808080',
    },
    {
      name: 'Offtaker',
      value: offtakerValue,
      percentage: totalValue > 0 ? ((offtakerValue / totalValue) * 100).toFixed(1) : 0,
      color: '#2D8659',
    },
    {
      name: 'Landowner',
      value: landownerValue,
      percentage: totalValue > 0 ? ((landownerValue / totalValue) * 100).toFixed(1) : 0,
      color: '#FFD700',
    },
    {
      name: 'Developer',
      value: developerValue,
      percentage: totalValue > 0 ? ((developerValue / totalValue) * 100).toFixed(1) : 0,
      color: '#001F3F',
    },
  ];
  
  const COLORS = ['#808080', '#2D8659', '#FFD700', '#001F3F']; // Gray (Project), Green (Offtaker), Yellow (Landowner), Navy (Developer)
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 p-3 rounded border border-gray-700">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-gray-300">{formatCurrency(data.value)}</p>
          <p className="text-gray-400 text-sm">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm mt-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white">Stakeholder Value Distribution</CardTitle>
            <CardDescription className="text-gray-400">
              Proportional value created for each party based on project NPV, offtaker savings, landowner rental income, and developer premium
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowChart(!showChart)}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {showChart ? 'Hide' : 'Show'} Chart
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showChart && (
          <div className="w-full h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage, value, fill }) => {
                    // Use dark text on light colors (yellow), light text on dark colors
                    const isDarkColor = fill === '#FFD700' ? false : true;
                    return value > 0 ? (
                      <text fill={isDarkColor ? '#ffffff' : '#000000'} fontSize={12} fontWeight="bold">
                        {name} ({percentage}%)
                      </text>
                    ) : null;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke={entry.value === 0 ? COLORS[index % COLORS.length] : '#fff'}
                      strokeWidth={entry.value === 0 ? 0 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Value breakdown table */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((item, index) => (
            <div key={item.name} className="p-3 rounded bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <p className="text-sm font-semibold text-white">{item.name}</p>
              </div>
              <p className="text-lg font-bold text-white">{formatCurrency(item.value)}</p>
              <p className="text-xs text-gray-400">{item.percentage}% of total</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
