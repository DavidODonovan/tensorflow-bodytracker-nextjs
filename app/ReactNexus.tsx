'use client';

import { useDims } from './useDims';
import ComputerVisionAINode from './ComputerVisionAINode';
const ReactNexus = () => {
  const [domNode, parentDimensions] = useDims();
  return (
    <div ref={domNode} style={{ position: 'relative', width: '100%', height: 0, paddingBottom: '75%' }}>
      {parentDimensions && <ComputerVisionAINode parentDimensions={parentDimensions}/>}
    </div>
  );
};

export default ReactNexus;
