# Project Structure & Organization

## Root Directory

```
├── app/                    # Next.js App Router pages and layouts
├── components/             # Reusable React components
├── lib/                    # Utility functions and helpers
├── public/                 # Static assets
├── .kiro/                  # Kiro IDE configuration and steering
├── .next/                  # Next.js build output (auto-generated)
├── node_modules/           # Dependencies (auto-generated)
└── Configuration files
```

## App Directory (`/app`)

- **layout.tsx**: Root layout with fonts and global styles
- **page.tsx**: Main composer interface (unified studio)
- **globals.css**: Global CSS styles and Tailwind imports
- **favicon.ico**: Site favicon

### API Routes (`/app/api`)

- **gemini/**: Gemini 2.5 Flash endpoints
  - `generate/route.ts`: Image generation
  - `edit/route.ts`: Image editing and composition
- **imagen/**: Imagen 4 endpoints
  - `generate/route.ts`: High-quality image generation
- **veo/**: Veo 3 video endpoints
  - `generate/route.ts`: Video generation
  - `operation/route.ts`: Status checking
  - `download/route.ts`: Video download

### Pages (`/app`)

- **home-copy/**: Alternative home page implementation
- **review/**: Brand identity showcase with AI editing

## Components Directory (`/components`)

### UI Components (`/components/ui`)

- **Composer.tsx**: Main interface for all generation modes
- **VideoPlayer.tsx**: Custom video player with trimming
- **ModelSelector.tsx**: Dynamic model selection component
- **Button.tsx**: Reusable button component
- **Input.tsx**: Form input components
- **Card.tsx**: Card layout components

### Feature Components (`/components`)

- **StarRating.tsx**: User feedback rating system
- **CommentSection.tsx**: Community feedback interface

### Design System (`/components/figma`)

- Figma-exported components and design tokens

## Library Directory (`/lib`)

- **utils.ts**: General utility functions (cn, clsx helpers)
- **imageUtils.ts**: Image processing and compression utilities

## Configuration Files

- **package.json**: Dependencies and scripts
- **pnpm-lock.yaml**: pnpm lock file (replaces package-lock.json)
- **tsconfig.json**: TypeScript configuration
- **next.config.ts**: Next.js configuration
- **tailwind.config.js**: Tailwind CSS configuration
- **postcss.config.mjs**: PostCSS configuration
- **eslint.config.mjs**: ESLint configuration
- **components.json**: Shadcn/ui component configuration

## Kiro Configuration (`/.kiro`)

### Steering Files (`/.kiro/steering`)

- **project-overview.md**: Application purpose and features
- **tech.md**: Technology stack and dependencies
- **structure.md**: This file - project organization
- **gemini-api-improvements.md**: API reliability enhancements
- **error-handling.md**: Error handling best practices

## Static Assets (`/public`)

- **compose.png**: Compose mode icon
- **edit.png**: Edit mode icon
- **video.png**: Video mode icon

## File Naming Conventions

- **Components**: PascalCase (e.g., `VideoPlayer.tsx`)
- **Pages**: lowercase with hyphens (e.g., `home-copy/`)
- **API Routes**: lowercase with `route.ts` suffix
- **Utilities**: camelCase (e.g., `imageUtils.ts`)
- **Configuration**: lowercase with appropriate extensions

## Import Patterns

- **Absolute imports**: Use `@/` prefix for project root
- **Component imports**: Group by type (UI, features, external)
- **Type imports**: Use `import type` for TypeScript types
- **API imports**: Centralized in respective route files

## Development Workflow

1. **Pages**: Add new pages in `/app` directory
2. **Components**: Create in `/components` with proper categorization
3. **API Routes**: Follow existing pattern in `/app/api`
4. **Utilities**: Add to `/lib` with appropriate naming
5. **Styling**: Use Tailwind classes with component-level organization
