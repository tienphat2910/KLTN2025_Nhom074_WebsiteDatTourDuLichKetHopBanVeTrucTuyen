import React from "react";
import { ResponsivePie } from "@nivo/pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TicketDistributionChartProps {
  data: {
    adults: number;
    children: number;
    babies: number;
    seniors: number;
    total: number;
  };
}

export default function TicketDistributionChart({
  data
}: TicketDistributionChartProps) {
  const chartData = [
    {
      id: "adults",
      label: "Người lớn",
      value: data.adults,
      color: "hsl(217, 91%, 60%)"
    },
    {
      id: "children",
      label: "Trẻ em",
      value: data.children,
      color: "hsl(142, 76%, 36%)"
    },
    {
      id: "babies",
      label: "Em bé",
      value: data.babies,
      color: "hsl(45, 93%, 47%)"
    },
    {
      id: "seniors",
      label: "Người cao tuổi",
      value: data.seniors,
      color: "hsl(280, 85%, 55%)"
    }
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bố loại vé</CardTitle>
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
              valueFormat={(value) => value.toLocaleString("vi-VN")}
              tooltip={({ datum }) => (
                <div className="bg-white px-3 py-2 rounded shadow-lg border">
                  <div className="font-semibold">{datum.label}</div>
                  <div className="text-sm">
                    Số lượng: {datum.value.toLocaleString("vi-VN")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((datum.value / data.total) * 100).toFixed(1)}% tổng vé
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
