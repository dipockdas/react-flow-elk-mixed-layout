# React Flow ELK.js Mixed Layout Demo

This project demonstrates advanced hierarchical layouts using React Flow and ELK.js, featuring mixed vertical and horizontal node arrangements with parent-child relationships.

## Features

- **Mixed Layout Support**: Combines vertical top-level flow with horizontal child layouts within parent nodes
- **Dynamic Parent Sizing**: Parent nodes automatically resize based on their children's space requirements
- **Hierarchical Layout Algorithm**: Two-phase layout process that first calculates child layouts, then positions parents
- **Interactive Controls**: Switch between vertical, horizontal, and mixed layout modes
- **Parent-Child Relationships**: Child nodes are contained within and positioned relative to their parent nodes

## Architecture

### Layout Algorithm

The implementation uses a sophisticated two-phase layout process:

1. **Phase 1**: Layout children inside each parent using their specific `layoutOptions`
2. **Phase 2**: Calculate parent dimensions based on actual child space requirements  
3. **Phase 3**: Layout top-level nodes with correctly sized parents

### Key Components

- **App.tsx**: Main React Flow component with enhanced ELK.js integration
- **initialElements.js**: Defines hierarchical node structure with parent-child relationships
- **getLayoutedElements()**: Core layout function handling mixed layouts

### Node Structure

```javascript
// Parent Node with layout options for children
{
  id: 'A',
  layoutOptions: {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',  // Horizontal layout for children
    'elk.spacing.nodeNode': '50',
  },
}

// Child Node
{
  id: 'A-1',
  parentNode: 'A',           // References parent
  extent: 'parent',          // Constrained to parent bounds
}
```

## Development

### Prerequisites

- Node.js (v18+)
- Yarn or npm

### Installation

```bash
yarn install
```

### Development Server

```bash
yarn dev
```

Visit `http://localhost:5173` to see the demo.

### Build

```bash
yarn build
```

## Usage

1. **Vertical Layout**: Arranges top-level nodes in a vertical flow
2. **Horizontal Layout**: Arranges top-level nodes in a horizontal flow  
3. **Mixed Layout (Reset)**: Returns to the hierarchical mixed layout with:
   - Vertical flow: B → A → C → (D, E)
   - Horizontal children: A-1 → A-2 → A-3 inside parent A

## Technical Implementation

### Dynamic Parent Sizing

Parents automatically calculate their required dimensions:

```javascript
const requiredWidth = Math.max(200, (maxX - minX) + (padding * 2));
const requiredHeight = Math.max(100, (maxY - minY) + headerHeight + (padding * 2));
```

### Child Positioning

Children are positioned with proper padding and header space:

```javascript
x: child.x - minX + padding,
y: child.y - minY + headerHeight + (padding / 2),
```

### Edge Routing

Handles both parent-level and child-level edges:
- Parent edges: Vertical connections between main flow nodes
- Child edges: Horizontal connections within parent containers

## Dependencies

- **@xyflow/react**: React Flow library for interactive node graphs
- **elkjs**: Eclipse Layout Kernel for automatic graph layout algorithms
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server

## License

MIT