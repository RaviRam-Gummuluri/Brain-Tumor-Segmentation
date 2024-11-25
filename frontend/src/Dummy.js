import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPen, FaEraser, FaSave, FaPalette, FaArrowsAltV, FaUndo, FaSyncAlt } from 'react-icons/fa'; // Added Undo Icon
import './EditAnnotation.css';

function EditAnnotation({  }) { // Expecting currentProject as a prop
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEraser, setIsEraser] = useState(false);
    const [penSize, setPenSize] = useState(5);
    const [eraserSize, setEraserSize] = useState(5);
    const [penColor, setPenColor] = useState('red'); // State for pen color
    const [showColorPalette, setShowColorPalette] = useState(false); // Show/hide color palette
    const [showSizeSlider, setShowSizeSlider] = useState(false); // Show/hide size slider
    const [showAnnotatedImage, setShowAnnotatedImage] = useState(null);

    const canvasRef = useRef(null);
    const navigate = useNavigate();

    const [brainImage, setBrainImage] = useState(null);
    const [annotationImage, setAnnotationImage] = useState(null);
    const [originalAnnotationImage, setOriginalAnnotationImage] = useState(null); // Store the original image
    const [history, setHistory] = useState([]); // Store drawing history for undo functionality

    const handleBack = () => {
        navigate(-1); // Navigate back to the previous page
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await fetch('http://localhost:5001/get_images');
            const data = await response.json();
            setBrainImage(data.brain_image);
            setAnnotationImage(data.annotation_image);
            setOriginalAnnotationImage(data.annotation_image); 
            processAnnotationImage(data.annotation_image);// Save original annotation image
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };

    const drawImageOnCanvas = (imageSrc) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = `data:image/png;base64,${imageSrc}`;

        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // Draw the background image (annotation)
        };
    };

    useEffect(() => {
        if (annotationImage) {
            drawImageOnCanvas(annotationImage); // Draw the image once it's loaded
        }
    }, [annotationImage]);

    
    const getMousePosition = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
    
        // Calculate the mouse position relative to the canvas scale
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
    
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };
    
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    
        ctx.lineWidth = isEraser ? eraserSize : penSize;
        ctx.strokeStyle = isEraser ? 'black' : penColor; // Use white for eraser
    
        const pos = getMousePosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };
    
    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getMousePosition(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };
    
    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL(); // Save the current drawing state to history
        setHistory([...history, dataUrl]); // Store the current canvas state in history
    };
    

    const toggleTool = (tool) => {
        setIsEraser(tool === 'eraser');
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
    
        // Get the canvas image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
        // Process the image data to convert red regions to white
        for (let i = 0; i < imageData.data.length; i += 4) {
            const [r, g, b] = [
                imageData.data[i],
                imageData.data[i + 1],
                imageData.data[i + 2],
            ];
    
            if (r === 255 && g === 0 && b === 0) { // Check if the pixel is red
                imageData.data[i] = 255;     // Red
                imageData.data[i + 1] = 255; // Green
                imageData.data[i + 2] = 255; // Blue
            }
        }
    
        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);
    
        // Convert the modified canvas to a Data URL
        const annotatedImage = canvas.toDataURL("image/png");
    
        // Display the annotated image before sending to the backend
        setShowAnnotatedImage(annotatedImage);
    
        try {
            const response = await fetch('http://localhost:5001/save_annotation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: annotatedImage,
                    project: "project_1",
                    filename: 'image.0101.dcm'
                })
            });
    
            if (response.ok) {
                alert('Annotation saved successfully!');
            } else {
                const errorText = await response.text();
                console.error('Failed to save the annotation:', errorText);
                alert('Failed to save the annotation');
            }
        } catch (error) {
            console.error('Error saving annotation:', error);
        }
    };    

    const toggleColorPalette = () => {
        setShowColorPalette(!showColorPalette);
    };

    const toggleSizeSlider = () => {
        setShowSizeSlider(!showSizeSlider);
    };

    const selectColor = (color) => {
        setPenColor(color);
        setShowColorPalette(false);
    };

    const handleReset = () => {
        setAnnotationImage(originalAnnotationImage); // Reset to the original image
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        drawImageOnCanvas(originalAnnotationImage); // Clear canvas and redraw the original image
        setHistory([]); // Clear the drawing history
    };

    const handleUndo = () => {
        if (history.length === 0) return; // No history to undo
        const lastState = history[history.length - 1]; // Get the last saved state from history
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = lastState; // Load the last saved state into the canvas

        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear current drawing
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // Draw the previous state
        };
        setHistory(history.slice(0, -1)); // Remove the last state from history
    };

    // Process annotation to convert white areas to red
  const processAnnotationImage = (annotationImgBase64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${annotationImgBase64}`;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Process image data to convert white to red
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const [r, g, b, a] = [
          imageData.data[i],
          imageData.data[i + 1],
          imageData.data[i + 2],
          imageData.data[i + 3],
        ];
        if (r === 255 && g === 255 && b === 255 && a === 255) {
          imageData.data[i] = 255;     // Red
          imageData.data[i + 1] = 0;   // Green
          imageData.data[i + 2] = 0;   // Blue
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };
  };

    return (
        <div className="edit-container">
            <button className="annotation-back-button" onClick={handleBack}>
                &#8592; Back
            </button>
            <h1>Brain Annotation View</h1>

            <div className="overlay-container">
                {brainImage && (
                    <img
                        src={`data:image/png;base64,${brainImage}`}
                        alt="Brain"
                        className="brain-image"
                        width={500}
                        height={500}
                    />
                )}
                <canvas
                    ref={canvasRef}
                    className="annotation-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    width={500} // Internal width
                    height={500} // Internal height
                    style={{
                        width: '500px', // CSS width
                        height: '500px', // CSS height
                    }}
                />
            </div>


                

            <div className="toolbox">
                {/* Vertical Size Slider */}
                {showSizeSlider && (
                    <div className="vertical-slider">
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={isEraser ? eraserSize : penSize}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                isEraser ? setEraserSize(value) : setPenSize(value);
                            }}
                            className="slider"
                            orient="vertical"
                        />
                    </div>
                )}

                {/* Vertical Color Palette */}
                {showColorPalette && (
                    <div className="vertical-color-palette">
                        {['red', 'blue', 'green', 'yellow', 'purple'].map((color) => (
                            <div
                                key={color}
                                className="color-swatch"
                                style={{ backgroundColor: color }}
                                onClick={() => selectColor(color)}
                            ></div>
                        ))}
                    </div>
                )}

                <button 
                    className="tool-button" 
                    onClick={() => toggleTool('pen')}
                >
                    <FaPen />
                    <span>Pen</span>
                </button>
                <button 
                    className="tool-button" 
                    onClick={() => toggleTool('eraser')}
                >
                    <FaEraser />
                    <span>Eraser</span>
                </button>

                {/* Size Selector Icon */}
                <button 
                    className="tool-button" 
                    onClick={toggleSizeSlider}
                >
                    <FaArrowsAltV />
                    <span>Size</span>
                </button>

                {/* Color Selector Icon */}
                <button 
                    className="tool-button" 
                    onClick={toggleColorPalette}
                >
                    <FaPalette />
                    <span>Color</span>
                </button>

                <button 
                    className="tool-button" 
                    onClick={handleUndo}
                >
                    <FaUndo />
                    <span>Undo</span>
                </button>

                <button 
                    className="tool-button" 
                    onClick={handleReset}
                >
                    <FaSyncAlt /> {/* Changed icon to FaSyncAlt for Reset */}
                    <span>Reset</span>
                </button>

                <button 
                    className="tool-button save-tool" 
                    onClick={handleSave}
                >
                    <FaSave />
                    <span>Save</span>
                </button>
            </div>
            {/* Display the annotated PNG image */}
            {showAnnotatedImage && (
                <div>
                    <h3>Annotated Image Preview</h3>
                    <img src={showAnnotatedImage} alt="Annotated" />
                </div>
            )}
        </div>
    );
}

export default EditAnnotation;