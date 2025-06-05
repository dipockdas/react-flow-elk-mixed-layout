# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React Flow example demonstrating ELK.js automatic layout algorithms. The project structure:

- **App.tsx** - Main React Flow component with ELK.js integration for automatic graph layout
- **initialElements.js** - Defines the initial nodes and edges for the graph
- **index.tsx** - Application entry point
- **styles.css** - Global styles
- **xy-theme.css** - React Flow theming

### Key Architecture Patterns

The application uses ELK.js (Eclipse Layout Kernel) to automatically position nodes in a graph:

1. **Layout Engine**: ELK.js provides advanced graph layout algorithms configured in `elkOptions`
2. **Layout Function**: `getLayoutedElements()` transforms React Flow nodes/edges into ELK format, runs layout, then converts back
3. **Dynamic Layouts**: Users can switch between vertical (`DOWN`) and horizontal (`RIGHT`) layouts via panel buttons
4. **React Flow Integration**: Uses `@xyflow/react` hooks (`useNodesState`, `useEdgesState`, `useReactFlow`) for state management

### Dependencies

- **@xyflow/react** - React Flow library for node-based graphs
- **elkjs** - Eclipse Layout Kernel for automatic graph layout
- **React 18** with TypeScript
- **Vite** for build tooling