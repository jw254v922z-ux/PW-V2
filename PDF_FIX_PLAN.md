# PDF Layout Fix Plan

## Problem Analysis

### Current Issues
1. **Black border around map** - html2canvas is capturing the entire map container including borders/controls
2. **Map off-center** - Positioning logic needs adjustment
3. **Map on page 2** - Should be on page 1 as thumbnail
4. **Lost content** - All previous PDF sections (pie chart, metrics, cash flow, assumptions) are missing

### Root Cause
The recent changes focused on getting polygons to capture correctly but removed the comprehensive PDF structure that was working in previous checkpoints.

## Solution Strategy

### Phase 1: Fix Map Capture Issues
**Goal:** Remove black border and properly size/position map on page 1

**Changes to mapScreenshotCapture.ts:**
- Add option to capture only the map canvas (not controls)
- Ensure white background is applied consistently
- Add margin/padding removal before capture

**Changes to pdfReport.ts (lines 216-234):**
- Reduce map dimensions to thumbnail size (width: 180mm, height: 100mm)
- Add proper margins and centering
- Remove any background color that might create black border
- Position map at top of page 1 (not page 2)

### Phase 2: Restructure Page 1 Layout
**Current:** Cover page with disclaimer + metrics
**New:** 
- Title and project name (keep)
- Disclaimer box (keep, reduce height)
- Small map thumbnail (new, top-right or below disclaimer)
- Key metrics grid (adjust to fit with map)

### Phase 3: Verify All Content Sections
Ensure all sections from pdfReport.ts are intact:
- ✅ Cover page with disclaimer
- ✅ Stakeholder value distribution (pie chart + metric cards)
- ✅ Financial metrics (generation, revenue, cost breakdown)
- ✅ Cash flow analysis (yearly table + stakeholder summary)
- ✅ Assumptions & data sources
- ✅ Page numbers and footer

## Implementation Details

### Map Capture Fix
```javascript
// In mapScreenshotCapture.ts
// Capture only the map canvas, not the controls
// Set backgroundColor to white explicitly
// Use scale: 1.5 instead of 2 to reduce file size
// Add logging to debug what's being captured
```

### PDF Layout Changes
```javascript
// In pdfReport.ts, modify map section (lines 216-234)
// Change from:
// - Full page width (pageWidth - 30)
// - Height: 150mm
// - On page 2

// To:
// - Width: 150mm (smaller thumbnail)
// - Height: 80mm (reduced height)
// - On page 1 (after disclaimer, before metrics)
// - Add proper margins and centering
// - Use addImage with 'JPEG' format to avoid transparency issues
```

### Page 1 Structure (New)
```
[Title: Solar Project Analysis]
[Project Name]
[Disclaimer Box - reduced height]
[Map Thumbnail - 150x80mm, centered]
[Key Metrics Grid - 2x3 layout]
```

## Testing Checklist
- [ ] Map displays without black border
- [ ] Map is properly centered on page 1
- [ ] Map size is appropriate (thumbnail, not full page)
- [ ] Polygons are visible in map screenshot
- [ ] All 5 pages of content are present
- [ ] Pie chart displays with correct colors
- [ ] Cash flow table is complete
- [ ] Assumptions section is present
- [ ] Page numbers are correct
- [ ] Footer appears on all pages

## Risk Mitigation
- **Risk:** Breaking existing content by moving map
- **Mitigation:** Keep all other code sections unchanged, only modify map section
- **Risk:** Map screenshot quality issues
- **Mitigation:** Test with different scale values (1.5, 2) and formats (JPEG, PNG)
- **Risk:** Layout overflow on page 1
- **Mitigation:** Reduce disclaimer height and adjust metric grid spacing

## Rollback Plan
If issues occur:
1. Revert to checkpoint `e086e631` which had full working PDF
2. Manually merge only the map polygon capture fix
3. Test incrementally
