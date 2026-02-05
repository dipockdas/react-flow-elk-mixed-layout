// initialElements.js

export const initialNodes = [
  // Top-level containers
  { 
    id: 'vpc-1', 
    type: 'default', 
    data: { label: 'VPC' }, 
    nodeType: 'vpc', 
    position: { x: 0, y: 0 }, 
    style: { 
      // Style remains the same
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
      padding: '8px 12px', fontSize: '14px', fontWeight: 'bold',
      backgroundColor: 'rgba(26, 120, 186, 0.1)', border: '2px solid #1a78ba'
    },
    layoutOptions: {
      // NEW: Tell the VPC to arrange its children (the subnets) horizontally
      'elk.direction': 'RIGHT', 
      'org.eclipse.elk.layered.spacing.borderToNode': '30',
      'elk.padding': '[top=40,left=15,bottom=15,right=15]'
    }
  },

  // --- SUBNET A ---
  { 
    id: 'subnet-1', 
    type: 'default', 
    data: { label: 'Subnet A (Horizontal)' }, 
    nodeType: 'subnet', 
    parentNode: 'vpc-1', 
    position: { x: 0, y: 0 }, 
    style: { 
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
      padding: '8px 12px', fontSize: '12px', fontWeight: 'bold',
      backgroundColor: 'rgba(26, 186, 137, 0.1)', border: '2px solid #1aba89'
    },
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '70',
      'org.eclipse.elk.layered.spacing.borderToNode': '25',
      'elk.padding': '[top=35,left=15,bottom=15,right=15]',
      'org.eclipse.elk.layered.alignment': 'TOP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
    },
    extent: 'parent'
  },
  // Nodes for Subnet A
  { id: 'ec2-1', type: 'custom', data: { label: 'EC2 Instance 1' }, nodeType: 'ec2', parentNode: 'subnet-1', position: { x: 0, y: 0 }, extent: 'parent' },
  { id: 'ec2-2', type: 'custom', data: { label: 'EC2 Instance 2' }, nodeType: 'ec2', parentNode: 'subnet-1', position: { x: 0, y: 0 }, extent: 'parent' },
  { id: 'rds-1', type: 'default', data: { label: 'RDS Database' }, nodeType: 'rds', parentNode: 'subnet-1', position: { x: 0, y: 0 }, extent: 'parent' },

  // --- NEW: SUBNET B ---
  { 
    id: 'subnet-b-1', 
    type: 'default', 
    data: { label: 'Subnet B (Horizontal)' }, 
    nodeType: 'subnet', 
    parentNode: 'vpc-1', 
    position: { x: 0, y: 0 }, 
    style: {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
      padding: '8px 12px', fontSize: '12px', fontWeight: 'bold',
      backgroundColor: 'rgba(26, 186, 137, 0.1)', border: '2px solid #1aba89'
    },
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '70',
      'org.eclipse.elk.layered.spacing.borderToNode': '25',
      'elk.padding': '[top=35,left=15,bottom=15,right=15]',
      'org.eclipse.elk.layered.alignment': 'TOP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
    },
    extent: 'parent'
  },
  // Nodes for Subnet B
  { id: 'ec2-b-1', type: 'custom', data: { label: 'EC2 Instance 1' }, nodeType: 'ec2', parentNode: 'subnet-b-1', position: { x: 0, y: 0 }, extent: 'parent' },
  { id: 'ec2-b-2', type: 'custom', data: { label: 'EC2 Instance 2' }, nodeType: 'ec2', parentNode: 'subnet-b-1', position: { x: 0, y: 0 }, extent: 'parent' },
  { id: 'ec2-b-3', type: 'custom', data: { label: 'EC2 Instance 3' }, nodeType: 'ec2', parentNode: 'subnet-b-1', position: { x: 0, y: 0 }, extent: 'parent' },
  { id: 's3-1', type: 'default', data: { label: 'S3 Bucket' }, nodeType: 's3', parentNode: 'subnet-b-1', position: { x: 0, y: 0 }, extent: 'parent' },
  
  // An external node
  { id: 'user', type: 'default', data: { label: 'End User' }, nodeType: 'user', position: { x: 0, y: 0 } },
];

export const initialEdges = [
  // Top-level connection
  { id: 'user-to-vpc', source: 'user', target: 'vpc-1' },
  
  // --- EDGES FOR SUBNET A ---
  { 
    id: 'ec2-1-to-ec2-2', 
    source: 'ec2-1', 
    target: 'ec2-2',
    sourceHandle: 'right', 
    targetHandle: 'left',
    type: 'straight' 
  },
  { 
    id: 'ec2-2-to-rds', 
    source: 'ec2-2', 
    target: 'rds-1',
    sourceHandle: 'bottom', 
    targetHandle: null,
    type: 'smoothstep'
  },

  // --- NEW: EDGES FOR SUBNET B ---
  { 
    id: 'ec2-b1-to-ec2-b2', 
    source: 'ec2-b-1', 
    target: 'ec2-b-2',
    sourceHandle: 'right', 
    targetHandle: 'left',
    type: 'straight' 
  },
  { 
    id: 'ec2-b2-to-ec2-b3', 
    source: 'ec2-b-2', 
    target: 'ec2-b-3',
    sourceHandle: 'right', 
    targetHandle: 'left',
    type: 'straight' 
  },
  { 
    id: 'ec2-b3-to-s3', 
    source: 'ec2-b-3', 
    target: 's3-1',
    sourceHandle: 'bottom', 
    targetHandle: null,
    type: 'smoothstep'
  }
];