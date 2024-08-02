import React, { useRef, useEffect } from 'react';

type PoseData = {
  x: number; 
  y: number; 
  score: number; 
  name: string
};
interface IPoseCanvasProps {
  poseData: PoseData[] | null;
  width: number;
  height: number;
};

const skeletonConnections = [
  ['nose', 'left_eye'],
  ['left_eye', 'left_ear'],
  ['nose', 'right_eye'],
  ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_shoulder', 'right_hip'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['left_hip', 'right_hip']
];

const leftSideKeypoints = new Set([
  'left_eye', 'left_ear', 'left_shoulder', 'left_elbow', 
  'left_wrist', 'left_hip', 'left_knee', 'left_ankle'
]);

const PoseCanvas = ({ poseData, width, height}: IPoseCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Clear canvas first

    const drawPose = () => {
      context.clearRect(0, 0, width, height);
      if (poseData) {
          // Draw skeleton connections
          skeletonConnections.forEach(([start, end]) => {
            const startPoint = poseData.find((point) => point.name === start);
            const endPoint = poseData.find((point) => point.name === end);
            if (!startPoint) return;
            if (!endPoint) return;

            if (startPoint?.score > 0.4 && endPoint?.score > 0.4) {
              context.beginPath();
              context.moveTo(startPoint.x * width, startPoint.y * height);
              context.lineTo(endPoint.x * width, endPoint.y * height);
              context.strokeStyle = 'white'; // Set line color to white
              context.lineWidth = 2;
              context.stroke();
            }
          });

          // Draw keypoints
          poseData.forEach(({ x, y, score, name }) => {
            if (score > 0.4) {
              const xCoord = x * width;
              const yCoord = y * height;
              context.beginPath();
              context.arc(xCoord, yCoord, 5, 0, 2 * Math.PI); // Draw arc

              // Fill color: green for left-side keypoints, yellow for others
              context.fillStyle = leftSideKeypoints.has(name) ? 'green' : 'yellow';
              context.fill();

              // White outline for all keypoints
              context.lineWidth = 1;
              context.strokeStyle = 'white';
              context.stroke();
            }
          });
        }

    };

    drawPose();
  }, [poseData, width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height} />
  )
};

export default PoseCanvas;
