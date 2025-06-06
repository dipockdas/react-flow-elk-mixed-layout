import { initialNodes, initialEdges } from './initialElements.js';
import ELK from 'elkjs/lib/elk.bundled.js';
import React, { useCallback, useLayoutEffect, useState, useEffect } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const elk = new ELK();

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

const getLayoutedElements = async (nodes, edges, options = {}, rules = null) => {
  // Helper function to calculate label height based on node type
  const getLabelHeight = (originalNode) => {
    if (!originalNode) return 0;
    
    const nodeType = originalNode.nodeType;
    const style = originalNode.style || {};
    
    // Calculate label height based on font size and padding
    if (nodeType === 'vpc') {
      const fontSize = parseInt(style.fontSize) || 14;
      const topPadding = parseInt(style.padding?.split(' ')[0]) || 8;
      return fontSize + topPadding + 5; // Extra spacing below label
    } else if (nodeType === 'subnet') {
      const fontSize = parseInt(style.fontSize) || 12;
      const topPadding = parseInt(style.padding?.split(' ')[0]) || 8;
      return fontSize + topPadding + 5; // Extra spacing below label
    } else if (nodeType === 'group') {
      return 25; // Default spacing for invisible group nodes
    }
    
    return 0; // Leaf nodes don't need label offset for their children
  };

  // == PHASE 1: GRAPH TRANSFORMATION ==
  // Create copies of nodes and edges to modify
  let transformedNodes = [...nodes];
  let transformedEdges = [...edges];
  
  // Create a Map of nodes for easy lookup by ID
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const nodeTypeMap = new Map(nodes.map(node => [node.id, node.nodeType]));
  
  // If rules exist, iterate through the rules and edges
  if (rules && rules.layoutRules) {
    const processedPairs = new Set();
    const groupedNodeIds = new Set();
    
    for (const edge of edges) {
      const sourceType = nodeTypeMap.get(edge.source);
      const targetType = nodeTypeMap.get(edge.target);
      
      // For any edge that matches a 'CREATE_VERTICAL_GROUP' rule
      for (const rule of rules.layoutRules) {
        if (rule.trigger?.edge?.sourceType === sourceType && 
            rule.trigger?.edge?.targetType === targetType &&
            rule.action === 'CREATE_VERTICAL_GROUP') {
          
          const pairKey = `${edge.source}-${edge.target}`;
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);
          
          // Skip if either node is already in a group
          if (groupedNodeIds.has(edge.source) || groupedNodeIds.has(edge.target)) {
            continue;
          }
          
          // a. Identify the source and target nodes
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          
          if (sourceNode && targetNode) {
            // Add their IDs to the set to prevent multiple grouping
            groupedNodeIds.add(sourceNode.id);
            groupedNodeIds.add(targetNode.id);
            
            // b. CRITICAL: Identify the parent of the source node
            const originalParent = sourceNode.parentNode;
            
            // c. Create a new "group" node object with unique ID
            const groupId = `group-${edge.source}-${edge.target}`;
            
            // d. Set its parentNode property to the ID of the original parent
            // e. Give this group node its own layoutOptions for vertical layout
            const groupNode = {
              id: groupId,
              type: 'default',
              data: { label: '' },
              nodeType: 'group',
              parentNode: originalParent, // This will be subnet-1, making it a sibling of ec2-1
              position: { x: 0, y: 0 },
              style: {
                backgroundColor: 'transparent',
                border: 'none',
                width: 120,  // Give it some width to participate in horizontal layout
                height: 140, // Height for both EC2 and RDS
                opacity: 0,
              },
              layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'DOWN', // Vertical layout within this group
                'elk.spacing.nodeNode': '20',
                'elk.padding': '[top=5,left=0,bottom=5,right=5]', // No left padding so ec2-2 is at group edge
              },
            };
            
            // f. Add the new group node to transformedNodes array
            transformedNodes.push(groupNode);
            
            // g. Update the original source and target nodes by changing their parentNode to the new group's ID
            transformedNodes = transformedNodes.map(node => {
              if (node.id === edge.source) {
                return { ...node, parentNode: groupId, extent: 'parent' };
              }
              if (node.id === edge.target) {
                return { ...node, parentNode: groupId, extent: 'parent' };
              }
              return node;
            });
            
            // h. Rewire external edges (only edges from completely different parents)
            transformedEdges = transformedEdges.map(e => {
              // Skip the rule-triggering edge itself
              if (e.id === edge.id) {
                return e;
              }
              
              // Get the parent nodes of the edge's source and target
              const edgeSourceNode = nodeMap.get(e.source);
              const edgeTargetNode = nodeMap.get(e.target);
              
              // Check if this edge connects to a node that's now in our group
              const connectsToGroupedNode = e.target === edge.source || e.target === edge.target;
              const connectsFromGroupedNode = e.source === edge.source || e.source === edge.target;
              
              // If an external node connects TO one of our grouped nodes, redirect to group
              if (connectsToGroupedNode && (e.source !== edge.source && e.source !== edge.target)) {
                return { ...e, target: groupId };
              }
              
              // If one of our grouped nodes connects TO an external node, redirect from group  
              if (connectsFromGroupedNode && (e.target !== edge.source && e.target !== edge.target)) {
                return { ...e, source: groupId };
              }
              
              return e;
            });
          }
        }
      }
    }
  }
  
  // == PHASE 2: BUILD HIERARCHY FOR ELK ==
  // Create an empty array elkNodes and a Map elkNodeMap
  const elkNodes = [];
  const elkNodeMap = new Map();
  
  // 1. First Pass: Create basic ELK-compatible objects
  transformedNodes.forEach(node => {
    const nodeIsParent = node.nodeType === 'vpc' || node.nodeType === 'subnet';
    const elkNode = {
      id: node.id,
      // CRITICAL: Only assign dimensions to non-parent nodes.
      // Let ELK calculate the size for parent containers.
      ...(nodeIsParent ? {} : {
        width: node.style?.width || 150,
        height: node.style?.height || 50,
      }),
      layoutOptions: nodeIsParent ? {
        // Preserve ALL original layout options from the node
        ...(node.layoutOptions || {}),
        // Add proper padding for parent containers
        'elk.padding': '[top=35,left=15,bottom=15,right=15]',
        // Ensure we have spacing
        'elk.spacing.nodeNode': node.layoutOptions?.['elk.spacing.nodeNode'] || '70',
      } : (node.layoutOptions || {}),
      children: []
    };
    elkNodeMap.set(node.id, elkNode);
  });
  
  // 2. Second Pass: Build parent-child relationships
  transformedNodes.forEach(node => {
    const elkNode = elkNodeMap.get(node.id);
    
    if (node.parentNode) {
      // If a node has a parentNode, add it to the parent's children array
      const parentElkNode = elkNodeMap.get(node.parentNode);
      if (parentElkNode) {
        parentElkNode.children.push(elkNode);
      }
    } else {
      // If a node does not have a parentNode, add it to root elkNodes array
      elkNodes.push(elkNode);
    }
  });
  
  // Create the final graph object for ELK
  const graph = {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': options.direction || 'DOWN', // Apply global direction here
    },
    children: elkNodes,
    edges: transformedEdges,
  };
  
  // == PHASE 3: LAYOUT AND FLATTEN ==
  // Debug: Log edges after rewiring
  console.log('Edges after transformation:', transformedEdges.map(e => `${e.id}: ${e.source} → ${e.target}`));
  
  // Call ELK
  const layoutedGraph = await elk.layout(graph);
  
  // Debug: Log final edges
  console.log('Final edges from ELK:', layoutedGraph.edges.map(e => `${e.id}: ${e.source} → ${e.target}`));
  
  // Create an empty array to store the final result
  const flattenedNodes = [];

  // Define a recursive function flatten
  const flatten = (elkNode, parentPosition = { x: 0, y: 0 }, parentElkNode = null) => {
    // a. Calculate the node's absolute position
    let absolutePosition = {
      x: parentPosition.x + elkNode.x,
      y: parentPosition.y + elkNode.y
    };
    
    // ELK padding already accounts for label space, so no manual adjustment needed
    
    // b. Find the original node data from initial nodes array
    const originalNode = nodes.find(n => n.id === elkNode.id) || 
                         transformedNodes.find(n => n.id === elkNode.id);

    // c. Push a final node object to flattenedNodes
    if (originalNode) {
      flattenedNodes.push({
        ...originalNode,
        position: absolutePosition,
        // CRITICAL: Use ELK's calculated dimensions for rendering
        style: {
          ...originalNode.style,
          width: elkNode.width,
          height: elkNode.height,
        },
        // Don't set sourcePosition/targetPosition on nodes - will be set per edge
      });
    }
    
    // d. If the elkNode has children, recursively call flatten for each child
    if (elkNode.children && elkNode.children.length > 0) {
      // Pass the current elkNode as the parent for the next level
      elkNode.children.forEach(child => {
        flatten(child, absolutePosition, elkNode);
      });
    }
  };
  
  // Start the process by calling flatten for each node in layoutedGraph.children
  layoutedGraph.children.forEach(node => {
    // Pass the root graph itself as the initial "parent" to get the global direction
    flatten(node, { x: 0, y: 0 }, layoutedGraph);
  });
  
  // Set sourcePosition and targetPosition on nodes based on their connections
  const processedEdges = layoutedGraph.edges.map(edge => {
    const sourceNode = flattenedNodes.find(n => n.id === edge.source);
    const targetNode = flattenedNodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return edge;
    
    // Calculate the actual distance between nodes
    const deltaX = Math.abs(targetNode.position.x - sourceNode.position.x);
    const deltaY = Math.abs(targetNode.position.y - sourceNode.position.y);
    
    const isHorizontalConnection = deltaX > deltaY;
    
    if (isHorizontalConnection) {
      // For horizontal connections, determine left-to-right flow
      const sourceIsLeft = sourceNode.position.x < targetNode.position.x;
      
      // Set handle positions on the nodes themselves
      sourceNode.sourcePosition = sourceIsLeft ? 'right' : 'left';
      targetNode.targetPosition = sourceIsLeft ? 'left' : 'right';
      
      console.log(`Setting node positions for ${edge.id}: source(${sourceNode.id}).sourcePosition = ${sourceNode.sourcePosition}, target(${targetNode.id}).targetPosition = ${targetNode.targetPosition}`);
    } else {
      // For vertical connections, determine top-to-bottom flow
      const sourceIsAbove = sourceNode.position.y < targetNode.position.y;
      sourceNode.sourcePosition = sourceIsAbove ? 'bottom' : 'top';
      targetNode.targetPosition = sourceIsAbove ? 'top' : 'bottom';
    }
    
    return edge;
  });
  
  // Return the final result
  return {
    nodes: flattenedNodes,
    edges: processedEdges
  };
};

function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutRules, setLayoutRules] = useState(null);
  const { fitView } = useReactFlow();

  // Fetch layout rules on component mount
  useEffect(() => {
    fetch('/layoutRules.json')
      .then(res => res.json())
      .then(rules => {
        setLayoutRules(rules);
      })
      .catch(console.error);
  }, []);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = useInitialNodes ? initialNodes : nodes;
      const es = useInitialNodes ? initialEdges : edges;

      getLayoutedElements(ns, es, opts, layoutRules).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          setTimeout(() => {
            fitView({ padding: 0.1 });
          }, 100);
        },
      );
    },
    [nodes, edges, layoutRules],
  );

  // Calculate the initial layout after rules are loaded
  useLayoutEffect(() => {
    if (layoutRules) {
      onLayout({ direction: 'DOWN', useInitialNodes: true });
    }
  }, [layoutRules]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onConnect={onConnect}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      style={{ backgroundColor: '#F7F9FB' }}
    >
      <Background />
    </ReactFlow>
  );
}

export default () => (
  <ReactFlowProvider>
    <LayoutFlow />
  </ReactFlowProvider>
);
