import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Shield, 
  Users, 
  Globe, 
  Lock, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Mail,
  User
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-400" />,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption and multi-factor authentication."
    },
    {
      icon: <Users className="h-8 w-8 text-green-400" />,
      title: "Multi-Tenant Architecture",
      description: "Seamlessly manage multiple organizations with complete data isolation."
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-400" />,
      title: "Global Scalability",
      description: "Scale your business globally with our cloud-native infrastructure."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-400" />,
      title: "Real-time Analytics",
      description: "Get insights with powerful dashboards and real-time data visualization."
    },
    {
      icon: <Lock className="h-8 w-8 text-red-400" />,
      title: "Data Protection",
      description: "GDPR compliant with advanced data protection and privacy controls."
    },
    {
      icon: <Building className="h-8 w-8 text-indigo-400" />,
      title: "Custom Branding",
      description: "White-label solution with your branding and custom domain support."
    }
  ];

  const handleGetStarted = () => {
    document.getElementById('auth-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleLearnMore = () => {
    document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* VaultSphere Branding */}
          <div className="mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
              <Building className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Vault<span className="text-blue-400">Sphere</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              The ultimate multi-tenant SaaS platform for modern businesses. Secure, scalable, and customizable.
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Shield className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure by Design</h3>
              <p className="text-gray-400 text-sm">Enterprise-grade security for your most sensitive data</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Tenant Ready</h3>
              <p className="text-gray-400 text-sm">Manage multiple organizations with complete isolation</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <Globe className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Global Scale</h3>
              <p className="text-gray-400 text-sm">Built for worldwide deployment and growth</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleLearnMore}
              className="w-full sm:w-auto bg-transparent text-white border border-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to build, scale, and manage your SaaS applications with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Features List */}
          <div className="mt-16 bg-gray-800/30 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Why Choose VaultSphere?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">99.9% Uptime Guarantee</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">24/7 Expert Support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Easy API Integration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Advanced Role Management</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Automated Backups</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">SOC 2 Compliance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Custom Integrations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-gray-300">Real-time Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of businesses already using VaultSphere
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Login Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
              <div className="text-center mb-6">
                <User className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Sign In</h3>
                <p className="text-gray-400">Access your existing account</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Demo Accounts:</strong>
                  </p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>• <strong>eathealthy@gmail.com</strong> → Food Company</p>
                    <p>• <strong>techsolutions@gmail.com</strong> → IT Solutions</p>
                    <p>• <strong>admin@example.com</strong> → System Admin</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            {/* Signup Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700">
              <div className="text-center mb-6">
                <Mail className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
                <p className="text-gray-400">Join VaultSphere today</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Demo Accounts:</strong>
                  </p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>• <strong>eathealthy@gmail.com</strong> → Food Company</p>
                    <p>• <strong>techsolutions@gmail.com</strong> → IT Solutions</p>
                    <p>• <strong>admin@example.com</strong> → System Admin</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Sign Up</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-700">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-6 w-6 text-white" />
            </div>
            <h4 className="text-xl font-bold text-white">VaultSphere</h4>
          </div>
          <p className="text-gray-400 mb-4">
            © 2024 VaultSphere. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            Built with ❤️ for modern businesses
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
