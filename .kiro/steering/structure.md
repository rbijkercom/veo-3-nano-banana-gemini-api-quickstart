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

### Tier 1: UI Components (`/components/ui`)

- **button.tsx**: Reusable button component (shadcn/ui)
- **input.tsx**: Form input components (shadcn/ui)
- **card.tsx**: Card layout components (shadcn/ui)
- **badge.tsx**: Badge component (shadcn/ui)
- **separator.tsx**: Separator component (shadcn/ui)
- **skeleton.tsx**: Loading skeleton component (shadcn/ui)
- **tooltip.tsx**: Tooltip component (shadcn/ui)
- **dropzone.tsx**: File dropzone component (shadcn/ui)
- **DebugSection.tsx**: Debug utility component

### Tier 2: Feature Components (`/components/[component-name]/`)

- **star-rating/**: User feedback rating system
  - `index.tsx`: Re-exports
  - `star-rating.tsx`: Main component
- **comment-section/**: Community feedback interface
  - `index.tsx`: Re-exports
  - `comment-section.tsx`: Main component

### Tier 3: Complex Features (`/components/[feature-name]/`)

- **composer/**: Main interface for all generation modes
  - `index.tsx`: Re-exports
  - `composer.tsx`: Complex UI with multiple modes and state management
- **video-player/**: Custom video player with trimming capabilities
  - `index.tsx`: Re-exports
  - `video-player.tsx`: Advanced video controls and trimming logic
- **model-selector/**: Dynamic model selection component
  - `index.tsx`: Re-exports
  - `model-selector.tsx`: Model selection logic

### Design System (`/components/figma`)

- **ImageWithFallback.tsx**: Figma-exported component with fallback logic

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

### Component Architecture (`src/components/`)

The application uses a **three-tier component classification system** that provides clear separation of concerns and consistent patterns for component placement, structure, and documentation.

#### Three-Tier Classification System

##### Tier 1: UI Components (shadcn/ui primitives)

**Location**: `src/components/ui/`
**Purpose**: Basic UI primitives and foundational elements

**Characteristics**:

- shadcn/ui components and basic UI primitives
- No business logic or application-specific functionality
- Highly reusable across different contexts
- Minimal props interface focused on presentation

**Decision Criteria**: Use Tier 1 when the component is a shadcn/ui component, has no business logic, is purely presentational, and can be used in any context without modification.

**File Structure**:

```
src/components/ui/
├── button.tsx              # Component implementation
├── input.tsx               # Component implementation
└── form.tsx                # Component implementation
```

##### Tier 2: Feature Components (Self-contained components)

**Location**: `src/components/[component-name]/`
**Purpose**: Self-contained components with business logic

**Characteristics**:

- Contains business logic specific to the application
- Self-contained within a single component file
- May have sub-components for organization
- Moderate complexity with clear boundaries

**Decision Criteria**: Use Tier 2 when the component has business logic but is self-contained, doesn't require server actions, can be implemented in a single main component file, and has moderate complexity.

**Required File Structure**:

```
src/components/[component-name]/
├── index.tsx                           # Re-exports for clean imports
├── [component-name].tsx                # Main component implementation
```

**Optional Files**:

```
├── [component-name]-[subcomponent].tsx # Sub-components (if needed)
└── [component-name]-context.tsx        # React context (if needed)
```

**Example Structure**:

```
src/components/experience-card/
├── index.tsx                           # Exports ExperienceCard, ExperienceCardHeader, etc.
├── experience-card.tsx                 # Main component with business logic
├── experience-card-header.tsx          # Sub-component
├── experience-card-footer.tsx          # Sub-component
└── experience-card.stories.tsx         # Stories with "UI/" or feature category
```

##### Tier 3: Complex Features (Multi-file features)

**Location**: `src/features/[feature-name]/`
**Purpose**: Complex features requiring multiple supporting files

**Characteristics**:

- Requires multiple supporting files (actions, hooks, schemas, types)
- Complex state management or server interactions
- Form handling with validation
- Multiple related components working together

**Decision Criteria**: Use Tier 3 when the component requires server actions, needs multiple supporting files, has complex state management, involves form handling with validation, or has multiple related components.

#### Component Organization Rules

- **Folder naming**: `kebab-case` (e.g., `arrow-link`, `experience-card`)
- **File naming**: `kebab-case` (e.g., `arrow-link.tsx`)
- **Component names**: `PascalCase` (e.g., `ArrowLink`)
- **Subcomponents**: Prefixed with parent name (e.g., `ExperienceCardHeader`)

#### Decision Flow Chart

Use this decision tree to classify components:

```
Is it a shadcn/ui component?
├── YES → Tier 1 (UI Component)
└── NO → Does it require server actions, multiple files, or complex state?
    ├── YES → Tier 3 (Complex Feature)
    └── NO → Tier 2 (Feature Component)
```

**Note**: Component testing structure is planned but not currently implemented. Test files would be co-located with components when added.
