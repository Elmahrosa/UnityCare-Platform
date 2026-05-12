import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Heart, Pill, Activity, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: profile } = trpc.patient.getProfile.useQuery();
  const { data: appointments } = trpc.patient.getAppointments.useQuery();
  const { data: prescriptions } = trpc.patient.getPrescriptions.useQuery();
  const { data: vitalSigns } = trpc.iot.getVitalSigns.useQuery({ patientId: user?.id });

  const upcomingAppointments = appointments?.filter(
    (apt) => new Date(apt.scheduledAt) > new Date()
  ) || [];

  const activePrescriptions = prescriptions?.filter((p) => p.status === "active") || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-600 mt-1">Your health dashboard</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">Book Appointment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{activePrescriptions.length}</p>
              </div>
              <Pill className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heart Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vitalSigns?.[0]?.heartRate || "--"} bpm
                </p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">O₂ Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vitalSigns?.[0]?.oxygenLevel || "--"}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled consultations</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Consultation</p>
                        <p className="text-sm text-gray-600">
                          {new Date(apt.scheduledAt).toLocaleDateString()} at{" "}
                          {new Date(apt.scheduledAt).toLocaleTimeString()}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge
                            variant={
                              apt.appointmentType === "telemedicine"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {apt.appointmentType}
                          </Badge>
                          <Badge
                            variant={
                              apt.status === "confirmed" ? "default" : "outline"
                            }
                          >
                            {apt.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        disabled={apt.status !== "confirmed"}
                      >
                        {apt.appointmentType === "telemedicine"
                          ? "Join Call"
                          : "View Details"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming appointments</p>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Book an Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-blue-50 text-blue-600 hover:bg-blue-100">
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button className="w-full justify-start bg-green-50 text-green-600 hover:bg-green-100">
                <Pill className="w-4 h-4 mr-2" />
                View Prescriptions
              </Button>
              <Button className="w-full justify-start bg-purple-50 text-purple-600 hover:bg-purple-100">
                <Activity className="w-4 h-4 mr-2" />
                Health Metrics
              </Button>
              <Button className="w-full justify-start bg-orange-50 text-orange-600 hover:bg-orange-100">
                <AlertCircle className="w-4 h-4 mr-2" />
                Emergency
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {vitalSigns?.[0]?.isAbnormal ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Abnormal Readings Detected</p>
                  <p className="text-xs text-red-700 mt-1">
                    Please contact your doctor for guidance
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900">All Vital Signs Normal</p>
                  <p className="text-xs text-green-700 mt-1">Keep up the healthy lifestyle</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Prescriptions</CardTitle>
          <CardDescription>Medications you are currently taking</CardDescription>
        </CardHeader>
        <CardContent>
          {activePrescriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePrescriptions.slice(0, 4).map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  <p className="font-medium text-gray-900">{prescription.medicationName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {prescription.dosage} - {prescription.frequency}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Duration: {prescription.duration}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="outline">Active</Badge>
                    {prescription.expiresAt && (
                      <Badge variant="secondary">
                        Expires:{" "}
                        {new Date(prescription.expiresAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No active prescriptions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
