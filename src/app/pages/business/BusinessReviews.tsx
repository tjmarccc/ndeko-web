import { useState, useMemo } from 'react';
import {
  Star,
  Trash2,
  Ban,
  Search,
  Filter,
  MoreVertical,
  MessageCircle,
  Flag,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface Review {
  id: string;
  productName: string;
  productId: string;
  productImage: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  status: 'published' | 'blocked' | 'flagged';
  helpful: number;
  unhelpful: number;
}

const mockReviews: Review[] = [
  {
    id: 'REV-001',
    productName: 'Samsung Galaxy S24 Ultra',
    productId: 'TECH-SG524-001',
    productImage: 'https://via.placeholder.com/40',
    customerName: 'Chioma Okafor',
    rating: 5,
    title: 'Excellent camera quality',
    comment:
      'The camera on this phone is absolutely stunning. Night mode photography is incredible, and the zoom capabilities are unmatched. Highly recommend!',
    date: '2 days ago',
    status: 'published',
    helpful: 124,
    unhelpful: 3,
  },
  {
    id: 'REV-002',
    productName: 'MacBook Pro 14" M3',
    productId: 'TECH-MBP14-B02',
    productImage: 'https://via.placeholder.com/40',
    customerName: 'Tunde Adeyemi',
    rating: 4,
    title: 'Great performance, slightly pricey',
    comment:
      'Really happy with this laptop. Performance is smooth for coding and design work. Battery life is solid too. Only concern is the price point.',
    date: '4 days ago',
    status: 'published',
    helpful: 87,
    unhelpful: 5,
  },
  {
    id: 'REV-003',
    productName: 'Sony WH-1000XM5 Headphones',
    productId: 'TECH-SXH45-003',
    productImage: 'https://via.placeholder.com/40',
    customerName: 'Ngozi Ibe',
    rating: 3,
    title: 'Good but not great',
    comment:
      'Sound quality is decent and noise cancellation works well. However, the fit is a bit uncomfortable for extended use. Could be better.',
    date: '1 week ago',
    status: 'published',
    helpful: 45,
    unhelpful: 12,
  },
  {
    id: 'REV-004',
    productName: 'Samsung Galaxy S24 Ultra',
    productId: 'TECH-SG524-001',
    productImage: 'https://via.placeholder.com/40',
    customerName: 'Ibrahim Hassan',
    rating: 2,
    title: 'Arrived damaged',
    comment:
      'Product arrived with a cracked screen. Customer service was helpful in processing a replacement though. Hope the replacement is better.',
    date: '1 week ago',
    status: 'flagged',
    helpful: 34,
    unhelpful: 8,
  },
  {
    id: 'REV-005',
    productName: 'Ankara Print Dress',
    productId: 'FASH-APD-M-094',
    productImage: 'https://via.placeholder.com/40',
    customerName: 'Blessing Osei',
    rating: 1,
    title: 'Spam review',
    comment: 'Buy fake designer bags at our shop. Click link in bio!!!',
    date: '3 days ago',
    status: 'blocked',
    helpful: 0,
    unhelpful: 156,
  },
  {
    id: 'REV-006',
    productName: 'Air Fryer Pro 5L',
    productId: 'HOME-AFP5-006',
    productImage: 'https://via.placeholder.com/40',
    customerName: 'Chinedu Obi',
    rating: 5,
    title: 'Perfect for meal prep',
    comment:
      'This air fryer has transformed my cooking routine. Meals cook evenly and taste amazing. Cleanup is super easy. Worth every naira!',
    date: '5 days ago',
    status: 'published',
    helpful: 203,
    unhelpful: 2,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const styles = {
    published: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    flagged: 'bg-yellow-100 text-yellow-800',
  };

  const labels = {
    published: 'Published',
    blocked: 'Blocked',
    flagged: 'Flagged',
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

function ReviewCard({
  review,
  onBlock,
  onDelete,
  onRespond,
}: {
  review: Review;
  onBlock: (id: string) => void;
  onDelete: (id: string) => void;
  onRespond: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={review.productImage}
            alt={review.productName}
            className="w-12 h-12 rounded-lg bg-gray-200 object-cover"
          />
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-1">
                {review.productName} (ID: {review.productId})
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {review.customerName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ReviewStatusBadge status={review.status} />
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Rating and Date */}
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.rating} />
            <span className="text-xs text-gray-500">{review.date}</span>
          </div>

          {/* Review Title and Comment */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {review.title}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {review.comment}
            </p>
          </div>

          {/* Helpful Stats */}
          <div className="flex items-center gap-4 mb-3">
            <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors">
              <MessageCircle size={14} />
              Helpful ({review.helpful})
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors">
              <Flag size={14} />
              Unhelpful ({review.unhelpful})
            </button>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRespond(review.id)}
                className="text-xs h-8"
              >
                <MessageCircle size={14} className="mr-1" />
                Respond
              </Button>
              {review.status !== 'blocked' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBlock(review.id)}
                  className="text-xs h-8 text-orange-600 hover:text-orange-700"
                >
                  <Ban size={14} className="mr-1" />
                  Block
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(review.id)}
                className="text-xs h-8 text-red-600 hover:text-red-700"
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BusinessReviews() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviews, setReviews] = useState(mockReviews);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [blockConfirm, setBlockConfirm] = useState<string | null>(null);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating =
        ratingFilter === 'all' || review.rating === parseInt(ratingFilter);

      const matchesStatus =
        statusFilter === 'all' || review.status === statusFilter;

      return matchesSearch && matchesRating && matchesStatus;
    });
  }, [reviews, searchTerm, ratingFilter, statusFilter]);

  const handleDelete = (id: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
    setDeleteConfirm(null);
  };

  const handleBlock = (id: string) => {
    setReviews(
      reviews.map((r) =>
        r.id === id ? { ...r, status: 'blocked' as const } : r
      )
    );
    setBlockConfirm(null);
  };

  const handleRespond = (id: string) => {
    // Would open a response modal
    console.log('Respond to review:', id);
  };

  const stats = {
    total: reviews.length,
    published: reviews.filter((r) => r.status === 'published').length,
    flagged: reviews.filter((r) => r.status === 'flagged').length,
    blocked: reviews.filter((r) => r.status === 'blocked').length,
    avgRating: (
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    ).toFixed(1),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 lg:ml-64">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage customer product reviews
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 lg:ml-64 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Reviews', value: stats.total, color: 'blue' },
            { label: 'Published', value: stats.published, color: 'green' },
            { label: 'Flagged', value: stats.flagged, color: 'yellow' },
            { label: 'Blocked', value: stats.blocked, color: 'red' },
            { label: 'Avg Rating', value: stats.avgRating, color: 'purple' },
          ].map((stat, i) => {
            const colors = {
              blue: 'bg-blue-100 text-blue-900',
              green: 'bg-green-100 text-green-900',
              yellow: 'bg-yellow-100 text-yellow-900',
              red: 'bg-red-100 text-red-900',
              purple: 'bg-purple-100 text-purple-900',
            };

            return (
              <Card key={i} className="border-0">
                <CardContent className={`p-4 ${colors[stat.color as keyof typeof colors]}`}>
                  <p className="text-xs font-medium opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    placeholder="Search by customer, product, or review title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full md:w-40 h-10">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 font-medium">
                {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
              </p>
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onBlock={() => setBlockConfirm(review.id)}
                  onDelete={() => setDeleteConfirm(review.id)}
                  onRespond={handleRespond}
                />
              ))}
            </>
          ) : (
            <Card className="border-0 shadow-md text-center py-12">
              <CardContent>
                <Star size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">No reviews found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your filters or search terms
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={!!blockConfirm} onOpenChange={() => setBlockConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this review? It will no longer be visible to customers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blockConfirm && handleBlock(blockConfirm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Block
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}