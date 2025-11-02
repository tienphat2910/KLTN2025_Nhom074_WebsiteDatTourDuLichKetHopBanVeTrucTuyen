import React from "react";
import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingStatusChartProps {
  data: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export default function BookingStatusChart({ data }: BookingStatusChartProps) {
  const chartData = [
    {
      status: "Chờ xác nhận",
      value: data.pending,
      color: "hsl(45, 93%, 47%)"
    },
    {
      status: "Đã xác nhận",
      value: data.confirmed,
      color: "hsl(217, 91%, 60%)"
    },
    {
      status: "Hoàn thành",
      value: data.completed,
      color: "hsl(142, 76%, 36%)"
    },
    {
      status: "Đã hủy",
      value: data.cancelled,
      color: "hsl(0, 84%, 60%)"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái đặt chỗ</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "400px" }}>
          <ResponsiveBar
            data={chartData}
            keys={["value"]}
            indexBy="status"
            margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            padding={0.3}
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
              tickRotation: -15,
              legend: "Trạng thái",
              legendPosition: "middle",
              legendOffset: 50
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Số lượng",
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
                <div className="text-sm">{value} đặt chỗ</div>
              </div>
            )}
            role="application"
            ariaLabel="Booking status chart"
            barAriaLabel={(e) => `${e.indexValue}: ${e.value} bookings`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
