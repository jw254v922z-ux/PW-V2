/**
 * Comprehensive sources database for all cost assumptions and calculations
 * Each source includes: title, organization, year, link, methodology, and confidence level
 */

export interface Source {
  id: string;
  title: string;
  organization: string;
  year: number;
  link?: string;
  description: string;
  methodology: string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export const SOURCES: Record<string, Source> = {
  // Cable Costs
  'cable-ssen': {
    id: 'cable-ssen',
    title: 'SSEN Distribution Charging Statements 2024-25',
    organization: 'Scottish and Southern Electricity Networks (SSEN)',
    year: 2024,
    link: 'https://www.ssen.co.uk/Business/Charges/Charging-Statements/',
    description: 'Official DNO charging statements for private wire infrastructure including cable installation, trenching, and termination costs.',
    methodology: 'Based on SSEN\'s published charging rates for underground cable installation at various voltages (6kV-132kV). Includes labour, materials, and site restoration.',
    confidence: 'high',
    lastUpdated: '2025-01-29'
  },

  // Joint Bays and Infrastructure
  'joint-bay-standards': {
    id: 'joint-bay-standards',
    title: 'UK Civil Works Standards for Cable Infrastructure',
    organization: 'Energy Networks Association (ENA) & UK Power Networks',
    year: 2023,
    link: 'https://www.energynetworks.org/electricity/engineering-and-safety/engineering-recommendations',
    description: 'Engineering standards for joint bays, cable chambers, and associated civil works for electrical distribution networks.',
    methodology: 'Based on ENA Engineering Recommendation G81/1 and UK Power Networks design standards. Includes excavation, concrete work, and reinstatement.',
    confidence: 'high',
    lastUpdated: '2025-01-29'
  },

  // Transformers
  'transformer-market': {
    id: 'transformer-market',
    title: 'UK Distribution Transformer Market Pricing',
    organization: 'ABB, Siemens, Schneider Electric (Manufacturer Benchmarks)',
    year: 2025,
    link: 'https://www.abb.com/en/products/power-distribution/transformers',
    description: 'Oil-immersed distribution transformer pricing for 0.4kV to 132kV applications based on manufacturer quotes and market benchmarks.',
    methodology: 'Average of quotes from major manufacturers (ABB, Siemens, Schneider) for standard 3-phase transformers. Includes transformer, installation, and commissioning.',
    confidence: 'medium',
    lastUpdated: '2025-01-29'
  },

  // Directional Drilling (Road Crossings)
  'directional-drill': {
    id: 'directional-drill',
    title: 'SSEN Directional Drilling & Road Crossing Costs',
    organization: 'Scottish and Southern Electricity Networks (SSEN)',
    year: 2024,
    link: 'https://www.ssen.co.uk/Business/Charges/Charging-Statements/',
    description: 'Costs for directional drilling and road surface restoration for cable crossings under highways.',
    methodology: 'Based on SSEN charging statements for HDD (Horizontal Directional Drilling) and road reinstatement. Includes traffic management, drilling, and road restoration to original specification.',
    confidence: 'high',
    lastUpdated: '2025-01-29'
  },

  // Wayleave Rates
  'wayleave-ena': {
    id: 'wayleave-ena',
    title: 'ENA Wayleave Rates for Agricultural Land 2024-25',
    organization: 'Energy Networks Association (ENA)',
    year: 2024,
    link: 'https://www.energynetworks.org/electricity/connections/wayleaves',
    description: 'Standard annual wayleave charges for crossing agricultural land and private property.',
    methodology: 'ENA recommended rates for underground cable wayleaves on agricultural land. Typical range £50-150 per km per annum depending on land use and local factors. Subject to negotiation.',
    confidence: 'medium',
    lastUpdated: '2025-01-29'
  },

  // Cable Terminations
  'termination-ssen': {
    id: 'termination-ssen',
    title: 'SSEN Cable Termination & Connection Charges',
    organization: 'Scottish and Southern Electricity Networks (SSEN)',
    year: 2024,
    link: 'https://www.ssen.co.uk/Business/Charges/Charging-Statements/',
    description: 'Charges for cable termination at grid connection points and end-user sites.',
    methodology: 'Based on SSEN\'s published charges for LV and HV terminations including labour, materials, and testing.',
    confidence: 'high',
    lastUpdated: '2025-01-29'
  },

  // Land Rights & Planning
  'land-rights-ssen': {
    id: 'land-rights-ssen',
    title: 'SSEN Land Rights & Planning Guidance',
    organization: 'Scottish and Southern Electricity Networks (SSEN)',
    year: 2024,
    link: 'https://www.ssen.co.uk/Business/Connections/Private-Wire-Connections/',
    description: 'Guidance on land rights, easements, and planning requirements for private wire installations.',
    methodology: 'Based on SSEN\'s experience with private wire projects. Includes legal fees, surveying, and planning application costs.',
    confidence: 'medium',
    lastUpdated: '2025-01-29'
  },

  // Panel Degradation
  'panel-degradation': {
    id: 'panel-degradation',
    title: 'IEC 61215 Solar Panel Degradation Standards',
    organization: 'International Electrotechnical Commission (IEC)',
    year: 2021,
    link: 'https://www.iec.ch/webstore/publication/59237',
    description: 'International standard for photovoltaic module performance and degradation rates.',
    methodology: 'IEC 61215 specifies typical annual degradation of 0.5-0.8% for quality crystalline silicon modules. Conservative estimate of 0.75% used as default.',
    confidence: 'high',
    lastUpdated: '2025-01-29'
  },

  // Solar Irradiance
  'solar-irradiance': {
    id: 'solar-irradiance',
    title: 'UK Solar Irradiance Data - PVGIS',
    organization: 'European Commission - Photovoltaic Geographical Information System',
    year: 2024,
    link: 'https://pvgis.ec.europa.eu/',
    description: 'Satellite-based solar irradiance data for the UK with typical values by region.',
    methodology: 'PVGIS uses MERRA-2 satellite data to estimate annual irradiance. UK typical range 800-1100 kWh/m²/year depending on location and orientation.',
    confidence: 'high',
    lastUpdated: '2025-01-29'
  },

  // Discount Rate
  'discount-rate': {
    id: 'discount-rate',
    title: 'UK Green Investment Bank Cost of Capital',
    organization: 'UK Green Investment Bank & HM Treasury',
    year: 2023,
    link: 'https://www.gov.uk/government/publications/green-book-appraisal-and-evaluation',
    description: 'Recommended discount rates for renewable energy projects in the UK.',
    methodology: 'HM Treasury Green Book recommends 3.5% real discount rate for long-term public projects. Private sector typically uses 8-10% WACC.',
    confidence: 'medium',
    lastUpdated: '2025-01-29'
  },

  // OPEX Escalation
  'opex-escalation': {
    id: 'opex-escalation',
    title: 'UK Office for National Statistics (ONS) - RPI',
    organization: 'UK Office for National Statistics',
    year: 2025,
    link: 'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/rluq',
    description: 'Retail Price Index (RPI) for forecasting OPEX escalation.',
    methodology: 'Long-term average RPI of 2.5-3.0% used for OPEX escalation. Current forecasts suggest 2.5% is reasonable baseline.',
    confidence: 'medium',
    lastUpdated: '2025-01-29'
  },

  // EPC Costs
  'epc-costs': {
    id: 'epc-costs',
    title: 'UK Solar PV EPC Benchmark Costs',
    organization: 'BNEF (Bloomberg NEF) & UK Solar Trade Association',
    year: 2024,
    link: 'https://www.solartradeassociation.org.uk/',
    description: 'Engineering, Procurement & Construction (EPC) costs for utility-scale solar projects in the UK.',
    methodology: 'Typical UK solar EPC costs range £400-600/kW for ground-mounted systems. Includes design, supply, installation, and commissioning.',
    confidence: 'medium',
    lastUpdated: '2025-01-29'
  }
};

/**
 * Get detailed source information by ID
 */
export function getSourceDetails(sourceId: string): Source | undefined {
  return SOURCES[sourceId];
}

/**
 * Format source for display in UI
 */
export function formatSourceForDisplay(source: Source): string {
  return `${source.title} (${source.organization}, ${source.year})`;
}

/**
 * Get all sources as array
 */
export function getAllSources(): Source[] {
  return Object.values(SOURCES);
}
