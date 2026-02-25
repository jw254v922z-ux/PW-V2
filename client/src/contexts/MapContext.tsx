import React, { createContext, useContext, useState } from 'react';

interface MapContextType {
  mapScreenshot: string | null;
  setMapScreenshot: (screenshot: string | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapScreenshot, setMapScreenshot] = useState<string | null>(null);

  return (
    <MapContext.Provider value={{ mapScreenshot, setMapScreenshot }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider');
  }
  return context;
}
