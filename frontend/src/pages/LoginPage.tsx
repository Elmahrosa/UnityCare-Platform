import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Heart, Stethoscope } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Unity Care</h1>
          </div>
          <p className="text-gray-600">Healthcare Platform for Everyone</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to access your healthcare services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 border border-gray-200 rounded-lg text-center hover:bg-blue-50 cursor-pointer transition">
                <Stethoscope className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Patient</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center hover:bg-blue-50 cursor-pointer transition">
                <Stethoscope className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Doctor</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center hover:bg-blue-50 cursor-pointer transition">
                <Stethoscope className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Pharmacy</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center hover:bg-blue-50 cursor-pointer transition">
                <Stethoscope className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Emergency</p>
              </div>
            </div>

            {/* Login Button */}
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-10">
              <a href={getLoginUrl()}>Sign In with Elmahrosa</a>
            </Button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">24/7</p>
            <p className="text-xs text-gray-600">Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">Secure</p>
            <p className="text-xs text-gray-600">Encrypted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">Fast</p>
            <p className="text-xs text-gray-600">Reliable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
