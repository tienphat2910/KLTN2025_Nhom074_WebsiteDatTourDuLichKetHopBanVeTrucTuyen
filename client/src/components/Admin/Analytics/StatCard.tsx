import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  iconBg,
  iconColor
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive && (
                  <>
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      +{change.toFixed(1)}%
                    </span>
                  </>
                )}
                {isNegative && (
                  <>
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">
                      {change.toFixed(1)}%
                    </span>
                  </>
                )}
                {!isPositive && !isNegative && (
                  <span className="text-sm text-gray-500 font-medium">
                    {change.toFixed(1)}%
                  </span>
                )}
                <span className="text-sm text-gray-500 ml-1">
                  vs tháng trước
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
