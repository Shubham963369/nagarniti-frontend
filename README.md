# NagarNiti Frontend

Ward Transparency System - Next.js Frontend Application

## Overview

NagarNiti is a civic transparency platform that connects voters with their ward corporators. This frontend provides a modern, responsive interface for three user roles: Super Admin, Ward Admin, and Voter.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI + Radix UI
- **State Management**: Zustand (client), TanStack Query (server)
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (toast notifications)
- **Charts**: Recharts
- **Maps**: React-Leaflet (v4.2.1)
- **Reports**: jsPDF, jspdf-autotable, XLSX

## Features

### Super Admin
- Dashboard with overall statistics
- Manage all wards (CRUD)
- Manage ward admins
- View analytics across wards

### Ward Admin
- Ward-specific dashboard
- Manage funds (allocations by source) with document attachments
- Manage projects (create, update, track progress)
- Post project updates with images
- Handle grievances (respond, update status)
- Send notifications to voters
- View registered voters
- **Manage societies** (CRUD, fund allocations, member management)
- **Dedicated society detail pages** with projects and members
- Export reports (PDF/Excel)
- Add project locations on map

### Voter
- View ward statistics and corporator info
- Browse funds and projects
- Submit grievances with photos and documents
- Upvote/downvote grievances
- Comment on projects and grievances
- View projects on interactive map
- Before/After comparison for completed projects
- Receive notifications
- Update profile with photo
- **My Society page** - View society-specific projects, funds, members
- **Ongoing Work page** - Track in-progress projects
- **Ward Updates page** - View completed projects

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see nagarniti-backend)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd nagarniti-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local

# Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# For image optimization (if using external images)
# Add domains to next.config.js
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login)
│   ├── admin/             # Super Admin pages
│   │   ├── dashboard/
│   │   ├── wards/
│   │   ├── ward-admins/
│   │   ├── analytics/
│   │   └── settings/
│   ├── ward/              # Ward Admin pages
│   │   ├── dashboard/
│   │   ├── funds/
│   │   ├── projects/
│   │   ├── grievances/
│   │   ├── notifications/
│   │   ├── voters/
│   │   ├── societies/     # Society management
│   │   │   └── [uuid]/    # Society detail page
│   │   └── settings/
│   ├── voter/             # Voter pages
│   │   ├── dashboard/
│   │   ├── ongoing-work/  # In-progress projects
│   │   ├── ward-updates/  # Completed projects
│   │   ├── my-society/    # User's society
│   │   ├── projects/
│   │   ├── grievances/
│   │   ├── map/
│   │   ├── notifications/
│   │   └── settings/
│   ├── register/[wardSlug]/ # Voter registration
│   └── layout.tsx
├── components/
│   ├── ui/                # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── image-upload.tsx     # Image upload component
│   │   ├── document-upload.tsx  # Document upload component
│   │   ├── sonner.tsx           # Toast provider
│   │   └── ...
│   ├── layouts/           # Layout components
│   │   ├── admin-layout.tsx
│   │   ├── ward-layout.tsx
│   │   └── voter-layout.tsx
│   ├── maps/              # Map components
│   │   ├── location-picker.tsx
│   │   ├── single-location-map.tsx
│   │   └── project-map.tsx
│   ├── comments/          # Comment components
│   │   ├── comment-section.tsx
│   │   └── comment-item.tsx
│   ├── projects/          # Project components
│   │   └── before-after-comparison.tsx
│   ├── reports/           # Report components
│   │   └── export-buttons.tsx
│   ├── common/            # Reusable components
│   │   ├── status-badge.tsx
│   │   ├── fund-source-badge.tsx
│   │   └── empty-state.tsx
│   └── providers.tsx      # App providers
├── hooks/
│   └── use-toast.ts       # Toast hook (Sonner)
├── lib/
│   ├── api.ts             # API client
│   ├── reports.ts         # PDF/Excel report generation
│   └── utils.ts           # Utility functions
├── stores/
│   └── auth-store.ts      # Zustand auth store
└── types/
    └── index.ts           # TypeScript types
