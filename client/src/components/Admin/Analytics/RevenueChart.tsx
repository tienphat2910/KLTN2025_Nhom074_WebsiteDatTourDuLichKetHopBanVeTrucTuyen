import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = [
    {
      id: "Doanh thu",
      color: "hsl(217, 91%, 60%)",
      data: data.map((item) => ({
        x: item.month,
        y: item.revenue
      }))
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo tháng</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "400px" }}>
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
              reverse: false
            }}
            yFormat=" >-,.0f"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: "Tháng",
              legendOffset: 50,
              legendPosition: "middle"
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Doanh thu (VNĐ)",
              legendOffset: -70,
              legendPosition: "middle",
              format: (value) => new Intl.NumberFormat("vi-VN").format(value)
            }}
            pointSize={8}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            pointLabelYOffset={-12}
            enableArea={true}
            areaOpacity={0.1}
            useMesh={true}
            legends={[
              {
                anchor: "top-left",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: -20,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "rgba(0, 0, 0, .03)",
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            tooltip={({ point }) => (
              <div className="bg-white px-3 py-2 rounded shadow-lg border">
                <div className="font-semibold">{point.data.x}</div>
                <div className="text-sm">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND"
                  }).format(point.data.y as number)}
                </div>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
