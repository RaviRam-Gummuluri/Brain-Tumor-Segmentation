import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ImageDisplay.css';
import EditAnnotation from './EditAnnotation';

function ImageDisplay({ projectName }) {
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);
  const [brainImage, setBrainImage] = useState(null);
  const [annotationImage, setAnnotationImage] = useState(null);
  const [file, setFile] = useState(null); // Store selected file

  const navigate = useNavigate();

  // Handle file selection (updating state)
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Update file state with selected file
  };

  useEffect(() => {
    if (annotationImage) {
        processAnnotationImage(annotationImage); // Process the annotation image
    }
}, [annotationImage]);

  // Handle file upload (using fetch API)
  const uploadFile = async () => {
    if (!file) {
      alert('Please select a .dcm file.');
      return;
    }

    const formData = new FormData();
    formData.append('dicom_file', file); // Append file to formData

    try {
      // Send file to backend using fetch
      const response = await fetch('http://localhost:5001/upload_dicom', {
        method: 'POST',
        body: formData,
      });

      // Check if the response is ok (200-299)
      if (response.ok) {
        const data = await response.json();
        // Handle response - set the brain and annotation images
        setBrainImage(`data:image/png;base64,${data.brain_image}`);
        setAnnotationImage(`data:image/png;base64,${data.annotation_image}`);
        setIsImagesLoaded(true);
        // alert('File uploaded and processed successfully.');
      } else {
        const errorData = await response.json();
        alert(`Failed to upload and process the file: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading the file.');
    }
  };

  const processAnnotationImage = (annotationImgBase64) => {
    const img = new Image();
    img.src = annotationImgBase64; // Base64 data for the image
    img.onload = async () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
  
      // Create an offscreen buffer for pixel manipulation
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgWidth;
      tempCanvas.height = imgHeight;
      const ctx = tempCanvas.getContext('2d');
  
      // Draw the image on the temporary canvas to get image data
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
  
      // Process image data: convert non-black pixels to red
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];     // Red channel
        const g = imageData.data[i + 1]; // Green channel
        const b = imageData.data[i + 2]; // Blue channel
  
        // If not black (R, G, B all not zero)
        if (!(r === 0 && g === 0 && b === 0)) {
          imageData.data[i] = 255;     // Set red channel to 255
          imageData.data[i + 1] = 0;   // Set green channel to 0
          imageData.data[i + 2] = 0;   // Set blue channel to 0
        }
      }
  
      // Convert processed data back to a Base64 image
      ctx.putImageData(imageData, 0, 0);
      const updatedImageBase64 = tempCanvas.toDataURL(); // Get Base64 output
  
      // Set the updated image as the annotation image
      setAnnotationImage(updatedImageBase64);
    };
  };
  

  return (
    <div className="project-view">
      <h1>{projectName}</h1>
      {!isImagesLoaded ? (
        <div className="file-upload-container">
          <input
            type="file"
            accept=".dcm"
            onChange={handleFileChange} // Call handleFileChange on file input change
            className="file-input"
          />
          <button className="upload-button" onClick={uploadFile}>
            Upload and Process
          </button>
        </div>
      ) : (
        <>
          <div className="overlay-container">
            {brainImage && (
              <img
                src={brainImage}
                alt="Brain"
                className="base-image"
                width={500}
                height={500}
              />
            )}
            {annotationImage && (
              <img
                src={annotationImage}
                alt="Annotation"
                className="overlay-image"
                width={500}
                height={500}
              />
            )}
          </div>

          <div className="button-container">
            <button
              className="edit-button"
              onClick={() =>
                navigate('/edit-annotation', {
                  state: {
                    brainImage,
                    annotationImage,
                  },
                })
              }
            >
              Edit Annotation
            </button>
            <button
              className="save-button"
              onClick={() => alert('Saving not implemented')}
            >
              Save Annotations
            </button>
          </div>
        </>
      )}
    </div>
    
  );
}

export default ImageDisplay;