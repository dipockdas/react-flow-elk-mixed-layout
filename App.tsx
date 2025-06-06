import { initialNodes, initialEdges } from './initialElements.js';
import ELK from 'elkjs/lib/elk.bundled.js';
import React, { useCallback, useLayoutEffect, useState, useEffect } from 'react';
import CustomNode from './CustomNode';
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

// Add this near the top of App.tsx
const nodeTypes = {
  custom: CustomNode,
};

const getLayoutedElements = async (nodes, edges, options = {}, rules = null) => {
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
          
          // Identify the source and target nodes
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          
          if (sourceNode && targetNode) {
            // Add their IDs to the set to prevent multiple grouping
            groupedNodeIds.add(sourceNode.id);
            groupedNodeIds.add(targetNode.id);
            
            // Identify the parent of the source node
            const originalParent = sourceNode.parentNode;
            
            // Create a new "group" node object with unique ID
            const groupId = `group-${edge.source}-${edge.target}`;
            
            // Create the invisible group node
            const groupNode = {
              id: groupId,
              type: 'default',
              data: { label: '' },
              nodeType: 'group',
              parentNode: originalParent, // Set to the original parent (e.g., subnet-1)
              position: { x: 0, y: 0 },
              style: {
                backgroundColor: 'transparent',
                border: 'none',
                width: 120,
                height: 140,
                opacity: 0,
              },
              layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'DOWN', // Vertical layout within this group
                'elk.spacing.nodeNode': '20',
                'elk.padding': '[top=5,left=5,bottom=5,right=5]',
              },
            };
            
            // Add the new group node to transformedNodes array
            transformedNodes.push(groupNode);
            
            // Update the original source and target nodes by changing their parentNode to the new group's ID
            transformedNodes = transformedNodes.map(node => {
              if (node.id === edge.source) {
                return { ...node, parentNode: groupId, extent: 'parent' };
              }
              if (node.id === edge.target) {
                return { ...node, parentNode: groupId, extent: 'parent' };
              }
              return node;
            });
            
            // Rewire external edges - any edge that was previously connected to a node now inside the group must be updated to connect to the group's border instead
            transformedEdges = transformedEdges.map(e => {
              // Skip the rule-triggering edge itself (keep internal edge as is)
              if (e.id === edge.id) {
                return e;
              }
              
              // If an external node connects TO one of our grouped nodes, redirect to group
              if ((e.target === edge.source || e.target === edge.target) && 
                  (e.source !== edge.source && e.source !== edge.target)) {
                return { ...e, target: groupId };
              }
              
              // If one of our grouped nodes connects TO an external node, redirect from group
              if ((e.source === edge.source || e.source === edge.target) && 
                  (e.target !== edge.source && e.target !== edge.target)) {
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

  // 1. First Pass: Iterate through the transformed nodes array
  transformedNodes.forEach(node => {
    // a. Create a base ELK node object with its layoutOptions and an empty children array
    const baseLayoutOptions = { ...(node.layoutOptions || {}) };
    
    // b. Check if the node is a parent container ('vpc', 'subnet', or 'group')
    const nodeIsParent = node.nodeType === 'vpc' || node.nodeType === 'subnet' || node.nodeType === 'group';
    
    const elkNode = {
      id: node.id,
      // If it is a parent container, DO NOT assign width/height (let ELK calculate automatically)
      // If it is NOT a parent, assign width and height from its style
      ...(nodeIsParent ? {} : {
        width: node.style?.width || 150,
        height: node.style?.height || 50,
      }),
      layoutOptions: baseLayoutOptions,
      children: []
    };
    
    // Add the final elkNode object to the elkNodeMap
    elkNodeMap.set(node.id, elkNode);
  });

  // 2. Second Pass: Iterate through the transformed nodes again to build the parent-child tree
  transformedNodes.forEach(node => {
    const elkNode = elkNodeMap.get(node.id);
    
    if (node.parentNode) {
      // If a node has a parentNode, get its ELK object from the map and push it into the children array of its parent's ELK object
      const parentElkNode = elkNodeMap.get(node.parentNode);
      if (parentElkNode) {
        parentElkNode.children.push(elkNode);
      }
    } else {
      // Otherwise, it's a top-level node, so push its ELK object into the root elkNodes array
      elkNodes.push(elkNode);
    }
  });

  // Create the final graph object for ELK using the elkNodes and transformedEdges
  const graph = {
    id: 'root',
    layoutOptions: {
      ...elkOptions,
      'elk.direction': options.direction || 'DOWN',
    },
    children: elkNodes,
    edges: transformedEdges,
  };

  // == PHASE 2: LAYOUT AND FLATTEN (SIMPLIFIED) ==
  const layoutedGraph = await elk.layout(graph);
  const flattenedNodes = [];

  function applyPositions(elkNode, parentPosition = { x: 0, y: 0 }) {
    const originalNode = transformedNodes.find((n) => n.id === elkNode.id);
    if (originalNode) {
      flattenedNodes.push({
        ...originalNode,
        position: {
          x: parentPosition.x + elkNode.x,
          y: parentPosition.y + elkNode.y,
        },
        style: {
          ...originalNode.style,
          width: elkNode.width,
          height: elkNode.height,
        },
      });
    }
    if (elkNode.children) {
      elkNode.children.forEach(child => applyPositions(child, flattenedNodes.find(n => n.id === elkNode.id)!.position));
    }
  }
  layoutedGraph.children.forEach(elkNode => applyPositions(elkNode));

  return {
    nodes: flattenedNodes,
    edges: edges, // Return original edges
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
      nodeTypes={nodeTypes}
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
