"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSimpleAuth } from "@/hooks/use-simple-auth"

export default function ManagerPage() {
  const router = useRouter()
  const { user } = useSimpleAuth()

  // Mock data for demonstration
  const complianceData = {
    overdue: 5,
    dueSoon: 12,
    upToDate: 45
  }

  const kpis = [
    { title: "Open High-Priority Incidents", value: 3, change: "+2" },
    { title: "Average Response Time", value: "24m", change: "-5m" },
    { title: "Monthly Spend", value: "$2,450", change: "+$150" },
    { title: "Asset Uptime", value: "98.5%", change: "+0.5%" }
  ]

  const recentWorkOrders = [
    {
      id: "WO-001",
      title: "Electrical issue in Room 204",
      location: "Room 204",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedTo: "John Technician",
      createdAt: "2024-01-18T09:15:00Z"
    },
    {
      id: "WO-002",
      title: "Plumbing leak in Bar Area",
      location: "Bar Area",
      priority: "CRITICAL",
      status: "LOGGED",
      assignedTo: "Unassigned",
      createdAt: "2024-01-18T10:30:00Z"
    },
    {
      id: "WO-003",
      title: "AC maintenance Room 305",
      location: "Room 305",
      priority: "MEDIUM",
      status: "COMPLETED",
      assignedTo: "Mike HVAC",
      createdAt: "2024-01-18T08:00:00Z"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500"
      case "IN_PROGRESS": return "bg-blue-500"
      case "LOGGED": return "bg-yellow-500"
      case "ON_HOLD": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-500"
      case "HIGH": return "bg-orange-500"
      case "MEDIUM": return "bg-yellow-500"
      case "LOW": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Compliance Traffic Lights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/manager/ppm-scheduler?filter=overdue")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{complianceData.overdue}</div>
            <p className="text-sm text-muted-foreground">PPM tasks overdue</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/manager/ppm-scheduler?filter=due-soon")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{complianceData.dueSoon}</div>
            <p className="text-sm text-muted-foreground">Due in next 7 days</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/manager/ppm-scheduler?filter=up-to-date")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              Up to Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{complianceData.upToDate}</div>
            <p className="text-sm text-muted-foreground">Compliant schedules</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <Badge variant={kpi.change.startsWith("+") ? "default" : "secondary"}>
                  {kpi.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Work Order Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live Work Order Feed</CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push("/manager/work-orders")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentWorkOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{order.id}</span>
                    <Badge
                      variant="secondary"
                      className={`${getPriorityColor(order.priority)} text-white text-xs`}
                    >
                      {order.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(order.status)} text-white text-xs`}
                    >
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm">{order.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {order.location} • {order.assignedTo}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}