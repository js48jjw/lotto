# AGENTS.md - Development Guide for AI Agents

This document provides essential context for AI agents operating in this repository.

## Project Overview

This is a **Next.js 16** lottery number generator application (Korean: 럭키가이/Lucky Guy). It generates random 6+1 lotto numbers with visual effects (lightning, sparkles, animations).

- **Framework**: Next.js 16.1.6 (Turbopack)
- **React**: 19.0.1
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4
- **Package Manager**: npm

---

## Build & Development Commands

| Command | Description |
|---------|-------------|| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

**Note**: No test framework is currently configured. Do not write tests unless explicitly requested.

---

## Code Style Guidelines

### Imports & Path Aliases

- Use path alias `@/*` for internal imports (e.g., `@/components/ui/lightning`)
- Order imports: external libraries → internal modules → types
- Use explicit type imports: `import { type Foo } from "bar"`

```typescript
// Good
import React, { useState, useEffect } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";
import type { LightningProps } from "./types";

// Avoid
import SparklesCore from "@/components/ui/sparkles";  // named export expected
```

### TypeScript

- **Strict mode** is enabled in tsconfig.json
- Always declare types for function parameters and return values
- Use interfaces for component props, types for unions/enums
- Never use `any` - use `unknown` if type is truly unknown
- Do NOT use `@ts-ignore`, `@ts-expect-error`, or `as any`

```typescript
// Good
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const Button: FC<ButtonProps> = ({ variant = "primary", children }) => {
  return <button className={cn(variant)}>{children}</button>;
};

// Avoid
const Button = ({ variant }) => <button>{variant}</button>;  // no types
```

### Component Patterns

- Use **named exports** for components (preferred) or **default exports** for page components
- Use `"use client"` directive at the top of client-side components
- Use `React.FC` or explicit function signatures for typed components
- Define prop interfaces above the component

```typescript
"use client"

import React, { useRef, useEffect } from "react";

interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
}

export const Lightning: React.FC<LightningProps> = ({ 
  hue = 230, 
  xOffset = 0, 
  speed = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ...
};
```

### CSS & Tailwind

- Use Tailwind CSS utility classes for styling
- Use the `cn()` utility (from `@/lib/utils`) for conditional classes
- Custom fonts configured: `font-blackhan` (Black Han Sans), `font-pretendard` (Pretendard)
- Tailwind color palette: standard colors (cyan, blue, gray, etc.)

```typescript
// Using cn() utility
import { cn } from "@/lib/utils";

<button className={cn(
  "bg-gradient-to-r from-cyan-500 to-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

### Error Handling

- Always handle potential errors in effects and async operations
- Use proper cleanup in useEffect (return cleanup function)
- Handle null/undefined cases explicitly

```typescript
// Good
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  // ... work with canvas
  
  return () => {
    // cleanup
  };
}, [deps]);

// Avoid
useEffect(() => {
  canvasRef.current.width = 100;  // may be null
}, []);
```

### Naming Conventions

- **Components**: PascalCase (e.g., `Lightning`, `SparklesCore`)
- **Functions/variables**: camelCase (e.g., `generateLottoNumbers`, `isGenerating`)
- **Files**: kebab-case for components (e.g., `lightning.tsx`), camelCase for utilities (e.g., `utils.ts`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `LightningProps`)

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Main lotto generator page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── lightning.tsx
│   │   ├── sparkles.tsx
│   │   ├── text-shimmer.tsx
│   │   └── demo.tsx
│   └── vapour-text-effect.tsx
└── lib/
    └── utils.ts            # cn() utility function
```

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Strict TypeScript, path aliases (`@/*` → `./src/*`) |
| `eslint.config.mjs` | Next.js + TypeScript ESLint config |
| `tailwind.config.mjs` | Custom font families |
| `next.config.ts` | Next.js configuration |

---

## Important Notes

1. **Korean comments**: Some code contains Korean comments (e.g., `// 번개화면 대기 진입 시 10초 후 안내 표시`) - preserve them.
2. **WebGL components**: The `Lightning` component uses WebGL - be careful with canvas/WebGL code changes.
3. **Audio**: Audio files are loaded from `/sound/` directory.
4. **Service Worker**: Registered in `page.tsx` for PWA capabilities.
5. **Kakao Ads**: Ad frames are embedded via iframes - do not modify ad unit IDs.
