"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import {
  Loader2,
  MapPin,
  User,
  CheckCircle,
  ArrowLeft,
  Building2,
  IndianRupee,
  ClipboardList,
  MessageSquare,
  Eye,
} from "lucide-react";

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
    icon: Eye,
    title: "Full Visibility",
    description: "See what's happening in your neighborhood",
  },
];

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const wardSlug = params.wardSlug as string;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    voterId: "",
    password: "",
    confirmPassword: "",
    societyId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch societies for this ward
  const { data: societiesData } = useQuery({
    queryKey: ["ward-societies", wardSlug],
    queryFn: async () => {
      const res = await authApi.getWardSocieties(wardSlug);
      if (!res.success) {
        return [];
      }
      return (res as any).societies || [];
    },
    enabled: !!wardSlug,
  });

  // Fetch ward info
  const { data: wardData, isLoading: wardLoading, error: wardError } = useQuery({
    queryKey: ["ward", wardSlug],
    queryFn: async () => {
      const res = await authApi.getWardBySlug(wardSlug);
      if (!res.success) {
        throw new Error(res.error || "Ward not found");
      }
      return (res as any).ward;
    },
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => authApi.register(data),
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "Registration Successful!",
          description: "You can now login with your email and password.",
        });
        router.push("/login");
      } else {
        toast({
          title: "Registration Failed",
          description: res.error || "Something went wrong",
          variant: "destructive",
        });
      }
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length > 72) {
      toast({
        title: "Error",
        description: "Password must not exceed 72 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile || undefined,
      voterId: formData.voterId || undefined,
      wardSlug: wardSlug,
      password: formData.password,
      societyId: formData.societyId ? parseInt(formData.societyId) : undefined,
    });
  };

  // Loading state
  if (wardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading ward information...</p>
        </div>
      </div>
    );
  }

  // Error state - ward not found
  if (wardError || !wardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Registration Link</h2>
            <p className="text-muted-foreground mb-4">
              This ward registration link is invalid or has expired. Please contact your ward corporator for a valid link.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ward inactive
  if (!wardData.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Registration Closed</h2>
            <p className="text-muted-foreground mb-4">
              Registration for {wardData.name} (Ward {wardData.number}) is currently closed. Please contact your ward corporator for more information.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Info Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-12 flex-col">
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

          {/* Ward Info */}
          <div className="bg-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{wardData.name}</h2>
                <p className="text-blue-100">Ward {wardData.number}</p>
              </div>
            </div>
            {wardData.area && (
              <p className="text-blue-100 text-sm mb-2">{wardData.area}</p>
            )}
            {wardData.corporatorName && (
              <p className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Corporator: {wardData.corporatorName}
              </p>
            )}
          </div>

          <p className="text-xl text-blue-100 mb-8 max-w-md">
            Join your ward community and stay informed about local development, funds, and projects.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
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
          <p>Building transparency, one ward at a time.</p>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-xl">
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-6">
            <Link href="/">
              <Button variant="ghost" className="-ml-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {/* Mobile Logo and Ward Info */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="NagarNiti" width={48} height={48} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NagarNiti</h1>
                <p className="text-sm text-gray-500">Ward Transparency System</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">{wardData.name}</h3>
                  <p className="text-sm text-blue-600">Ward {wardData.number}</p>
                </div>
                <Badge className="ml-auto bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
                <p className="text-muted-foreground">Join {wardData.name} on NagarNiti</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voterId">Voter ID</Label>
                    <Input
                      id="voterId"
                      value={formData.voterId}
                      onChange={(e) => setFormData({ ...formData, voterId: e.target.value })}
                      placeholder="MH/01/234/567890"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {societiesData && societiesData.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="society">Residential Society</Label>
                    <Select
                      value={formData.societyId}
                      onValueChange={(value) => setFormData({ ...formData, societyId: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your society (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {societiesData.map((society: any) => (
                          <SelectItem key={society.id} value={society.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{society.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      maxLength={72}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Already have an account?</p>
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
