import React, { useState, useMemo } from 'react';
import { Filter, Grid3X3, List } from 'lucide-react';
import TourCard from './TourCard';
import ActivityCard from './ActivityCard';
import { Tour } from '@/services/tourService';
import { Activity } from '@/types/activity';

type ItemType = 'all' | 'tours' | 'activities';

interface FilterableGridProps {
  tours: Tour[];
  activities: Activity[];
  onTourClick?: (tour: Tour) => void;
  onActivityClick?: (activity: Activity) => void;
}

const FilterableGrid: React.FC<FilterableGridProps> = ({
  tours,
  activities,
  onTourClick,
  onActivityClick,
}) => {
  const [filterType, setFilterType] = useState<ItemType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = useMemo(() => {
    const allItems: Array<Tour | Activity> = [];

    if (filterType === 'all' || filterType === 'tours') {
      tours.forEach(tour => allItems.push(tour));
    }

    if (filterType === 'all' || filterType === 'activities') {
      activities.forEach(activity => allItems.push(activity));
    }

    // Sort by featured/popular first, then by creation date
    return allItems.sort((a, b) => {
      const aFeatured = 'isFeatured' in a ? a.isFeatured : ('popular' in a ? a.popular : false);
      const bFeatured = 'isFeatured' in b ? b.isFeatured : ('popular' in b ? b.popular : false);

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      // If both have same featured status, sort by date (newest first)
      const aDate = 'createdAt' in a ? new Date(a.createdAt || 0) : new Date(0);
      const bDate = 'createdAt' in b ? new Date(b.createdAt || 0) : new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [tours, activities, filterType]);

  const renderItem = (item: Tour | Activity) => {
    if ('title' in item) {
      // It's a Tour
      return (
        <div key={`tour-${item._id}`} className="h-full">
          <TourCard
            tour={item}
            variant="grid"
            onClick={() => onTourClick?.(item)}
          />
        </div>
      );
    } else {
      // It's an Activity
      return (
        <div key={`activity-${item._id}`} className="h-full">
          <ActivityCard
            activity={item}
            variant="grid"
            onClick={() => onActivityClick?.(item)}
          />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Lọc theo:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('tours')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'tours'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tour ({tours.length})
            </button>
            <button
              onClick={() => setFilterType('activities')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'activities'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoạt động ({activities.length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Xem:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-orange-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Hiển thị {filteredItems.length} kết quả
      </div>

      {/* Grid/List View */}
      {filteredItems.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredItems.map(renderItem)}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Grid3X3 className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Không tìm thấy kết quả
          </h3>
          <p className="text-gray-500">
            Thử thay đổi bộ lọc để tìm thấy kết quả phù hợp hơn.
          </p>
        </div>
      )}
    </div>
  );
};

export default FilterableGrid;