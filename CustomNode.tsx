// src/CustomNode.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

const handleStyle = { width: 8, height: 8 };

function CustomNode({ data }) {
  return (
    <div style={{
      fontSize: '11px',
    }}>
      {/* Define a handle for each side */}
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      
      <div>{data.label}</div>
    </div>
  );
}

export default React.memo(CustomNode);