"use client"

import { 
  Users, 
  Package, 
  Plane, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: any
  trend?: {
    value: string
    isPositive: boolean
  }
}

function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && (
            <div className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, Admin!</h2>
        <p className="text-muted-foreground">
          Here's what's happening with LuTrip today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value="12,543"
          description="Active registered users"
          icon={Users}
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <StatsCard
          title="Total Tours"
          value="1,234"
          description="Available tour packages"
          icon={Package}
          trend={{ value: "+8.2%", isPositive: true }}
        />
        <StatsCard
          title="Flight Bookings"
          value="856"
          description="This month"
          icon={Plane}
          trend={{ value: "+23.1%", isPositive: true }}
        />
        <StatsCard
          title="Revenue"
          value="$54,231"
          description="This month"
          icon={DollarSign}
          trend={{ value: "-2.4%", isPositive: false }}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "TUR001",
                  customer: "Nguyen Van A",
                  service: "Ha Long Bay Tour",
                  amount: "$299",
                  status: "confirmed",
                  time: "2 hours ago"
                },
                {
                  id: "FLT002", 
                  customer: "Tran Thi B",
                  service: "SGN → HAN Flight",
                  amount: "$150",
                  status: "pending",
                  time: "4 hours ago"
                },
                {
                  id: "TUR003",
                  customer: "Le Van C",
                  service: "Sapa Trekking Tour",
                  amount: "$189",
                  status: "confirmed",
                  time: "6 hours ago"
                },
                {
                  id: "ACT004",
                  customer: "Pham Thi D",
                  service: "Cooking Class HCMC",
                  amount: "$45",
                  status: "completed",
                  time: "8 hours ago"
                }
              ].map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.customer}</p>
                    <p className="text-xs text-muted-foreground">{booking.service}</p>
                    <p className="text-xs text-muted-foreground">{booking.time}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{booking.amount}</p>
                    <Badge 
                      variant={
                        booking.status === "confirmed" ? "default" :
                        booking.status === "pending" ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Button variant="outline" className="w-full">
              View all bookings
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Add New Tour
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Plane className="mr-2 h-4 w-4" />
                Manage Flights
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Add Destination
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                Create Activity
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                User Management
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Destinations</CardTitle>
            <CardDescription>Most booked this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Ha Long Bay", bookings: 234, trend: "+15%" },
                { name: "Ho Chi Minh City", bookings: 189, trend: "+8%" },
                { name: "Hoi An", bookings: 156, trend: "+23%" },
                { name: "Sapa", bookings: 134, trend: "+5%" },
                { name: "Da Nang", bookings: 98, trend: "+12%" }
              ].map((destination, index) => (
                <div key={destination.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{destination.name}</p>
                      <p className="text-xs text-muted-foreground">{destination.bookings} bookings</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {destination.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>System activity log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "New user registration",
                  user: "john.doe@email.com",
                  time: "5 mins ago",
                  type: "user"
                },
                {
                  action: "Tour booking confirmed",
                  user: "admin",
                  time: "12 mins ago", 
                  type: "booking"
                },
                {
                  action: "Flight added to system",
                  user: "admin",
                  time: "1 hour ago",
                  type: "system"
                },
                {
                  action: "Payment processed",
                  user: "mary.jane@email.com",
                  time: "2 hours ago",
                  type: "payment"
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.type === "user" ? "bg-blue-500" :
                    activity.type === "booking" ? "bg-green-500" :
                    activity.type === "payment" ? "bg-yellow-500" : "bg-gray-500"
                  }`}></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}