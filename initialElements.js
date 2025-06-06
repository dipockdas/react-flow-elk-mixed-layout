// initialElements.js

export const initialNodes = [
  // Top-level containers
  { id: 'vpc-1', type: 'default', data: { label: 'VPC' }, nodeType: 'vpc', position: { x: 0, y: 0 }, style: { 
    width: 600, 
    height: 400,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(26, 120, 186, 0.1)',
    border: '2px solid #1a78ba'
  } },
  { id: 'subnet-1', type: 'default', data: { label: 'Subnet A (Horizontal)' }, nodeType: 'subnet', parentNode: 'vpc-1', position: { x: 0, y: 0 }, style: { 
    width: 500, 
    height: 250,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(26, 186, 137, 0.1)',
    border: '2px solid #1aba89'
  },
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '70',
    },
  },

  // Nodes within the subnet
  { id: 'ec2-1', data: { label: 'EC2 Instance 1' }, nodeType: 'ec2', parentNode: 'subnet-1', position: { x: 0, y: 0 }, style: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 'normal',
    backgroundColor: 'rgba(255, 153, 0, 0.2)',
    border: '1px solid #ff9900'
  } },
  { id: 'ec2-2', data: { label: 'EC2 Instance 2' }, nodeType: 'ec2', parentNode: 'subnet-1', position: { x: 0, y: 0 }, style: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 'normal',
    backgroundColor: 'rgba(255, 153, 0, 0.2)',
    border: '1px solid #ff9900'
  } },
  { id: 'rds-1', data: { label: 'RDS Database' }, nodeType: 'rds', parentNode: 'subnet-1', position: { x: 0, y: 0 }, style: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 'normal',
    backgroundColor: 'rgba(153, 51, 204, 0.2)',
    border: '1px solid #9933cc'
  } },
  
  // An external node
  { id: 'user', data: { label: 'End User' }, nodeType: 'user', position: { x: 0, y: 0 }, style: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 'normal',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    border: '1px solid #808080'
  } },
];

export const initialEdges = [
  // Connection from the outside world to the VPC
  { id: 'user-to-vpc', source: 'user', target: 'vpc-1' },
  
  // This edge will be laid out horizontally inside the subnet
  { id: 'ec2-1-to-ec2-2', source: 'ec2-1', target: 'ec2-2' },
  
  // This edge will trigger our vertical grouping rule
  { id: 'ec2-2-to-rds', source: 'ec2-2', target: 'rds-1' }
];
