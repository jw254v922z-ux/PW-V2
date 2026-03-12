import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';

interface FilterPanelProps {
  geoData: any;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  selectedFeature: any;
  onFeatureSelect: (feature: any) => void;
}

export default function FilterPanel({
  geoData,
  selectedFilters,
  onFilterChange,
  selectedFeature,
  onFeatureSelect,
}: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique property keys and values from GeoJSON
  const filterOptions = useMemo(() => {
    if (!geoData || !geoData.features) return {};

    const options: Record<string, Set<string>> = {};

    geoData.features.forEach((feature: any) => {
      const props = feature.properties || {};
      Object.entries(props).forEach(([key, value]) => {
        if (!options[key]) {
          options[key] = new Set();
        }
        options[key].add(String(value));
      });
    });

    // Convert sets to sorted arrays
    const result: Record<string, string[]> = {};
    Object.entries(options).forEach(([key, values]) => {
      result[key] = Array.from(values).sort();
    });

    return result;
  }, [geoData]);

  // Get filtered features based on current selections
  const filteredFeatureIds = useMemo(() => {
    if (!geoData || !geoData.features) return [];

    return geoData.features
      .filter((feature: any) => {
        const props = feature.properties || {};

        // Check if feature matches all selected filters
        for (const [key, selectedValues] of Object.entries(selectedFilters)) {
          if (selectedValues.length > 0) {
            const featureValue = String(props[key] || '');
            if (!selectedValues.includes(featureValue)) {
              return false;
            }
          }
        }

        return true;
      })
      .map((feature: any) => feature.properties?.id || feature.id);
  }, [geoData, selectedFilters]);

  const handleToggleFilter = (key: string, value: string) => {
    const currentValues = selectedFilters[key] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange({
      ...selectedFilters,
      [key]: newValues,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Filter options based on search term
  const searchedOptions = useMemo(() => {
    if (!searchTerm) return filterOptions;

    const result: Record<string, string[]> = {};
    Object.entries(filterOptions).forEach(([key, values]) => {
      const filteredValues = values.filter(
        (v) =>
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredValues.length > 0) {
        result[key] = filteredValues;
      }
    });

    return result;
  }, [filterOptions, searchTerm]);

  const activeFilterCount = Object.values(selectedFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-2">Filters</h2>
        <div className="text-sm text-muted-foreground">
          {filteredFeatureIds.length} of {geoData?.features?.length || 0} features
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search filters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Active Filters</span>
            <button
              onClick={handleClearFilters}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([key, values]) =>
              values.map((value) => (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleToggleFilter(key, value)}
                >
                  {value}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))
            )}
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(searchedOptions).length > 0 ? (
          Object.entries(searchedOptions).map(([key, values]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-foreground mb-2">{key}</h3>
              <div className="space-y-2">
                {values.map((value) => (
                  <label
                    key={`${key}-${value}`}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={(selectedFilters[key] || []).includes(value)}
                      onChange={() => handleToggleFilter(key, value)}
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                    <span className="text-sm text-foreground group-hover:text-primary">
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No filters found</p>
          </div>
        )}
      </div>

      {/* Selected Feature Info */}
      {selectedFeature && (
        <div className="p-4 border-t border-border bg-accent/5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Selected Feature</h3>
          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(selectedFeature.properties || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium text-muted-foreground">{key}:</span>
                <span className="text-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
