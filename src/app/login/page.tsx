"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import {
  Loader2,
  Shield,
  Building2,
  Users,
  ArrowLeft,
  CheckCircle,
  IndianRupee,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

type UserRole = "voter" | "ward_admin" | "super_admin";

const roleConfig = {
  voter: {
    title: "Voter Login",
    description: "Access your ward's projects and submit grievances",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    redirect: "/voter",
  },
  ward_admin: {
    title: "Ward Admin Login",
    description: "Manage your ward's funds, projects and grievances",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    redirect: "/ward",
  },
  super_admin: {
    title: "Super Admin Login",
    description: "System-wide administration and analytics",
    icon: Shield,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    redirect: "/admin",
  },
};

const features = [
  {
    icon: IndianRupee,
    title: "Fund Transparency",
    description: "Track every rupee allocated to your ward",
  },
  {
    icon: ClipboardList,
    title: "Project Tracking",
    description: "Monitor development projects in real-time",
  },
  {
    icon: MessageSquare,
    title: "Public Grievances",
    description: "Submit and vote on community issues",
  },
  {
    icon: CheckCircle,
    title: "Accountability",
    description: "Hold local representatives accountable",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, error, clearError } = useAuthStore();

  const [activeRole, setActiveRole] = useState<UserRole>("voter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      const user = useAuthStore.getState().user;

      // Verify the user role matches the selected login type
      if (user?.role !== activeRole) {
        toast({
          title: "Access Denied",
          description: `This account is not registered as a ${activeRole.replace("_", " ")}`,
          variant: "destructive",
        });
        useAuthStore.getState().logout();
        return;
      }

      toast({
        title: "Welcome!",
        description: "Login successful",
      });

      router.push(roleConfig[activeRole].redirect);
    } else {
      toast({
        title: "Login Failed",
        description: error || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const config = roleConfig[activeRole];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Info Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-12 flex-col">
        {/* Back Button */}
        <div>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20 -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo and Title */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white rounded-xl p-3">
              <Image src="/logo.png" alt="NagarNiti" width={60} height={60} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">NagarNiti</h1>
              <p className="text-blue-100">Ward Transparency System</p>
            </div>
          </div>

          <p className="text-xl text-blue-100 mb-12 max-w-md">
            Empowering citizens with transparency in local governance. Track funds, monitor projects, and make your voice heard.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-blue-100">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-blue-200">
          <p>Bringing transparency to every ward, one project at a time.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-6">
            <Link href="/">
              <Button variant="ghost" className="-ml-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="NagarNiti" width={48} height={48} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NagarNiti</h1>
              <p className="text-sm text-gray-500">Ward Transparency System</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Select your role and login to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as UserRole)}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="voter" className="text-xs sm:text-sm">
                    <Users className="h-4 w-4 mr-1 hidden sm:inline" />
                    Voter
                  </TabsTrigger>
                  <TabsTrigger value="ward_admin" className="text-xs sm:text-sm">
                    <Building2 className="h-4 w-4 mr-1 hidden sm:inline" />
                    Ward Admin
                  </TabsTrigger>
                  <TabsTrigger value="super_admin" className="text-xs sm:text-sm">
                    <Shield className="h-4 w-4 mr-1 hidden sm:inline" />
                    Super Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeRole} className="mt-0">
                  {/* Role Info */}
                  <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-6`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-white ${config.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        minLength={6}
                        maxLength={72}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        `Login as ${activeRole === "super_admin" ? "Super Admin" : activeRole === "ward_admin" ? "Ward Admin" : "Voter"}`
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {activeRole === "voter" && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>Don&apos;t have an account?</p>
                  <p className="mt-1">
                    Get the registration link from your ward corporator
                  </p>
                </div>
              )}

              {/* Demo credentials for testing */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials:</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Super Admin:</strong> admin@nagarniti.gov.in / Admin@123</p>
                  <p><strong>Ward Admin:</strong> suresh.patil@bmc.gov.in / Admin@123</p>
                  <p><strong>Voter:</strong> voter1@example.com / Voter@123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
