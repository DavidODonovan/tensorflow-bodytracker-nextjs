import { useRef, useState, useEffect } from 'react';

export const useDims = (): [React.MutableRefObject<HTMLDivElement | null>, DOMRect | null | undefined] => {
  const domNode = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<DOMRect | null>();
  const [timeoutID, newTimeoutID] = useState<ReturnType<typeof setTimeout>>();
  //TODO use dims to calculate aspect ratio cameraview node.

  const warning = () => {
    console.warn('useDims hook needs to be attached to a dom element before it can return a value: eg: <div ref={domNode}/>');
  };

  useEffect(() => {
    if (!domNode.current) {
      return warning();
    }
    setDimensions(domNode.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!domNode.current) {
      return;
    }
    const getNodeDimensions = () => {
      clearTimeout(timeoutID);
      newTimeoutID(
        setTimeout(() => {
          setDimensions(domNode.current!.getBoundingClientRect());
        }, 100)
      );
    };
    window.addEventListener('resize', getNodeDimensions);
    return () => {
      window.removeEventListener('resize', getNodeDimensions);
    };
  }, [timeoutID]);

  return [domNode, dimensions];
};
