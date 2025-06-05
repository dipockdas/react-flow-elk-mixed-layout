// initialElements.js

export const initialNodes = [
  // Parent Node
  {
    id: 'A',
    type: 'default',
    data: { label: 'Parent Node (Horizontal)' },
    position: { x: 0, y: 0 },
    // A parent node needs a style with dimensions for ELK
    style: {
      width: 450,
      height: 150,
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      border: '1px solid red',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    // Add layout options for the children of this node
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '50',
    },
  },

  // Child nodes of Parent A
  {
    id: 'A-1',
    type: 'input',
    data: { label: 'Child 1' },
    position: { x: 0, y: 0 },
    parentNode: 'A',
    extent: 'parent',
  },
  {
    id: 'A-2',
    data: { label: 'Child 2' },
    position: { x: 0, y: 0 },
    parentNode: 'A',
    extent: 'parent',
  },
  {
    id: 'A-3',
    type: 'output',
    data: { label: 'Child 3' },
    position: { x: 0, y: 0 },
    parentNode: 'A',
    extent: 'parent',
  },

  // Other nodes at the top level
  {
    id: 'B',
    type: 'input',
    data: { label: 'Start Node' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'C',
    data: { label: 'Middle Node' },
    position: { x: 0, y: 0 },
  },
  {
    id: 'D',
    type: 'output',
    data: { label: 'End Node 1' },
    position: { x: 0, y: 0 },
  },
    {
    id: 'E',
    type: 'output',
    data: { label: 'End Node 2' },
    position: { x: 0, y: 0 },
  },
];

export const initialEdges = [
  // Connections for the main vertical layout
  { id: 'b-a', source: 'B', target: 'A' },
  { id: 'a-c', source: 'A', target: 'C' },
  { id: 'c-d', source: 'C', target: 'D' },
  { id: 'c-e', source: 'C', target: 'E' },

  // Connections for the horizontal children inside Parent A
  { id: 'a1-a2', source: 'A-1', target: 'A-2', type: 'smoothstep' },
  { id: 'a2-a3', source: 'A-2', target: 'A-3', type: 'smoothstep' },
];
