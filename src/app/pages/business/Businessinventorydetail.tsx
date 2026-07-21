import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  sku: string;
  images: ProductImage[];
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type FormData = Omit<InventoryItem, 'id' | 'productId' | 'createdAt' | 'updatedAt'>;

export const BusinessInventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageInput, setImageInput] = useState('');

  const isEditMode = window.location.pathname.includes('/edit');

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/business/inventory/${id}`);
      if (!response.ok) throw new Error('Failed to fetch inventory item');
      const data = await response.json();
      setItem(data);
      setFormData(data);
      setIsEditing(isEditMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'costPrice' || name === 'quantity'
        ? parseFloat(value) || 0
        : value,
    });
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    setFormData({
      ...formData,
      tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
  };

  const addImage = () => {
    if (!formData || !imageInput.trim()) return;
    const newImage: ProductImage = {
      id: `new-${Date.now()}`,
      url: imageInput,
      alt: '',
      order: formData.images.length,
    };
    setFormData({
      ...formData,
      images: [...formData.images, newImage],
    });
    setImageInput('');
  };

  const removeImage = (imageId: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img.id !== imageId),
    });
  };

  const saveChanges = async () => {
    if (!formData || !item) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/business/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to save changes');
      const updated = await response.json();
      setItem(updated);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#8B1538] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={() => navigate('/business/inventory')}
          className="mt-3 text-sm text-[#8B1538] hover:underline font-medium"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  if (!formData) return null;

  const marginPercent = ((formData.price - formData.costPrice) / formData.price * 100).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/business/inventory')}
          className="text-[#8B1538] hover:underline font-medium text-sm"
        >
          ← Back to Inventory
        </button>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#8B1538] text-white rounded-lg font-medium hover:bg-[#6B0F2A] transition-colors text-sm"
          >
            Edit Product
          </button>
        )}
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Product Images */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Product Images</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {formData.images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.alt || 'Product'}
                  className="w-full aspect-square object-cover rounded-lg bg-gray-100"
                />
                {isEditing && (
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                />
                <button
                  onClick={addImage}
                  disabled={!imageInput.trim()}
                  className="px-3 py-2 bg-[#8B1538] text-white rounded-lg font-medium hover:bg-[#6B0F2A] disabled:bg-gray-400 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Product Information</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                Product Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                />
              ) : (
                <p className="dark:text-gray-300">{formData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                Description
              </label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                  {formData.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                  Category
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                  />
                ) : (
                  <p className="dark:text-gray-300">{formData.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                  SKU
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                  />
                ) : (
                  <p className="dark:text-gray-300">{formData.sku}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="font-semibold dark:text-white mb-4">Pricing & Stock</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                  Selling Price (₦)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                  />
                ) : (
                  <p className="font-medium dark:text-white">
                    ₦{formData.price.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                  Cost Price (₦)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                  />
                ) : (
                  <p className="font-medium dark:text-white">
                    ₦{formData.costPrice.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Margin: <span className="font-medium text-green-600 dark:text-green-400">{marginPercent}%</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                Quantity in Stock
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                />
              ) : (
                <p className="font-medium dark:text-white">{formData.quantity} units</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                Status
              </label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#8B1538] text-white rounded-lg font-medium hover:bg-[#6B0F2A] disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setFormData(item);
                setIsEditing(false);
              }}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};