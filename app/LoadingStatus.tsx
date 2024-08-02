import './LoadingStatus.css'; // Assuming you will create this CSS file

const LoadingStatus = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Loading webcam tracking code - this may take a few seconds</p>
    </div>
  );
};

export default LoadingStatus;