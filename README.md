# StoreFront - Multi-Tenant E-Commerce Platform

A high-performance, scalable storefront application built with Next.js 15 for a multi-tenant SaaS platform.

## 🚀 Features

- **Multi-Tenant Architecture**: Each store is uniquely identified by code (path-based routing)
- **Server-Side Rendering**: Fast initial page loads with React Server Components
- **Type-Safe API Layer**: Comprehensive error handling and TypeScript types
- **Modern UI**: Built with TailwindCSS and shadcn/ui components
- **Responsive Design**: Mobile-first approach with beautiful animations
- **SEO Optimized**: Dynamic metadata generation per store
- **Error Handling**: Graceful error states for all scenarios

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── error.tsx                # Global error boundary
│   ├── not-found.tsx            # 404 page
│   └── store/
│       └── [code]/              # Dynamic store routes
│           ├── layout.tsx       # Store layout (header/footer)
│           ├── page.tsx         # Store homepage
│           └── loading.tsx      # Loading state
│
├── features/                     # Feature modules
│   └── store/
│       ├── api/                 # API calls & server actions
│       │   ├── get-store.ts    # Store fetching logic
│       │   └── queries.ts      # React Query hooks
│       ├── components/          # Store-specific components
│       │   ├── store-header.tsx
│       │   ├── store-footer.tsx
│       │   ├── store-hero.tsx
│       │   ├── store-error.tsx
│       │   └── store-loading.tsx
│       ├── types/               # TypeScript types
│       │   └── store.types.ts
│       └── utils/               # Utilities
│           └── store-resolver.ts
│
├── lib/                         # Shared utilities
│   ├── api/                     # Core API layer
│   │   ├── client.ts           # Base fetch wrapper
│   │   ├── config.ts           # API configuration
│   │   └── types.ts            # API types
│   ├── utils/                   # Helper functions
│   │   ├── cn.ts               # className utility
│   │   └── formatters.ts       # Currency, date formatters
│   └── constants.ts             # App constants
│
├── components/                  # Shared UI components
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       └── skeleton.tsx
│
└── providers/                   # React Context providers
    └── query-provider.tsx       # React Query setup
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Validation**: Zod

## 📦 Installation

1. **Install dependencies**:
```bash
yarn install
```

2. **Set up environment variables**:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

3. **Run the development server**:
```bash
yarn dev
```

4. **Open your browser**:
Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api/v1` |

### API Configuration

Edit `src/lib/api/config.ts` to modify:
- Request timeout
- Default headers
- API endpoints

## 🎯 Usage

### Accessing a Store

**Path-based routing** (current implementation):
```
http://localhost:3000/store/{STORE_CODE}
```

Example:
```
http://localhost:3000/store/ABC123
```

**Subdomain routing** (future):
```
http://{STORE_CODE}.yourdomain.com
```

### Testing

Test with example stores:
- `/store/DEMO` - Demo store
- `/store/TEST` - Test store

## 🏗️ Development Guide

### Adding New Features

#### 1. Create Feature Module

```
src/features/your-feature/
├── api/
│   ├── get-data.ts
│   └── queries.ts
├── components/
│   └── your-component.tsx
├── types/
│   └── your-feature.types.ts
└── utils/
    └── helpers.ts
```

#### 2. Add API Endpoint

In `src/lib/api/config.ts`:
```typescript
export const endpoints = {
  // ... existing endpoints
  yourFeature: {
    list: () => `/your-endpoint`,
    get: (id: string) => `/your-endpoint/${id}`,
  },
} as const;
```

#### 3. Create Types

In `src/features/your-feature/types/your-feature.types.ts`:
```typescript
export interface YourDataDto {
  id: string;
  name: string;
  // ... other fields
}
```

#### 4. Create Server Action

In `src/features/your-feature/api/get-data.ts`:
```typescript
'use server';

import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { YourDataDto } from '../types/your-feature.types';

export async function getData(): Promise<YourDataDto> {
  return apiClient.get<YourDataDto>(endpoints.yourFeature.list());
}
```

#### 5. Create React Query Hook (for client components)

In `src/features/your-feature/api/queries.ts`:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/config';
import { YourDataDto } from '../types/your-feature.types';

export function useYourData() {
  return useQuery({
    queryKey: ['your-data'],
    queryFn: () => apiClient.get<YourDataDto>(endpoints.yourFeature.list()),
  });
}
```

#### 6. Create Component

In `src/features/your-feature/components/your-component.tsx`:
```typescript
import { YourDataDto } from '../types/your-feature.types';

interface YourComponentProps {
  data: YourDataDto;
}

export function YourComponent({ data }: YourComponentProps) {
  return (
    <div>
      <h2>{data.name}</h2>
    </div>
  );
}
```

#### 7. Use in Page (Server Component)

```typescript
import { getData } from '@/features/your-feature/api/get-data';
import { YourComponent } from '@/features/your-feature/components/your-component';

export default async function YourPage() {
  const data = await getData();
  
  return <YourComponent data={data} />;
}
```

### Adding UI Components

Use shadcn/ui CLI to add components:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### Code Style Guidelines

1. **Use Server Components by default**
   - Only add `'use client'` when needed for interactivity
   - Server Components are faster and more SEO-friendly

2. **Type everything**
   - No `any` or `unknown` types
   - Create interfaces for all data structures

3. **Error Handling**
   - Always handle errors gracefully
   - Provide user-friendly error messages
   - Use try-catch in server actions

4. **File Naming**
   - Use kebab-case for files: `store-header.tsx`
   - Use PascalCase for components: `StoreHeader`
   - Use camelCase for functions: `getStoreByCode`

5. **Component Structure**
   ```typescript
   // 1. Imports
   import { ... } from '...';
   
   // 2. Types/Interfaces
   interface ComponentProps {
     // ...
   }
   
   // 3. Component
   export function Component({ props }: ComponentProps) {
     // 4. Hooks
     // 5. Handlers
     // 6. Render
     return (
       // JSX
     );
   }
   ```

## 🐛 Debugging

### Common Issues

**1. API Connection Error**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running
- Check CORS settings on backend

**2. Store Not Found**
- Verify store code exists in backend
- Check store status is ACTIVE
- Review browser console for errors

**3. Build Errors**
- Run `yarn build` to check for TypeScript errors
- Fix all linting errors before deployment

### Development Tools

- **React DevTools**: Inspect component tree
- **Network Tab**: Monitor API calls
- **Console**: Check for errors and warnings

## 📝 Best Practices

1. **Performance**
   - Use `next/image` for all images
   - Implement lazy loading for below-fold content
   - Minimize client-side JavaScript

2. **SEO**
   - Use `generateMetadata()` for dynamic meta tags
   - Implement proper heading hierarchy
   - Add alt text to all images

3. **Accessibility**
   - Use semantic HTML
   - Ensure keyboard navigation works
   - Add ARIA labels where needed

4. **Security**
   - Never expose sensitive data in client components
   - Validate all user inputs
   - Use environment variables for secrets

## 🚢 Deployment

### Build for Production

```bash
yarn build
```

### Start Production Server

```bash
yarn start
```

### Environment Variables

Ensure all required environment variables are set in your production environment.

## 📚 Next Steps (Phase 2)

- [ ] Products listing page
- [ ] Product detail page
- [ ] Search functionality
- [ ] Category filtering
- [ ] Shopping cart
- [ ] Checkout flow

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private - All rights reserved
