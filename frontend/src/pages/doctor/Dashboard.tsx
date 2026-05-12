import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = trpc.doctor.getProfile.useQuery();
  const { data: queue } = trpc.doctor.getPatientQueue.useQuery();

  const todayAppointments = queue?.filter(
    (apt) =>
      new Date(apt.scheduledAt).toDateString() === new Date().toDateString()
  ) || [];

  const completedToday = todayAppointments.filter(
    (apt) => apt.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dr. {user?.name}</h1>
          <p className="text-gray-600 mt-1">
            {profile?.specialization || "Specialist"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Rating</p>
          <p className="text-2xl font-bold text-yellow-500">
            ★ {profile?.rating || "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Patients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayAppointments.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedToday}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    todayAppointments.filter(
                      (apt) => apt.status === "in_progress"
                    ).length
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Consultations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.totalConsultations || 0}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient Queue</CardTitle>
              <CardDescription>Today's appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Patient ID: {apt.patientId}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(apt.scheduledAt).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {apt.reason || "General consultation"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            apt.status === "completed"
                              ? "default"
                              : apt.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {apt.status}
                        </Badge>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={apt.status === "completed"}
                        >
                          {apt.status === "in_progress"
                            ? "Continue"
                            : "Start"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No appointments today
                </p>
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
                View Schedule
              </Button>
              <Button className="w-full justify-start bg-green-50 text-green-600 hover:bg-green-100">
                Create Prescription
              </Button>
              <Button className="w-full justify-start bg-purple-50 text-purple-600 hover:bg-purple-100">
                Medical Records
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">License</p>
                <p className="font-medium text-gray-900">
                  {profile?.licenseNumber || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Experience</p>
                <p className="font-medium text-gray-900">
                  {profile?.yearsOfExperience || 0} years
                </p>
              </div>
              <div>
                <p className="text-gray-600">Consultation Fee</p>
                <p className="font-medium text-gray-900">
                  ${profile?.consultationFee || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
