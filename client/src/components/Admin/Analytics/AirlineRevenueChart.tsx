import React from "react";
import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AirlineRevenueChartProps {
  data: Array<{
    name: string;
    code: string;
    revenue: number;
    bookings: number;
  }>;
}

export default function AirlineRevenueChart({
  data
}: AirlineRevenueChartProps) {
  const chartData = data
    .map((airline, index) => ({
      id: airline.code,
      label: airline.name,
      value: airline.revenue,
      bookings: airline.bookings,
      color: `hsl(${index * 60}, 70%, 50%)`
    }))
    .filter((item) => item.value > 0);

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo hãng hàng không</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "400px" }}>
          {chartData.length > 0 ? (
            <ResponsivePie
              data={chartData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.2]]
              }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{
                from: "color",
                modifiers: [["darker", 2]]
              }}
              valueFormat={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  notation: "compact",
                  maximumFractionDigits: 1
                }).format(value)
              }
              tooltip={({ datum }) => (
                <div className="bg-white px-3 py-2 rounded shadow-lg border">
                  <div className="font-semibold">{datum.label}</div>
                  <div className="text-sm">
                    Doanh thu:{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND"
                    }).format(datum.value)}
                  </div>
                  <div className="text-sm">Bookings: {datum.data.bookings}</div>
                  <div className="text-xs text-gray-500">
                    {((datum.value / totalRevenue) * 100).toFixed(1)}% tổng
                    doanh thu
                  </div>
                </div>
              )}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: "#999",
                  itemDirection: "left-to-right",
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: "circle",
                  effects: [
                    {
                      on: "hover",
                      style: {
                        itemTextColor: "#000"
                      }
                    }
                  ]
                }
              ]}
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