```

## Pages Overview

### Authentication
- `/login` - User login
- `/register/[wardSlug]` - Voter registration via ward link

### Super Admin (`/admin`)
- `/dashboard` - Overview stats, recent activity
- `/wards` - Manage all wards
- `/ward-admins` - Manage ward administrators
- `/analytics` - Cross-ward analytics
- `/settings` - Profile settings

### Ward Admin (`/ward`)
- `/dashboard` - Ward stats, quick actions
- `/funds` - Manage fund allocations
- `/projects` - Manage development projects (with society assignment)
- `/grievances` - Handle public grievances
- `/notifications` - Send ward notifications
- `/voters` - View registered voters
- `/societies` - Manage residential societies
- `/societies/[uuid]` - Society detail with projects, funds, members
- `/settings` - Profile settings

### Voter (`/voter`)
- `/dashboard` - Ward info, quick stats
- `/ongoing-work` - View in-progress projects with progress tracking
- `/ward-updates` - View completed projects
- `/my-society` - Society-specific projects, funds, members
- `/projects` - Browse all projects, view details, before/after comparison
- `/grievances` - Submit/vote on grievances, add comments
- `/map` - Interactive map of all ward projects
- `/notifications` - View notifications
- `/settings` - Profile settings with photo upload

## Key Components

### ImageUpload
Multi-image upload component with Supabase Storage:
```tsx
import { ImageUpload } from "@/components/ui/image-upload";

<ImageUpload
  value={imageUrls}
  onChange={(urls) => setImageUrls(urls)}
  folder="grievances"
  maxFiles={5}
/>
```

### SingleImageUpload
Single image upload for features like project cover:
```tsx
import { SingleImageUpload } from "@/components/ui/image-upload";

<SingleImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  folder="projects"
/>
```

### Toast Notifications
Using Sonner for loading states:
```tsx
import { toast } from "@/hooks/use-toast";

// Promise-based loading toast
toast.promise(submitMutation.mutateAsync(data), {
  loading: "Submitting...",
  success: "Submitted successfully!",
  error: (err) => err.message || "Failed",
});

// Simple toasts
toast.success("Title", "Description");
toast.error("Title", "Description");
```

### DocumentUpload
Document upload for PDFs and DOC files:
```tsx
import { DocumentUpload, SingleDocumentUpload } from "@/components/ui/document-upload";

<DocumentUpload
  value={documentUrls}
  onChange={(urls) => setDocumentUrls(urls)}
  folder="documents"
  maxFiles={5}
/>
```

### LocationPicker
Interactive map for selecting locations:
```tsx
import dynamic from "next/dynamic";
const LocationPicker = dynamic(
  () => import("@/components/maps/location-picker").then(m => m.LocationPicker),
  { ssr: false }
);

<LocationPicker
  value={{ lat: latitude, lng: longitude }}
  onChange={({ lat, lng }) => { setLatitude(lat); setLongitude(lng); }}
/>
```

### BeforeAfterComparison
Slider comparison for project images:
```tsx
import { BeforeAfterComparison } from "@/components/projects/before-after-comparison";

<BeforeAfterComparison
  beforeImage={project.beforeImageUrl}
  afterImage={project.imageUrl}
  title={project.title}
/>
```

### CommentSection
Comments with threading for projects/grievances:
```tsx
import { CommentSection } from "@/components/comments/comment-section";

<CommentSection entityType="project" entityId={projectId} />
```

### ExportButtons
PDF/Excel export buttons:
```tsx
import { ExportButtons } from "@/components/reports/export-buttons";

<ExportButtons
  onExportPDF={() => generateProjectsPDF(projects, wardName)}
  onExportExcel={() => generateProjectsExcel(projects, wardName)}
  disabled={!projects?.length}
/>
```

## API Integration

All API calls go through `/lib/api.ts`:

```typescript
import { voterApi, wardApi, adminApi, authApi, commentApi } from "@/lib/api";

// Examples
await authApi.login(email, password);
await voterApi.getProjects();
await wardApi.createProject(data);
await adminApi.getStats();
await commentApi.getComments("project", projectId);
await commentApi.createComment({ entityType: "project", entityId, content });
```

## Authentication Flow

1. User logs in via `/login`
2. Session cookie is set by backend
3. `auth-store.ts` manages auth state
4. Protected routes check `isAuthenticated`
5. Role-based routing redirects users

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT
