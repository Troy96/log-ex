# Log-Ex - Product Requirements Document

## Overview

**Log-Ex** ("Log your Expenses" / mathematical log expression) is a personal finance toolkit that helps users track and understand their spending patterns over time. The initial focus is a **Lifestyle Inflation Calculator** that quantifies the often-invisible creep of expenses as income grows. Future tools will expand the platform's capabilities.

Unlike generic budgeting apps, Log-Ex focuses on insights and trends rather than day-to-day budgeting.

## Problem Statement

As people earn more, their spending often increases proportionally—sometimes faster than they realize. This "lifestyle inflation" erodes savings potential and delays financial goals. Currently, no dedicated tool exists to:
- Quantify personal inflation rate vs. official CPI
- Identify which categories are inflating fastest
- Show the long-term impact of spending creep

## Target Users

- **Primary**: Income-earners who want to understand their spending trends (25-45 age range)
- **Secondary**: Budget-conscious individuals, FIRE community members, financial coaches

## Platform Strategy

| Phase | Platform | Timeline |
|-------|----------|----------|
| MVP | Web App | Initial launch |
| V2 | Progressive Web App (installable) | Post-MVP |
| V3 | Native iOS/Android | Future |

---

## Core Features

### MVP (Phase 1)

#### Data Input
- **Manual Entry**: Add expenses with date, amount, category, description
- **CSV Import**: Upload expense data from bank exports or spreadsheets
  - Generic CSV with user-defined column mapping
  - **YNAB preset**: Pre-configured importer for YNAB exports
  - **Mint preset**: Pre-configured importer for Mint exports
- **Recurring Expenses**: Mark expenses as recurring (monthly, yearly, etc.)

#### Currency Support
- **MVP Currencies**: INR (₹), USD ($), EUR (€)
- **Extensible Architecture**: Easy to add new currencies via configuration
- **Per-expense currency**: Each expense stores its currency
- **Display currency preference**: User chooses default display currency

#### User Preferences
- **Date Format**: User-selectable (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **Currency Display**: Choose default currency for dashboards
- **Theme**: Light/Dark mode

#### Categories
- **Default Categories**: Housing, Food & Groceries, Dining Out, Transportation, Utilities, Entertainment, Shopping, Health, Subscriptions, Other
- **Category Editing**: Rename or hide default categories

#### Calculations & Metrics
- **Personal Inflation Rate**: Year-over-year percentage change in total spending
- **Category Inflation**: Inflation rate broken down by category
- **Period Comparison**: Compare any two time periods (month-to-month, year-to-year)
- **Average Monthly Spend**: Rolling averages to smooth out one-time expenses

#### Visualization
- **Dashboard Overview**: Key metrics at a glance
- **Trend Charts**: Line charts showing spending over time
- **Category Breakdown**: Pie/bar charts for category distribution
- **Inflation Heatmap**: Visual showing which categories are inflating fastest

#### Data Management
- **Export**: Download data as CSV
- **Data Persistence**: Local storage + optional account creation

---

### Phase 2 Features

#### Enhanced Input
- **Bill Scanning**: OCR to extract expenses from receipts/bills (camera or image upload)
- **Smart Categorization**: ML-based auto-categorization of expenses

#### Advanced Analytics
- **Projections**: "If this trend continues..." forecasting
- **Income Tracking**: Compare expense inflation vs. income growth
- **Savings Impact Calculator**: Show how lifestyle inflation affects long-term savings
- **Alerts**: Notify when a category exceeds historical averages

#### Custom Categories (Subscription Feature)
- Create unlimited custom categories
- Subcategories for granular tracking
- Category rules for auto-assignment

---

### Phase 3 Features

#### Bank Integration
- Connect bank accounts via Plaid or similar
- Automatic transaction import
- Transaction deduplication

#### Mobile Apps
- Native iOS app
- Native Android app
- Push notifications for spending alerts

#### Social/Sharing
- Anonymous benchmarking against similar demographics
- Share reports (PDF export)

---

## Subscription Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Manual entry, CSV import, basic categories, core metrics, 2-year history |
| **Pro** | $5/mo | Custom categories, subcategories, bill scanning, projections, unlimited history, export options |
| **Premium** | $10/mo | Bank integration, advanced analytics, priority support |

---

## Key Metrics Definitions

### Personal Inflation Rate
```
Inflation Rate = ((Current Period Spend - Previous Period Spend) / Previous Period Spend) × 100
```

### Real Lifestyle Inflation
```
Real Lifestyle Inflation = Personal Inflation Rate - Official CPI
```
Shows how much spending is growing above general economic inflation.

### Category Contribution
```
Category Contribution = (Category Inflation × Category Weight) / Total Inflation
```
Identifies which categories are driving overall inflation.

---

## Technical Considerations

### Stack (Proposed)
- **Frontend**: React/Next.js or Vue/Nuxt
- **Backend**: Node.js or Python (FastAPI)
- **Database**: PostgreSQL
- **Authentication**: OAuth (Google, Apple) + email/password
- **Hosting**: Vercel/Railway or AWS

### Data Privacy
- All financial data encrypted at rest
- Option for local-only storage (no cloud sync)
- GDPR/CCPA compliant
- No selling of user data

### OCR/Bill Scanning
- Integration with Tesseract or cloud OCR service (Google Vision, AWS Textract)
- Structured data extraction for common bill formats

---

## Success Metrics

- **User Activation**: % of users who enter at least 1 month of expenses
- **Retention**: Weekly/monthly active users
- **Conversion**: Free to Pro upgrade rate
- **NPS**: User satisfaction score

---

## Resolved Decisions

- **Date format**: User preference in settings (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **Multi-currency**: MVP supports INR, USD, EUR with extensible architecture
- **Product name**: Log-Ex (expandable platform for future tools)
- **Budgeting app imports**: YNAB and Mint presets included in MVP

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-24 | 0.1 | Initial PRD draft |
| 2026-01-25 | 0.2 | Renamed to Log-Ex, added multi-currency (INR/USD/EUR), user date format preference, YNAB/Mint import presets |
