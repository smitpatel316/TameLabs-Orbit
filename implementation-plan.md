# Tame Labs: Implementation Plan (2026)

## Overview
This document outlines the step-by-step implementation plan for Tame Labs products.

## Phase 1: Brier (Q1-Q2 2026)

### Immediate Actions (Week 1-2)

#### 1.1 Rebrand Hubble → Brier
- [x] Created GitHub repo: `TameLabs-Brier`
- [ ] Rename codebase from "Hubble" to "Brier"
- [ ] Update all UI text/strings
- [ ] Update app name and branding

#### 1.2 Core Feature: The Wager Engine
- [ ] Modify prediction entry to include:
  - Event description ("I am about to...")
  - Fear prediction ("I predict...")
  - Probability (0-100%)
  - Category (Social, Work, Dating, etc.)
- [ ] Create resolution flow (Yes/No buttons)
- [ ] Add timestamp tracking

#### 1.3 Data Model Changes
```typescript
// New Prediction type
interface Prediction {
  id: string;
  userId: string;
  event: string;
  fear: string;
  probability: number;  // 0-100 (stored as 0-1)
  category: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  outcome?: boolean;
  notes?: string;
}
```

### MVP Features Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Quick Log UI | Pending | Modify Hubble's log screen |
| Probability input | Pending | Add slider (0-100) |
| Resolution flow | Pending | Yes/No outcome tracking |
| Scatter plot | Pending | Use existing charting lib |
| Local SQLite | Done | Already implemented |

### Technical Debt
- [ ] Remove Hubble-specific features (partner profile)
- [ ] Clean up unused code
- [ ] Optimize bundle size

---

## Phase 2: Orbit (Q3-Q4 2026)

### Prerequisites
- [ ] Brier with 10,000 users (or significant traction)
- [ ] Tame Cloud infrastructure ready

### Implementation Steps

#### 2.1 New Repository
- [ ] Create `TameLabs-Orbit` repo
- [ ] Fork Brier codebase
- [ ] Add relationship-specific models

#### 2.2 Data Models
```typescript
interface Contact {
  id: string;
  name: string;
  relationshipType: 'personal' | 'professional' | 'family';
  energyScore: number;  // -10 to +10
  category: string;
  notes: string;
  interactions: Interaction[];
  createdAt: Date;
}

interface Interaction {
  id: string;
  contactId: string;
  date: Date;
  type: 'call' | 'text' | 'in-person' | 'email';
  summary: string;
  topics: string[];
}
```

#### 2.3 Features
- [ ] Contact list/management
- [ ] Relationship visualization
- [ ] Interaction logging
- [ ] Energy tracking

---

## Phase 3: Quiet (2027+)

### Prerequisites
- [ ] Brier + Orbit user base
- [ ] Proven community engagement
- [ ] Tame Cloud revenue

### Implementation Steps

#### 3.1 New Repository
- [ ] Create `TameLabs-Quiet` repo
- [ ] Reuse Brier/Orbit components

#### 3.2 Architecture
- [ ] Design anti-engagement data model
- [ ] Implement async-first communication
- [ ] Build circle/invitation system

---

## Tame Cloud Infrastructure

### Required Services
| Service | Purpose | Est. Cost |
|---------|---------|-----------|
| Supabase | Database + Auth | $25/mo |
| Cloudflare | CDN + Security | $10/mo |
| Cloudflare Tunnel | External access | Free |
| Domain (tamelabs.ai) | Brand domain | $20/yr |

### Security Requirements
- End-to-end encryption for all user data
- Zero-knowledge architecture
- Local-first with optional cloud sync

---

## Timeline

```
2026
├── Q1 (Jan-Mar)
│   ├── Month 1: Rebrand Hubble → Brier
│   ├── Month 2: Implement Wager Engine
│   └── Month 3: MVP Launch (Web + PWA)
│
├── Q2 (Apr-Jun)
│   ├── Month 4: V1.0 Features (Brier Score, Categories)
│   ├── Month 5: Data Export, Polish
│   └── Month 6: iOS/Android App Stores
│
├── Q3 (Jul-Sep)
│   ├── Orbit Development
│   ├── Tame Cloud Beta
│   └── Community Building
│
└── Q4 (Oct-Dec)
    ├── Orbit Launch
    ├── Quiet Planning
    └── 2027 Strategy
```

---

## Success Metrics

### Brier KPIs
- **10,000 Active Users** by end of Q2 2026
- Average Brier Score displayed per user
- Daily prediction entries per active user
- 30-day retention rate

### Business KPIs
- Tame Cloud subscribers: 500 by end of 2026
- Monthly Recurring Revenue: $2,500-$5,000

---

*Last Updated: 2026-02-16*
