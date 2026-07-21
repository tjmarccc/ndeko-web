import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  notes?: string;
}

export const BusinessOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status'] | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/business/orders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.trackingNumber || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!order || !newStatus) return;
    try {
      setUpdating(true);
      const response = await fetch(`/api/business/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to update order');
      const updated = await response.json();
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#8B1538] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error || 'Order not found'}</p>
        <button
          onClick={() => navigate('/business/orders')}
          className="mt-3 text-sm text-[#8B1538] hover:underline font-medium"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const statusColors: Record<Order['status'], string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    processing: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
    shipped: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
    delivered: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    cancelled: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
  };

  const paymentStatusColors: Record<Order['paymentStatus'], string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
    paid: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    failed: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/business/orders')}
        className="text-[#8B1538] hover:underline font-medium text-sm mb-6"
      >
        ← Back to Orders
      </button>

      <div className="grid gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold dark:text-white mb-1">
                Order #{order.orderId}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}
              >
                {order.paymentStatus.charAt(0).toUpperCase() +
                  order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Customer Information</h2>
          <div className="grid gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-medium dark:text-white">{order.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium dark:text-white">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium dark:text-white">{order.customerPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Shipping Address</h2>
          <div className="text-sm space-y-1 dark:text-gray-300">
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 rounded object-cover bg-gray-100"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{item.productName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium dark:text-white">
                    ₦{(item.price * item.quantity).toLocaleString('en-NG')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ₦{item.price.toLocaleString('en-NG')} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div className="flex justify-between dark:text-gray-300">
              <span>Subtotal</span>
              <span>₦{order.subtotal.toLocaleString('en-NG')}</span>
            </div>
            <div className="flex justify-between dark:text-gray-300">
              <span>Shipping</span>
              <span>₦{order.shippingCost.toLocaleString('en-NG')}</span>
            </div>
            <div className="flex justify-between dark:text-gray-300">
              <span>Tax</span>
              <span>₦{order.tax.toLocaleString('en-NG')}</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg dark:text-white">
            <span>Total</span>
            <span>₦{order.total.toLocaleString('en-NG')}</span>
          </div>
        </div>

        {/* Status Update */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Update Status</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                Order Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {newStatus === 'shipped' && (
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., TRK123456789"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                />
              </div>
            )}

            <button
              onClick={updateStatus}
              disabled={updating || newStatus === order.status}
              className="w-full px-4 py-2 bg-[#8B1538] text-white rounded-lg font-medium hover:bg-[#6B0F2A] disabled:bg-gray-400 transition-colors"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};