# NagarNiti - Society Feature & Voter UI Redesign Plan

## Overview
The client wants to add a **Society** feature (Ward → Society → Citizen hierarchy) and redesign the Voter portal to match the reference design with a focus on society-centric features.

## Reference Design Analysis
Based on: https://essentotechnologies.weebly.com/

### Design Theme (from Node-Admin-Hub)
**Government/Civic theme with blue and orange accents**

- **Primary Color**: HSL 221 83% 53% (Blue ~#3b82f6)
- **Accent Color**: HSL 24 95% 53% (Orange ~#f97316)
- **Background**: HSL 210 20% 98% (Light gray ~#f8fafc)
- **Cards**: White (#ffffff)
- **Sidebar**: HSL 220 27% 96% (Light blue-gray)
- **Muted Foreground**: HSL 220 9% 46%
- **Status Indicators**: Emoji-based (🟢 Completed, 🟡 In Progress, 🔴 Pending)
- **Typography**: Inter font, clean sans-serif

**Note**: The current nagarniti-frontend already uses similar shadcn/ui theming. We need to ensure the voter portal uses the blue-orange civic theme consistently.

### Key Pages to Implement
1. **Profile** - Citizen details, society info, fund allocations, resolved grievances
2. **Ongoing Work** - Card-based project display with photos, status, budget, timeline
3. **Ward Updates** - Completed projects with before/after photos, impact statements
4. **My Society** - Society-specific projects and fund allocations
5. **Public Grievance** - Already implemented (Kanban view)

---

## Database Changes Required

### New Tables

#### 1. `societies` Table
```sql
CREATE TABLE societies (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  ward_id INTEGER REFERENCES wards(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  pincode VARCHAR(10),
  total_units INTEGER, -- Number of flats/houses
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `society_fund_allocations` Table
```sql
CREATE TABLE society_fund_allocations (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  society_id INTEGER REFERENCES societies(id) NOT NULL,
  fund_id INTEGER REFERENCES funds(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  purpose VARCHAR(255),
  financial_year VARCHAR(10), -- e.g., "2025-26"
  status VARCHAR(50) DEFAULT 'allocated', -- allocated, utilized, pending
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table Modifications

#### 1. `users` Table - Add society reference
```sql
ALTER TABLE users ADD COLUMN society_id INTEGER REFERENCES societies(id);
```

#### 2. `projects` Table - Add society reference
```sql
ALTER TABLE projects ADD COLUMN society_id INTEGER REFERENCES societies(id);
```

#### 3. `grievances` Table - Add society reference (optional)
```sql
ALTER TABLE grievances ADD COLUMN society_id INTEGER REFERENCES societies(id);
```

---

## Backend API Changes

### New Routes: `/api/ward/societies`
```
GET    /api/ward/societies              - List all societies in ward
POST   /api/ward/societies              - Create a society
GET    /api/ward/societies/:uuid        - Get society details
PATCH  /api/ward/societies/:uuid        - Update society
DELETE /api/ward/societies/:uuid        - Delete society
GET    /api/ward/societies/:uuid/funds  - Get society fund allocations
POST   /api/ward/societies/:uuid/funds  - Allocate funds to society
```

### New Routes: `/api/voter/society`
```
GET    /api/voter/society                    - Get voter's society details
GET    /api/voter/society/projects           - Get society-specific projects
GET    /api/voter/society/fund-allocations   - Get society fund allocations
GET    /api/voter/society/members            - Get society members (basic info)
```

### Modified Routes
```
GET    /api/voter/profile     - Include society info
GET    /api/voter/projects    - Add filter by society
PATCH  /api/voter/settings    - Allow society selection during registration
```

---

## Frontend Changes - Voter Portal

### 1. Color Theme (match Node-Admin-Hub civic theme)
The current theme should work well. Key colors to use:
```css
/* Already in globals.css - ensure these are used consistently */
:root {
  --background: 210 20% 98%;      /* Light gray background */
  --primary: 221 83% 53%;          /* Blue - main accent */
  --accent: 24 95% 53%;            /* Orange - secondary accent */
  --card: 0 0% 100%;               /* White cards */
  --muted-foreground: 220 9% 46%;  /* Gray text */
}

/* Status colors */
--success: #22c55e (green)
--warning: #eab308 (yellow/orange)
--error: #ef4444 (red)
--info: #3b82f6 (blue)
```

**Use orange accent for:**
- Important buttons (Submit Grievance, View Details)
- Highlights and call-to-action elements
- Chart accents

**Use blue primary for:**
- Navigation active states
- Links
- Primary buttons

### 2. New/Redesigned Pages

#### `/voter` - Dashboard (Home)
- Welcome banner with ward/society info
- Quick stats cards (ongoing projects, fund utilization, grievances)
- Recent ward updates feed
- Quick links to sections

#### `/voter/profile` - Profile Page
**Sections:**
- Personal Details (name, contact, voter ID, address)
- Society Information (society name, address, member since)
- Fund Allocations Table (projects benefited from)
- Resolved Grievances List (with dates, status)

#### `/voter/ongoing-work` - Ongoing Work Page
**Design:**
- Card-based layout
- Each card shows:
  - Project title with emoji icon based on category
  - Status badge (🟡 In Progress, 🟢 Completed)
  - Fund source (Corporator/MLA/MP)
  - Budget amount
  - Start date & expected completion
  - Project image
  - Description with benefits
  - Progress bar

#### `/voter/ward-updates` - Ward Updates Page
**Design:**
- Completed projects showcase
- Before/After image comparison
- Financial breakdown
- Impact statements
- Timeline of completion

#### `/voter/my-society` - My Society Page
**Sections:**
- Society header (name, address, total units)
- Fund allocations for the society
- Society-specific ongoing projects
- Completed projects in society
- Society members directory (optional, privacy-conscious)

#### `/voter/grievances` - Public Grievance (Keep Current)
- Keep the Kanban view
- Add society filter option

### 3. Sidebar Updates
Current items to modify:
```
Dashboard     → Dashboard (redesigned)
Projects      → Ongoing Work (redesigned)
Map           → Keep as is
Grievances    → Public Grievance (keep current)
Notifications → Keep as is
Settings      → Keep as is

New items to add:
+ Ward Updates
+ My Society
+ Profile
```

---

## Implementation Steps

### Phase 1: Database & Backend (Priority: High)
1. Create Drizzle schema for `societies` and `society_fund_allocations`
2. Add `society_id` column to `users`, `projects`, `grievances`
3. Run migrations
4. Create seed data for societies
5. Implement ward society management APIs
6. Implement voter society APIs

### Phase 2: Ward Admin - Society Management
1. Create `/ward/societies` page - List societies
2. Create society CRUD dialogs
3. Fund allocation to societies
4. Assign voters to societies

### Phase 3: Voter Portal Redesign
1. Update color theme/CSS variables
2. Redesign Dashboard
3. Create Profile page
4. Create Ongoing Work page (redesign from Projects)
5. Create Ward Updates page
6. Create My Society page
7. Update sidebar navigation

### Phase 4: Registration Flow
1. Update voter registration to include society selection
2. Allow society selection in settings

---

## Drizzle Schema Code

```typescript
// Add to schema.ts

export const societies = pgTable("societies", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  wardId: integer("ward_id").references(() => wards.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  pincode: varchar("pincode", { length: 10 }),
  totalUnits: integer("total_units"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const societyFundAllocations = pgTable("society_fund_allocations", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  societyId: integer("society_id").references(() => societies.id).notNull(),
  fundId: integer("fund_id").references(() => funds.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  purpose: varchar("purpose", { length: 255 }),
  financialYear: varchar("financial_year", { length: 10 }),
  status: varchar("status", { length: 50 }).default("allocated"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const societiesRelations = relations(societies, ({ one, many }) => ({
  ward: one(wards, { fields: [societies.wardId], references: [wards.id] }),
  members: many(users),
  projects: many(projects),
  fundAllocations: many(societyFundAllocations),
}));

export const societyFundAllocationsRelations = relations(societyFundAllocations, ({ one }) => ({
  society: one(societies, { fields: [societyFundAllocations.societyId], references: [societies.id] }),
  fund: one(funds, { fields: [societyFundAllocations.fundId], references: [funds.id] }),
}));

// Update users table
// Add: societyId: integer("society_id").references(() => societies.id),

// Update projects table
// Add: societyId: integer("society_id").references(() => societies.id),

// Update grievances table
// Add: societyId: integer("society_id").references(() => societies.id),
```

---

## UI Component Guidelines

### Status Badges
```tsx
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    completed: { emoji: "🟢", text: "Completed", class: "bg-green-100 text-green-800" },
    in_progress: { emoji: "🟡", text: "In Progress", class: "bg-yellow-100 text-yellow-800" },
    planned: { emoji: "🔵", text: "Planned", class: "bg-blue-100 text-blue-800" },
    on_hold: { emoji: "🔴", text: "On Hold", class: "bg-red-100 text-red-800" },
  };
  // ...
};
```

### Project Card Design
```tsx
<Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="pb-2">
    <div className="flex items-center gap-2">
      <span className="text-2xl">{getCategoryEmoji(project.category)}</span>
      <CardTitle className="text-lg">{project.title}</CardTitle>
    </div>
    <StatusBadge status={project.status} />
  </CardHeader>
  <CardContent>
    <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
      <Image src={project.imageUrl} alt={project.title} fill className="object-cover" />
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
      <div><span className="text-muted-foreground">Fund:</span> {project.fundSource}</div>
      <div><span className="text-muted-foreground">Budget:</span> {formatCurrency(project.estimatedCost)}</div>
      <div><span className="text-muted-foreground">Start:</span> {formatDate(project.startDate)}</div>
      <div><span className="text-muted-foreground">Expected:</span> {formatDate(project.expectedEndDate)}</div>
    </div>
    <p className="text-muted-foreground text-sm">{project.description}</p>
    <Progress value={project.percentComplete} className="mt-3" />
  </CardContent>
</Card>
```

### Category Emoji Mapping
```typescript
const getCategoryEmoji = (category: string) => {
  const emojiMap: Record<string, string> = {
    "Roads & Infrastructure": "🛣️",
    "Water Supply": "🚰",
    "Drainage & Sewage": "🚿",
    "Street Lights": "💡",
    "Garbage Collection": "🗑️",
    "Parks & Gardens": "🌳",
    "Public Safety": "🛡️",
    "Other": "📋",
  };
  return emojiMap[category] || "📋";
};
```

---

## Notes for Implementation Agent

1. **Keep Admin & Ward Admin as-is** - Only voter portal needs redesign
2. **Preserve existing functionality** - Grievance system with Kanban is good
3. **Society is optional for users** - Some users may not have a society
4. **Progressive implementation** - Start with DB, then ward admin, then voter
5. **Test data** - Create 3-4 sample societies per ward with realistic fund allocations

## Priority Order
1. Database schema changes + migrations
2. Backend APIs for societies
3. Ward Admin society management UI
4. Voter profile + my society pages
5. Voter ongoing work + ward updates redesign
6. Dashboard redesign
