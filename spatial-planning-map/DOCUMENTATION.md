# Spatial Planning Map - Complete Documentation

## Overview

The **Spatial Planning Map** is an interactive web application for displaying, filtering, and analyzing spatial planning data using Leaflet.js and React. It provides a modern, intuitive interface for visualizing GeoJSON features on an OpenStreetMap base layer, with real-time filtering capabilities powered by a searchable filter panel.

## Architecture

### Technology Stack

The application is built on a modern frontend stack leveraging battle-tested open-source libraries:

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Map Library** | Leaflet.js (v1.9.4) | High-performance, lightweight mapping library for rendering GeoJSON and interactive map controls |
| **Framework** | React 19 | Component-based UI with hooks for state management |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework for responsive design |
| **UI Components** | shadcn/ui | Pre-built, accessible component library |
| **Build Tool** | Vite | Fast development server and optimized production builds |

### Key Libraries

**Leaflet.js** is a legendary-tier open-source mapping library with 40k+ GitHub stars. It powers production mapping applications at companies like Mapbox, Flickr, and Foursquare. For this project, Leaflet was chosen over React-Leaflet to avoid TypeScript compatibility issues and provide direct control over map rendering and GeoJSON layer management.

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── SpatialMap.tsx        # Leaflet map container with GeoJSON rendering
│   │   ├── FilterPanel.tsx       # Interactive filter controls and search
│   │   └── ui/                   # shadcn/ui component library
│   ├── pages/
│   │   └── Home.tsx              # Main page integrating map and filters
│   ├── App.tsx                   # Root component with routing
│   ├── index.css                 # Global styles and design tokens
│   └── main.tsx                  # React entry point
├── public/
│   └── favicon.ico
└── index.html                    # HTML template with Leaflet CSS
```

## Core Components

### SpatialMap Component

The `SpatialMap` component manages the Leaflet map instance and GeoJSON layer rendering. It accepts three props:

- **geoData** (object): A GeoJSON FeatureCollection containing the spatial features to display
- **filteredFeatures** (string[]): Array of feature IDs that should be highlighted on the map
- **onFeatureClick** (function): Callback fired when a user clicks on a map feature

**Key Features:**
- Initializes the map on component mount with OpenStreetMap tiles
- Dynamically updates GeoJSON styling based on filter state
- Applies visual highlighting (green color, increased weight) to filtered features
- Automatically fits map bounds to visible features
- Renders interactive popups with feature properties on click

**Styling Logic:**
Filtered features display with emerald green color (#10B981), increased line weight (3px), and higher opacity (1.0). Unfiltered features appear in light gray (#D1D5DB) with reduced opacity (0.5) to maintain context while emphasizing selected data.

### FilterPanel Component

The `FilterPanel` component provides an intuitive interface for filtering spatial data. It extracts all unique property keys and values from the GeoJSON features and presents them as interactive checkboxes organized by property category.

**Key Features:**
- Dynamically generates filter options from GeoJSON properties
- Full-text search across filter categories and values
- Visual badges showing active filters with single-click removal
- Real-time feature count display showing filtered vs. total features
- Selected feature details panel at the bottom
- "Clear All" button for resetting filters

**Filter Logic:**
When multiple filters are selected, features must match ALL selected criteria (AND logic). For example, selecting both "Residential" zone and "Approved" status will only show residential features with approved status.

### Home Page

The Home page integrates the map and filter panel into a cohesive layout with a 70/30 split (map/filters). It manages application state including GeoJSON data, selected filters, and the currently selected feature.

**Sample Data:**
The application includes six sample planning zones representing different land use categories:

| Zone Name | Zone Type | Density | Status |
| :--- | :--- | :--- | :--- |
| Downtown Core | Commercial | High | Approved |
| Residential District A | Residential | Medium | Approved |
| Industrial Zone | Industrial | Low | Pending |
| Waterfront Development | Mixed-Use | High | Approved |
| Green Space Reserve | Parks | Low | Approved |
| Residential District B | Residential | Medium | Pending |

## Data Format

The application expects GeoJSON FeatureCollections with the following structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "1",
      "properties": {
        "id": "1",
        "name": "Downtown Core",
        "zone": "Commercial",
        "density": "High",
        "status": "Approved"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-74.0, 40.7], [-73.95, 40.7], [-73.95, 40.75], [-74.0, 40.75], [-74.0, 40.7]]]
      }
    }
  ]
}
```

