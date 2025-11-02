import React from "react";
import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopDestinationsChartProps {
  data: Array<{
    name: string;
    city: string;
    code: string;
    bookings: number;
  }>;
}

export default function TopDestinationsChart({
  data
}: TopDestinationsChartProps) {
  const chartData = data.slice(0, 10).map((item) => ({
    destination: `${item.city} (${item.code})`,
    bookings: item.bookings,
    color: "hsl(217, 91%, 60%)"
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 điểm đến phổ biến</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "400px" }}>
          {chartData.length > 0 ? (
            <ResponsiveBar
              data={chartData}
              keys={["bookings"]}
              indexBy="destination"
              margin={{ top: 20, right: 30, bottom: 100, left: 60 }}
              padding={0.3}
              layout="vertical"
              valueScale={{ type: "linear" }}
              indexScale={{ type: "band", round: true }}
              colors={({ data }) => data.color}
              borderColor={{
                from: "color",
                modifiers: [["darker", 1.6]]
              }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: "Điểm đến",
                legendPosition: "middle",
                legendOffset: 80
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Số booking",
                legendPosition: "middle",
                legendOffset: -50
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{
                from: "color",
                modifiers: [["darker", 1.6]]
              }}
              tooltip={({ indexValue, value }) => (
                <div className="bg-white px-3 py-2 rounded shadow-lg border">
                  <div className="font-semibold">{indexValue}</div>
                  <div className="text-sm">{value} booking(s)</div>
                </div>
              )}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
