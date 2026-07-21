import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ArrowRight,
  Eye,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  gradient,
}: MetricCardProps) {
  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${gradient}`}>
            <Icon className="text-white w-6 h-6" />
          </div>
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp 
              className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
            />
            {change} this month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessDashboard() {
  const navigate = useNavigate();

  const recentActivity = [
    {
      id: 1,
      type: 'order',
      message: 'New order from Adaeze Okonkwo',
      amount: '₦899,000',
      time: '2 minutes ago',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      type: 'review',
      message: 'New 5-star review on Samsung Galaxy S24',
      rating: '5 ★',
      time: '1 hour ago',
      icon: Eye,
      color: 'bg-green-500',
    },
    {
      id: 3,
      type: 'stock',
      message: 'Low stock alert: MacBook Pro 14"',
      count: '8 units',
      time: '3 hours ago',
      icon: AlertCircle,
      color: 'bg-orange-500',
    },
    {
      id: 4,
      type: 'order_completed',
      message: 'Order ORD-202605-0101 completed',
      status: 'Delivered',
      time: '5 hours ago',
      icon: CheckCircle2,
      color: 'bg-purple-500',
    },
  ];

  const quickActions = [
    {
      label: 'View Orders',
      path: '/business/orders',
      description: '6 pending orders',
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Manage Inventory',
      path: '/business/inventory',
      description: '45 products',
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'View Analytics',
      path: '/business/analytics',
      description: 'Sales & Traffic',
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Check Reviews',
      path: '/business/reviews',
      description: '28 reviews',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 lg:ml-64">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome back! Here's your store performance.
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#A81E54] to-[#E91E63] hover:from-[#8B1845] hover:to-[#C41A52] text-white border-0">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:ml-64">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Sales"
            value="₦2.4M"
            change="+18%"
            isPositive={true}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <MetricCard
            title="Total Orders"
            value="156"
            change="+12%"
            isPositive={true}
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <MetricCard
            title="Active Products"
            value="45"
            change="+8%"
            isPositive={true}
            icon={Package}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <MetricCard
            title="Total Customers"
            value="1.2K"
            change="+25%"
            isPositive={true}
            icon={Users}
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {recentActivity.map((activity) => {
                    const ActivityIcon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-lg ${activity.color}`}>
                          <ActivityIcon className="text-white w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {activity.time}
                          </p>
                        </div>
                        {(activity as any).amount && (
                          <span className="text-sm font-semibold text-gray-900 ml-2">
                            {(activity as any).amount}
                          </span>
                        )}
                        {(activity as any).rating && (
                          <span className="text-sm font-semibold text-yellow-600 ml-2">
                            {(activity as any).rating}
                          </span>
                        )}
                        {(activity as any).count && (
                          <span className="text-sm font-semibold text-orange-600 ml-2">
                            {(activity as any).count}
                          </span>
                        )}
                        {(activity as any).status && (
                          <span className="text-xs font-semibold text-purple-600 ml-2 px-2 py-1 bg-purple-100 rounded">
                            {(activity as any).status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`w-full p-4 rounded-lg bg-gradient-to-br ${action.color} text-white hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left group`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs opacity-90 mt-1">{action.description}</p>
                  </div>
                  <ArrowRight
                    className="mt-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}