**Requirements:**
- Each feature must have an `id` property for filtering
- Properties can be any string or number values
- Geometry types supported: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
- GeoJSON coordinates use [longitude, latitude] format (WGS84)

## Design System

The application follows a **Modern Data-Driven Minimalism** design philosophy that prioritizes map visibility while providing intuitive controls.

### Color Palette

| Color | Hex | Usage |
| :--- | :--- | :--- |
| Primary (Emerald) | #10B981 | Active filters, highlighted features, interactive elements |
| Secondary (Dark Emerald) | #059669 | Hover states, sidebar accents |
| Background | #F9FAFB | Page background, card backgrounds |
| Foreground | #1F2937 | Primary text |
| Muted | #9CA3AF | Secondary text, disabled states |
| Border | #E5E7EB | Dividers, component borders |

### Typography

- **Display Font**: Poppins Bold (headers, titles)
- **Body Font**: Inter Regular (descriptions, labels)
- **Accent Font**: Inter Medium (buttons, badges)

### Layout

The asymmetric 70/30 split layout ensures the map remains the focal point while the filter panel provides essential controls without obscuring the data visualization. On mobile devices, the filter panel can be toggled to full-screen or collapsed.

## Integration Guide

### Loading Custom GeoJSON Data

To load your own spatial planning data, replace the sample data in `Home.tsx`:

```typescript
const sampleData = {
  type: 'FeatureCollection',
  features: [
    // Your GeoJSON features here
  ]
};
setGeoData(sampleData);
```

Alternatively, fetch data from an API:

```typescript
useEffect(() => {
  fetch('/api/planning-zones')
    .then(res => res.json())
    .then(data => setGeoData(data));
}, []);
```

### Customizing Feature Styling

Edit the `style` function in `SpatialMap.tsx` to customize how features appear:

```typescript
style: (feature: any) => {
  const isFiltered = filteredFeatures.includes(feature?.properties?.id || '');
  return {
    color: isFiltered ? '#10B981' : '#D1D5DB',
    weight: isFiltered ? 3 : 1,
    opacity: isFiltered ? 1 : 0.5,
    fillOpacity: isFiltered ? 0.3 : 0.1,
  };
}
```

### Adding Custom Properties

The filter panel automatically detects all properties in your GeoJSON features. Simply add new properties to your features, and they will appear as filter categories:

```json
{
  "properties": {
    "id": "1",
    "name": "Downtown Core",
    "zone": "Commercial",
    "density": "High",
    "status": "Approved",
    "customProperty": "value"  // This will appear as a filter
  }
}
```

## Performance Considerations

**Leaflet Optimization:**
- GeoJSON layers are re-rendered only when filter state changes
- Map bounds fitting uses padding to prevent edge cases
- Popup content is generated on-demand to minimize DOM overhead

**React Optimization:**
- Filter panel uses `useMemo` to prevent unnecessary recalculations
- Map component uses refs to maintain Leaflet instance across re-renders
- Feature ID filtering is memoized for large datasets

**For Large Datasets (1000+ features):**
Consider implementing feature clustering using Leaflet.markercluster or simplifying geometry using tools like Mapshaper before loading into the application.

## Browser Compatibility

The application works on all modern browsers supporting ES2020+:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Credits

This application is powered by **Leaflet.js**, an amazing open-source mapping library. If it helped you, consider giving it a ⭐ star at [https://github.com/Leaflet/Leaflet](https://github.com/Leaflet/Leaflet) to support the maintainers.

Additional libraries used:
- React: [https://github.com/facebook/react](https://github.com/facebook/react)
- Tailwind CSS: [https://github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)
- shadcn/ui: [https://github.com/shadcn-ui/ui](https://github.com/shadcn-ui/ui)

## Next Steps

To extend this application, consider adding:

1. **Data Import**: CSV/GeoJSON file upload functionality to load custom planning data
2. **Export Features**: Allow users to export filtered results as GeoJSON or CSV
3. **Advanced Styling**: Color-code features by property value (e.g., density levels)
4. **Measurement Tools**: Distance and area measurement capabilities
5. **Comparison Mode**: Side-by-side comparison of different filter scenarios
6. **Data Persistence**: Save and load filter configurations for later use
