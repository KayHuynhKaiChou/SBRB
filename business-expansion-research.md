# SBRB Business Expansion — Research Report

**Date:** 2026-04-04
**Scope:** Business Hierarchy + Excel Import Templates + Mixed Charts

---

## 1. Business Hierarchy / Departments

**Data Model Pattern:**
- **Enterprise tools (Power BI, Tableau)**: tree/hierarchical structures with parent-child: Organization → Department → Branch → Team
- **Small business tools**: flat with dimensional columns — single row contains `org_id`, `dept_id`, `branch_id`, `dept_name`, `branch_name` → easier filtering/pivoting, simpler queries
- **Trade-off:** Tree = better data integrity + scalability; Flat = faster analytics + simpler export

**Recommendation for NestJS+React:** Use flat dimensional model in database (org_id, dept_id keys + lookup tables), expose as hierarchy in UI via nested selectors/dropdowns.

---

## 2. Excel Import Templates

**Structure Pattern:**
- **Multi-level headers:** Row 1 = categories (Revenue, Expenses), Row 2 = subcategories (Service A/B), Row 3+ = data
- **Common format:** One sheet per report type (Revenue, P&L, KPI). Use SUM formulas for subtotals.
- **Import strategy:** Parse headers → map to `dimension_name` + `dimension_level` → insert data rows with foreign keys

**Example structure:**
```
Revenue   | Revenue   | P&L     | P&L
Service A | Service B | COGS    | OpEx
Jan | Feb | Jan | Feb | Jan | Feb
100 | 120 | 80  | 100 | 50  | 60
```

**Parsing approach:** Skip merged cells, detect depth by column groups, store as nested JSON `{level1: {level2: value}}`.

---

## 3. Mixed Charts (Bar + Line + Dual Y-Axis)

**Chart.js Implementation:**
- **Per-series type:** Each dataset specifies its own `type: 'bar'|'line'`
- **Dual Y-axes:** Define `scales.y.position='left'` and `scales.y1.position='right'`, link datasets via `yAxisID`
- **Drawing order:** Use `order` property (higher = underneath)

**Code pattern:**
```javascript
datasets: [
  { type: 'bar', label: 'Revenue', yAxisID: 'y', data: [...] },
  { type: 'line', label: 'Growth %', yAxisID: 'y1', data: [...] }
]
```

**Note:** Chart.js doesn't auto-scale dual axes; must set `min/max` manually per axis to prevent overlap.

---

## Key Insights

1. **Hierarchy:** Use flat dimension model (easier for small teams) with tree UI rendering
2. **Excel import:** Build template parser that handles 2-3 header levels; store as `{metric, dimension_id, value}` tuples
3. **Charts:** Chart.js supports mixed types natively; pre-configure Y-axis ranges based on metric units (%, currency)

---

## Adoption Risk

- **Low:** Flat dimension model is standard in analytics platforms; Excel parsing is commodity skill
- **Medium:** Dual Y-axis requires manual tuning (no auto-scaling); may need UI for axis range config per chart

---

## Sources

- [BI With Tableau, Power BI, and Metabase: A Review](https://www.iteratorshq.com/blog/bi-with-tableau-power-bi-and-metabase-a-review/)
- [Power BI vs Tableau vs Metabase Comparison](https://valiotti.com/blog/powerbi-vs-tableau-vs-metabase/)
- [Profit and Loss Templates in Excel](https://chartexpo.com/blog/profit-and-loss-templates-in-excel)
- [Excel Reports with Nested Levels and Subtotals](https://help.qlik.com/en-US/nprinting/February2024/Content/NPrinting/ExcelReports/Excel-Reports-Nesteds.htm)
- [Chart.js Mixed Chart Types](https://www.chartjs.org/docs/latest/charts/mixed.html)
- [Chart.js Multi Axis Configuration](https://www.chartjs.org/docs/latest/samples/line/multi-axis.html)
- [How to Use Two Y Axes in Chart.js](https://www.geeksforgeeks.org/how-to-use-two-y-axes-in-chart-js/)
- [Data Modeling for Hierarchical Relationships](https://rspacesamuel.medium.com/data-modeling-for-hierarchical-relationships-708d2db295e9/)
