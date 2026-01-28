import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  IndianRupee,
  ClipboardList,
  Bell,
  Shield,
  ArrowRight,
  Eye,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="NagarNiti" width={90} height={90} />
            <span className="text-2xl font-bold text-primary">NagarNiti</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Ward Transparency System
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Connecting voters with their corporators through complete
            transparency
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Track funds, monitor development projects, submit grievances, and
            stay informed about every rupee spent in your ward.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Login to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Complete Transparency for Every Citizen
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <IndianRupee className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Fund Tracking</CardTitle>
              <CardDescription>
                See exactly how much money your ward receives from BMC, State,
                and Central Government
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <ClipboardList className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Project Monitoring</CardTitle>
              <CardDescription>
                Track every development project - roads, drainage, lights,
                gardens with photos and progress
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Public Grievances</CardTitle>
              <CardDescription>
                Submit issues, upvote community concerns, and track resolution
                status in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bell className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Instant Notifications</CardTitle>
              <CardDescription>
                Get updates on funds received, project milestones, and important
                announcements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Eye className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Full Visibility</CardTitle>
              <CardDescription>
                Every update is recorded with timestamp. No data can be changed
                secretly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Verified Access</CardTitle>
              <CardDescription>
                Only verified voters can access ward-specific information.
                Secure and trusted.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Register with Ward Link</h3>
              <p className="text-gray-600 text-sm">
                Get the registration link for your ward and sign up with your
                mobile number
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Verify Your Identity</h3>
              <p className="text-gray-600 text-sm">
                Confirm your mobile via OTP to get access to your ward dashboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Track Everything</h3>
              <p className="text-gray-600 text-sm">
                View funds, projects, submit grievances and stay informed 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          For Everyone in the System
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Super Admin</CardTitle>
              <CardDescription>Commissioner / Chief Level</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>View all wards analytics</li>
                <li>Compare ward performance</li>
                <li>Manage ward administrators</li>
                <li>System-wide oversight</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="text-green-600">Ward Admin</CardTitle>
              <CardDescription>Corporator / Office Staff</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Add funds and projects</li>
                <li>Update project progress</li>
                <li>Respond to grievances</li>
                <li>Send notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-blue-600">Voter</CardTitle>
              <CardDescription>Citizens of the Ward</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>View ward funds & projects</li>
                <li>Track development work</li>
                <li>Submit grievances</li>
                <li>Upvote community issues</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/logo.png" alt="NagarNiti" width={40} height={40} />
              <span className="text-2xl font-bold">NagarNiti</span>
            </div>
            <p className="text-gray-400 text-sm">
              Ward Transparency System - Building Trust Through Transparency
            </p>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            No confusion, no hiding, full transparency
          </div>
        </div>
      </footer>
    </div>
  );
}
