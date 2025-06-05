import { initialNodes, initialEdges } from './initialElements.js';
import ELK from 'elkjs/lib/elk.bundled.js';
import React, { useCallback, useLayoutEffect } from 'react';
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

const getLayoutedElements = (nodes, edges, options = {}) => {
  // Separate parent nodes from child nodes
  const parentNodes = nodes.filter(node => !node.parentNode);
  const childNodes = nodes.filter(node => node.parentNode);
  
  // First, layout children for each parent to calculate required parent dimensions
  const parentPromises = parentNodes.map(async (parentNode) => {
    const nodeChildren = childNodes.filter(child => child.parentNode === parentNode.id);
    
    if (nodeChildren.length === 0) {
      return {
        ...parentNode,
        width: parentNode.style?.width || 150,
        height: parentNode.style?.height || 50,
        calculatedChildren: [],
      };
    }

    // Layout children first to determine space requirements
    const childLayoutOptions = parentNode.layoutOptions || {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '50',
    };

    const childGraph = {
      id: `${parentNode.id}-children`,
      layoutOptions: childLayoutOptions,
      children: nodeChildren.map(child => ({
        ...child,
        width: 120,
        height: 40,
      })),
      edges: edges.filter(edge => 
        nodeChildren.some(child => child.id === edge.source) &&
        nodeChildren.some(child => child.id === edge.target)
      ),
    };

    const childLayout = await elk.layout(childGraph);
    
    // Calculate required parent dimensions based on child layout
    const padding = 40; // Padding around children
    const headerHeight = 40; // Space for parent label
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    childLayout.children.forEach(child => {
      minX = Math.min(minX, child.x);
      maxX = Math.max(maxX, child.x + child.width);
      minY = Math.min(minY, child.y);
      maxY = Math.max(maxY, child.y + child.height);
    });
    
    const requiredWidth = Math.max(200, (maxX - minX) + (padding * 2));
    const requiredHeight = Math.max(100, (maxY - minY) + headerHeight + (padding * 2));
    
    return {
      ...parentNode,
      width: requiredWidth,
      height: requiredHeight,
      calculatedChildren: childLayout.children.map(child => ({
        ...child,
        // Adjust child positions to account for padding and header
        x: child.x - minX + padding,
        y: child.y - minY + headerHeight + (padding / 2),
        sourcePosition: childLayoutOptions['elk.direction'] === 'RIGHT' ? 'right' : 'bottom',
        targetPosition: childLayoutOptions['elk.direction'] === 'RIGHT' ? 'left' : 'top',
      })),
    };
  });

  return Promise.all(parentPromises).then(processedParents => {
    // Now layout the top-level nodes with calculated parent dimensions
    const graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': options?.['elk.direction'] || 'DOWN',
        'elk.spacing.nodeNode': '80',
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        ...options
      },
      children: processedParents.map(parent => ({
        ...parent,
        targetPosition: (options?.['elk.direction'] === 'RIGHT') ? 'left' : 'top',
        sourcePosition: (options?.['elk.direction'] === 'RIGHT') ? 'right' : 'bottom',
      })),
      edges: edges.filter(edge => 
        !childNodes.some(child => child.id === edge.source || child.id === edge.target)
      ),
    };

    return elk.layout(graph).then((layoutedGraph) => {
      const layoutedNodes = [];
      const allEdges = [...layoutedGraph.edges];
      
      // Process parent nodes and their children
      layoutedGraph.children.forEach((parentNode) => {
        // Add the parent node
        layoutedNodes.push({
          ...parentNode,
          position: { x: parentNode.x, y: parentNode.y },
        });
        
        // Add children with calculated positions
        if (parentNode.calculatedChildren) {
          parentNode.calculatedChildren.forEach((child) => {
            layoutedNodes.push({
              ...child,
              position: { 
                x: parentNode.x + child.x,
                y: parentNode.y + child.y,
              },
            });
          });
        }
      });

      // Include child edges in the final edge list
      const childEdges = edges.filter(edge => 
        childNodes.some(child => child.id === edge.source || child.id === edge.target)
      );
      allEdges.push(...childEdges);

      return {
        nodes: layoutedNodes,
        edges: allEdges,
      };
    });
  }).catch(console.error);
};

function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const ns = useInitialNodes ? initialNodes : nodes;
      const es = useInitialNodes ? initialEdges : edges;

      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          fitView();
        },
      );
    },
    [nodes, edges],
  );

  // Calculate the initial layout on mount.
  useLayoutEffect(() => {
    onLayout({ direction: 'DOWN', useInitialNodes: true });
  }, []);

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
      <Panel position="top-right">
        <button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: 'DOWN' })}
        >
          vertical layout
        </button>

        <button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: 'RIGHT' })}
        >
          horizontal layout
        </button>
        
        <button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: 'DOWN', useInitialNodes: true })}
        >
          mixed layout (reset)
        </button>
      </Panel>
      <Background />
    </ReactFlow>
  );
}

export default () => (
  <ReactFlowProvider>
    <LayoutFlow />
  </ReactFlowProvider>
);
