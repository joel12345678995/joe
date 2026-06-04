"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, Users, Wallet, Landmark, Eye, 
  Bell, Upload,
  TrendingUp, Clock, ArrowRight,
  Star, Sparkles, Rocket, Heart, Crown
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { value: "24+", label: "Core Features", icon: Star },
    { value: "6", label: "User Roles", icon: Crown },
    { value: "100%", label: "Data Privacy", icon: Shield },
    { value: "24/7", label: "Availability", icon: Clock },
  ];

  const features = [
    {
      icon: Users,
      title: "Member Management",
      description: "Add, edit, and manage members with role-based access (Admin, Treasurer, Secretary, Auditor, Member).",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Wallet,
      title: "Savings Contributions",
      description: "Track daily, weekly, or monthly contributions with automatic calculations and payment verification.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Landmark,
      title: "Loan Management",
      description: "Request, approve, and track loans with interest rates, repayment schedules, and guarantor management.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Eye,
      title: "Transparency Dashboard",
      description: "Real-time visibility into contributions, member balances, and group financial health.",
      color: "text-teal-600",
      bgColor: "bg-teal-50"
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Instant alerts for payment verification, loan approvals, meeting reminders, and due dates.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: Upload,
      title: "Migration Ready",
      description: "Bulk import existing members via CSV/Excel with guided step-by-step migration process.",
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-50"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Mwangi",
      role: "Group Administrator",
      content: "JoeFamily Treasury has transformed how our Chama operates. No more paperwork, everything is transparent and efficient!",
      rating: 5,
      location: "Nairobi, Kenya"
    },
    {
      name: "John Omondi",
      role: "Treasurer",
      content: "The loan management feature is amazing. We can now track all loans and repayments without any errors.",
      rating: 5,
      location: "Kampala, Uganda"
    },
    {
      name: "Grace Nkosi",
      role: "Member",
      content: "I love seeing my contributions and savings in real-time. The transparency dashboard gives me peace of mind.",
      rating: 5,
      location: "Dar es Salaam, Tanzania"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your data is protected with enterprise-level security and encryption."
    },
    {
      icon: TrendingUp,
      title: "Grow Your Savings",
      description: "Track savings goals, monitor progress, and celebrate achievements."
    },
    {
      icon: Sparkles,
      title: "Easy to Use",
      description: "Intuitive interface designed for all technical levels."
    },
    {
      icon: Rocket,
      title: "Fast Performance",
      description: "Lightning-fast loading times with modern technology stack."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JT</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              JoeFamily Treasury
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-gray-600 hover:text-green-600 transition">Features</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition">Pricing</Link>
            <Link href="/about" className="text-gray-600 hover:text-green-600 transition">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-green-600 transition">Contact</Link>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-green-200 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-emerald-200 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Trusted by 500+ Savings Groups</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              Manage Your Savings Group
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                With Confidence
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              A production-ready treasury platform for families, SACCOs, church groups, 
              and community circles. Track contributions, manage loans, and ensure transparency.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-6 rounded-xl">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2">
                  Explore Features
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-gray-200">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                      <Icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose JoeFamily Treasury?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your savings group professionally and transparently
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-1.5 mb-4">
              <Heart className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built specifically for African savings groups with features that matter
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-xl transition-all duration-300 border hover:border-green-200">
                  <CardHeader>
                    <div className={`${feature.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link href="/features">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                View All Features <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow-100 rounded-full px-4 py-1.5 mb-4">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Trusted by Groups</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join hundreds of savings groups already using JoeFamily Treasury
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">“{testimonial.content}”</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-xs text-gray-400 mt-1">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-6">
            <Rocket className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Get Started Today</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Savings Group?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            Join thousands of groups already using JoeFamily Treasury to manage their savings efficiently.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-green-200 text-sm mt-6">
            No credit card required • Free forever for up to 10 members
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">JT</span>
                </div>
                <span className="font-bold text-white">JoeFamily Treasury</span>
              </div>
              <p className="text-sm">Empowering savings groups across Africa with modern financial tools.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} JoeFamily Treasury. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}