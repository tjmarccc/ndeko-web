import { useState } from 'react';
import {
  Truck,
  Plus,
  MapPin,
  Clock,
  DollarSign,
  Package,
  Zap,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

interface DeliveryGig {
  id: string;
  title: string;
  pickupLocation: string;
  deliveryLocation: string;
  fee: number;
  status: 'open' | 'assigned' | 'in-progress' | 'completed';
  createdDate: string;
  assignedTo?: string;
  estimatedDelivery: string;
  orders: number;
}

interface DispatchHistory {
  id: string;
  date: string;
  driver: string;
  route: string;
  ordersDelivered: number;
  distance: number;
  duration: string;
  cost: number;
  status: 'completed' | 'in-progress';
}

const mockGigs: DeliveryGig[] = [
  {
    id: 'GIG-001',
    title: 'Lagos Mainland Route',
    pickupLocation: 'TechHub Store, VI',
    deliveryLocation: 'Ikoyi to Lekki',
    fee: 15000,
    status: 'open',
    createdDate: '2 hours ago',
    estimatedDelivery: 'Today by 6 PM',
    orders: 8,
  },
  {
    id: 'GIG-002',
    title: 'Express Delivery - Ikeja',
    pickupLocation: 'TechHub Store, VI',
    deliveryLocation: 'Ikeja, GRA',
    fee: 12000,
    status: 'assigned',
    assignedTo: 'Chukwu Express',
    createdDate: '1 hour ago',
    estimatedDelivery: 'Today by 4 PM',
    orders: 5,
  },
  {
    id: 'GIG-003',
    title: 'Weekend Bundle - Surulere',
    pickupLocation: 'TechHub Store, VI',
    deliveryLocation: 'Surulere District',
    fee: 18000,
    status: 'in-progress',
    assignedTo: 'Swift Logistics',
    createdDate: 'Yesterday',
    estimatedDelivery: 'Today by 8 PM',
    orders: 12,
  },
];

const mockHistory: DispatchHistory[] = [
  {
    id: 'DISP-145',
    date: 'May 20, 2026',
    driver: 'Chukwu Express',
    route: 'VI → Ikoyi → Lekki',
    ordersDelivered: 15,
    distance: 42,
    duration: '3h 45m',
    cost: 25000,
    status: 'completed',
  },
  {
    id: 'DISP-144',
    date: 'May 19, 2026',
    driver: 'Swift Logistics',
    route: 'VI → Ikeja → Gbagada',
    ordersDelivered: 12,
    distance: 38,
    duration: '3h 20m',
    cost: 22000,
    status: 'completed',
  },
  {
    id: 'DISP-143',
    date: 'May 18, 2026',
    driver: 'Express Wings',
    route: 'VI → Surulere → Mushin',
    ordersDelivered: 18,
    distance: 48,
    duration: '4h 10m',
    cost: 28000,
    status: 'completed',
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  const labels = {
    open: 'Open',
    assigned: 'Assigned',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
        styles[status as keyof typeof styles]
      }`}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-gray-600 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtext && (
              <p className="text-xs text-gray-500 mt-1">{subtext}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="text-white w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessLogistics() {
  const [gigs, setGigs] = useState(mockGigs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateGig, setShowCreateGig] = useState(false);

  const stats = {
    activeGigs: gigs.filter((g) => g.status !== 'completed').length,
    completedDeliveries: mockHistory.length,
    totalDistance: mockHistory.reduce((sum, h) => sum + h.distance, 0),
    totalCost: mockHistory.reduce((sum, h) => sum + h.cost, 0),
  };

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || gig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 lg:ml-64">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logistics</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage delivery gigs and dispatch history
            </p>
          </div>
          <Dialog open={showCreateGig} onOpenChange={setShowCreateGig}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#A81E54] to-[#E91E63] hover:from-[#8B1845] hover:to-[#C41A52] text-white border-0">
                <Plus className="mr-2 w-4.5 h-4.5" />
                Create Delivery Gig
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Delivery Gig</DialogTitle>
                <DialogDescription>
                  Post a new delivery job to the gig board or assign to in-house dispatch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Route/Title
                  </label>
                  <Input
                    placeholder="e.g., Lagos Island Delivery"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Pickup Location
                  </label>
                  <Input placeholder="TechHub Store, VI" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Delivery Location
                  </label>
                  <Input placeholder="e.g., Ikoyi to Lekki" className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Delivery Fee
                  </label>
                  <Input placeholder="₦15,000" className="mt-1.5" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Assign to
                  </label>
                  <Select defaultValue="gig-board">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gig-board">Gig Board (Open)</SelectItem>
                      <SelectItem value="in-house">In-House Dispatch</SelectItem>
                      <SelectItem value="chukwu">Chukwu Express</SelectItem>
                      <SelectItem value="swift">Swift Logistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-gradient-to-r from-[#A81E54] to-[#E91E63]">
                  Create Gig
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:ml-64 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Zap}
            label="Active Gigs"
            value={stats.activeGigs}
            subtext="Waiting for assignment"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Deliveries"
            value={stats.completedDeliveries}
            subtext="Last 30 days"
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            icon={MapPin}
            label="Total Distance"
            value={`${stats.totalDistance} km`}
            subtext="Dispatched routes"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            icon={DollarSign}
            label="Total Dispatch Cost"
            value={`₦${(stats.totalCost / 1000).toFixed(0)}K`}
            subtext="Logistics expenses"
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 border-b border-gray-200">
          <button className="px-4 py-3 font-medium text-gray-900 border-b-2 border-[#A81E54]">
            Active Gigs
          </button>
          <button className="px-4 py-3 font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Dispatch History
          </button>
        </div>

        {/* Active Gigs Section */}
        <div className="space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Search gigs by route or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40 h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Gigs Grid */}
          {filteredGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGigs.map((gig) => (
                <Card
                  key={gig.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all"
                >
                  <CardHeader className="pb-3 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{gig.title}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          {gig.createdDate}
                        </p>
                      </div>
                      <StatusBadge status={gig.status} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Locations */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="text-sm text-gray-700 flex-1">
                          <p className="font-medium">From</p>
                          <p className="text-gray-600">{gig.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-[#A81E54] flex-shrink-0 mt-1" />
                        <div className="text-sm text-gray-700 flex-1">
                          <p className="font-medium">To</p>
                          <p className="text-gray-600">
                            {gig.deliveryLocation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Delivery
                        </span>
                        <span className="font-medium text-gray-900">
                          {gig.estimatedDelivery}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" />
                          Orders
                        </span>
                        <span className="font-medium text-gray-900">
                          {gig.orders}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" />
                          Fee
                        </span>
                        <span className="font-bold text-[#A81E54]">
                          ₦{gig.fee.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    {gig.assignedTo && (
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-gray-600">Assigned to</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {gig.assignedTo}
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    <Button
                      variant="outline"
                      className="w-full h-9"
                      disabled={gig.status === 'open'}
                    >
                      {gig.status === 'open' ? 'Awaiting Assignment' : 'View Details'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-md text-center py-12">
              <CardContent>
                <Truck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No gigs found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a new delivery gig or adjust your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dispatch History Section */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Dispatch History</CardTitle>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Dispatch ID
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Driver
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      Route
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-900">
                      Orders
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-900">
                      Distance
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-900">
                      Duration
                    </th>
                    <th className="text-right p-4 font-semibold text-gray-900">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockHistory.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-gray-600">
                        {record.id}
                      </td>
                      <td className="p-4 text-gray-900">{record.date}</td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">
                          {record.driver}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-xs">
                        {record.route}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-semibold">
                          {record.ordersDelivered}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-900">
                        {record.distance} km
                      </td>
                      <td className="p-4 text-center text-gray-900">
                        {record.duration}
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-900">
                        ₦{record.cost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}