import React from "react";
import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueByTypeProps {
  data: {
    flights: number;
    tours: number;
    activities: number;
  };
}

export default function RevenueByTypeChart({ data }: RevenueByTypeProps) {
  const chartData = [
    {
      id: "Chuyến bay",
      label: "Chuyến bay",
      value: data.flights,
      color: "hsl(217, 91%, 60%)"
    },
    {
      id: "Tour du lịch",
      label: "Tour du lịch",
      value: data.tours,
      color: "hsl(142, 76%, 36%)"
    },
    {
      id: "Hoạt động",
      label: "Hoạt động",
      value: data.activities,
      color: "hsl(45, 93%, 47%)"
    }
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo loại dịch vụ</CardTitle>
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
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND"
                    }).format(datum.value)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(
                      (datum.value /
                        (data.flights + data.tours + data.activities)) *
                      100
                    ).toFixed(1)}
                    %
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
                  itemsSpacing: 20,
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
