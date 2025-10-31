"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane,
  Calendar,
  Users,
  Building2,
  TowerControl,
  Armchair,
  TicketsPlane
} from "lucide-react";
import FlightManagement from "@/components/Admin/FlightManagement";
import AirlineManagement from "@/components/Admin/AirlineManagement";
import AirportManagement from "@/components/Admin/AirportManagement";
import FlightScheduleManagement from "@/components/Admin/FlightScheduleManagement";
import FlightClassManagement from "@/components/Admin/FlightClassManagement";

export default function AdminFlightsPage() {
  const [activeTab, setActiveTab] = useState("flights");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Quản lý Chuyến bay</h1>
          </div>
          <p className="text-sky-100">
            Quản lý chuyến bay, hãng hàng không, sân bay và lịch trình
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent">
            <TabsTrigger
              value="flights"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white py-3 px-4 rounded-lg border border-gray-200 hover:border-sky-400 transition-all"
            >
              <Plane className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Chuyến bay</span>
              <span className="sm:hidden">Flights</span>
            </TabsTrigger>
            <TabsTrigger
              value="schedules"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white py-3 px-4 rounded-lg border border-gray-200 hover:border-sky-400 transition-all"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Lịch bay</span>
              <span className="sm:hidden">Schedules</span>
            </TabsTrigger>
            <TabsTrigger
              value="classes"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white py-3 px-4 rounded-lg border border-gray-200 hover:border-sky-400 transition-all"
            >
              <Armchair className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Hạng ghế</span>
              <span className="sm:hidden">Classes</span>
            </TabsTrigger>
            <TabsTrigger
              value="airlines"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white py-3 px-4 rounded-lg border border-gray-200 hover:border-sky-400 transition-all"
            >
              <TicketsPlane className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Hãng bay</span>
              <span className="sm:hidden">Airlines</span>
            </TabsTrigger>
            <TabsTrigger
              value="airports"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white py-3 px-4 rounded-lg border border-gray-200 hover:border-sky-400 transition-all"
            >
              <TowerControl className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sân bay</span>
              <span className="sm:hidden">Airports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="mt-6">
            <FlightManagement />
          </TabsContent>

          <TabsContent value="schedules" className="mt-6">
            <FlightScheduleManagement />
          </TabsContent>

          <TabsContent value="classes" className="mt-6">
            <FlightClassManagement />
          </TabsContent>

          <TabsContent value="airlines" className="mt-6">
            <AirlineManagement />
          </TabsContent>

          <TabsContent value="airports" className="mt-6">
            <AirportManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
