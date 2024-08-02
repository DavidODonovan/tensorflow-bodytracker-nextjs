import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import PoseCanvas from './PoseCanvas'
import LoadingStatus from './LoadingStatus';

const ComputerVisionAINode = ({parentDimensions}: {parentDimensions: DOMRect}):JSX.Element => {
  const webcamRef = useRef<Webcam | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [poseData, setPoseData] = useState(null);

  let detectorModel: any = null;

  useEffect(() => {
    const enableWebGPU = async () => {
      await tf.setBackend('webgl');
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 256000000);
    };
    enableWebGPU();

    const createDetector = async () => {
      setIsModelLoading(true); // Start loading
      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
      const detectorModel = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
      setIsModelLoading(false); // Finish loading
      return detectorModel;
    };


    // external variables for throttling
    let animationFrameID = 0;

    const detectPose = async () => {
      try {
        if (detectorModel === null) {
          detectorModel = await createDetector();
        };
      } catch (error) {
        throw new Error("failed to create tensorflow model for pose detection"); 
      }

      const movenetInputSize = 192;
      const videoSignalWidth = 640;
      const videoSignalHeight = 320;

      const video = webcamRef.current?.video;
      if (video) {
        // we can't await async code withing tf.tidy(), so first we set up a variable for your promise outside of tf.tidy.
        let posePromise;
        // then we run tensor calcs inside tf.tidy to prevent GPU memory leak.
        tf.tidy(() => {
          const inputTensor = tf.browser.fromPixels(video).toFloat();
          const resizedTensor = tf.image.resizeBilinear(inputTensor, [movenetInputSize, movenetInputSize]).reshape([1, movenetInputSize, movenetInputSize, 3]);
          posePromise = detectorModel.estimatePoses(resizedTensor.reshape([movenetInputSize, movenetInputSize, 3]));
        });
        // Await the promise outside of tf.tidy
        const poseData: any = await posePromise;
        // Handle the pose data here
        // Assuming poseData is available after await
        if (poseData.length > 0) {
          tf.tidy(() => {
            const keypoints = poseData[0].keypoints;

            // Extract names and scores in addition to coordinates
            const keypointsInfo = keypoints.map(({ x, y, score, name }:{x:number; y:number; score: number; name: string}) => ({ x, y, score, name }));

            // Convert x and y coordinates to tensors for GPU-accelerated computation
            const keypointsTensor = tf.tensor2d(keypoints.map(({ x, y}:{x:number; y:number}) => [x, y]));

            const xTransformRatio = videoSignalWidth / movenetInputSize;
            const yTransformRatio = videoSignalHeight / movenetInputSize;

            // Scale keypoints back to screen space
            const keypointsTransformed = keypointsTensor.mul(tf.tensor2d([[xTransformRatio, yTransformRatio]]));

            // Normalize keypoints to [0, 1] range
            const normalizedKeypoints = keypointsTransformed.div(tf.tensor1d([videoSignalWidth, videoSignalHeight]));

            // Convert normalized keypoints back to array for further processing
            normalizedKeypoints.array().then((normalizedArray) => {
              // Include 'name' and 'score' along with normalized x, y coordinates
              //@ts-ignore
              const animatedKeypoints = normalizedArray.map(([x, y], index) => ({
                x,
                y,
                name: keypointsInfo[index].name,
                score: keypointsInfo[index].score
              }));
              // Use the detailed keypoints here
              setPoseData(animatedKeypoints);
            });
          });
        }
      }
      
      animationFrameID = requestAnimationFrame(detectPose); // Continuously call detect function
    };
    
    // initial invocation of detectPose function
    animationFrameID = requestAnimationFrame(detectPose); // Continuously call detect function

    // cleanup.
    return () => {
      tf.setBackend('cpu');
      if(detectorModel){
        detectorModel.dispose();
      }
      cancelAnimationFrame(animationFrameID); // Switch back to the CPU backend when component unmounts
    };
  }, []);

  return (
    <>
      <Webcam ref={webcamRef} style={{ position: 'absolute', zIndex: -1, top: 0, left: 0, width: '100%', height: '100%' }} />
      <PoseCanvas poseData={poseData} width={parentDimensions.width} height={parentDimensions.height} />
      {isModelLoading && <LoadingStatus/>} 
    </>
  );
};

export default ComputerVisionAINode;
