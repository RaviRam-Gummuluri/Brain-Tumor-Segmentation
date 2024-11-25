from flask import Flask, jsonify, request
from flask_cors import CORS
import pydicom
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
import logging
import os
from PIL import Image
from pydicom.dataset import Dataset
from pydicom.uid import ImplicitVRLittleEndian
import tensorflow as tf
from tensorflow.python.keras import backend as K
import pydicom
import cv2


import matplotlib
matplotlib.use('Agg')

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')


@app.route('/get_images', methods=['GET'])
def get_images():
    logging.info("Received request to get images.")
    
    # Define paths for brain and annotation DICOM files
    brain_dcm_path = 'assets/images/image.0100.dcm'
    annotation_dcm_path = 'assets/annotations/image.0100.dcm'
    
    logging.info(f"Reading DICOM files: {brain_dcm_path}, {annotation_dcm_path}")
    
    try:
        brain_image = read_dicom_and_plot(brain_dcm_path)
        annotation_image = read_dicom_and_plot(annotation_dcm_path)
    except Exception as e:
        logging.error(f"Error while processing DICOM files: {str(e)}")
        return jsonify({'error': 'Failed to read or convert DICOM images'}), 500
    
    logging.info("Successfully processed DICOM files.")
    
    response = {
        'brain_image': brain_image,
        'annotation_image': annotation_image
    }
    
    logging.info("Returning response with encoded images.")
    return jsonify(response)

def read_dicom_and_plot(dicom_path):
    try:
        logging.info(f"Reading DICOM file: {dicom_path}")
        dicom_image = pydicom.dcmread(dicom_path)
        logging.info(f"Successfully read DICOM file: {dicom_path}")
        
        # Convert the pixel data into an image
        pixel_array = dicom_image.pixel_array
        
        # Create the figure for displaying the image
        fig, ax = plt.subplots()
        ax.imshow(pixel_array, cmap='gray')
        ax.axis('off')
        
        # Save the figure as PNG to a buffer
        buffered = io.BytesIO()
        plt.savefig(buffered, bbox_inches='tight', pad_inches=0, format='PNG')
        buffered.seek(0)
        
        # Encode the PNG image as base64
        encoded_image = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        plt.close(fig)
        
        return encoded_image
    except Exception as e:
        logging.error(f"Error reading or converting DICOM file: {dicom_path}. Error: {str(e)}")
        raise


@app.route('/save_annotation', methods=['POST'])
def save_annotation():
    data = request.get_json()
    project = data.get('project', 'default_project')
    filename = data.get('filename')
    annotation_image = data.get('image')

    if not annotation_image or not filename:
        return jsonify({'error': 'Image data or filename is missing'}), 400

    annotation_dcm_path = f'projects/{filename}'

    try:
        # Decode the base64 image
        decoded_image = base64.b64decode(annotation_image.split(',')[1])

        # Open the image using PIL
        image = Image.open(io.BytesIO(decoded_image))

        # Prepare the DICOM dataset
        dicom_image = Dataset()
        dicom_image.Rows, dicom_image.Columns = image.height, image.width

        # Create file_meta for the DICOM dataset
        dicom_image.file_meta = pydicom.dataset.FileMetaDataset()
        dicom_image.file_meta.MediaStorageSOPClassUID = pydicom.uid.UID('1.2.840.10008.5.1.4.1.1.2')  # CT Image Storage UID (modify if necessary)
        dicom_image.file_meta.TransferSyntaxUID = ImplicitVRLittleEndian  # Set the transfer syntax UID

        if image.mode == 'L':  # Grayscale image
            np_image = np.array(image, dtype=np.uint8)
            dicom_image.PhotometricInterpretation = "MONOCHROME1"
            dicom_image.SamplesPerPixel = 1
            dicom_image.BitsStored = 8
            dicom_image.BitsAllocated = 8
            dicom_image.HighBit = 7
            dicom_image.PixelRepresentation = 0
            dicom_image.PixelData = np_image.tobytes()

        elif image.mode == 'RGBA':  # RGBA image (3 channels)
            np_image = np.array(image, dtype=np.uint8)[:, :, :3]  # Ignore Alpha channel
            dicom_image.PhotometricInterpretation = "RGB"
            dicom_image.SamplesPerPixel = 3
            dicom_image.BitsStored = 8
            dicom_image.BitsAllocated = 8
            dicom_image.HighBit = 7
            dicom_image.PixelRepresentation = 0
            dicom_image.PixelData = np_image.tobytes()

        # Ensure directory exists
        os.makedirs('projects', exist_ok=True)

        # Save the DICOM file
        dicom_image.save_as(annotation_dcm_path, write_like_original=True)

        return jsonify({'message': 'Annotation saved successfully'})

    except Exception as e:
        return jsonify({'error': f'Failed to save annotation: {str(e)}'}), 500
 

"""
    Inference Code
    begins
"""   

# Model loading and custom metrics
def dice_coef(y_true, y_pred, smooth=1.0):
    y_true_f = K.flatten(y_true)
    y_pred_f = K.flatten(y_pred)
    intersection = K.sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (K.sum(y_true_f) + K.sum(y_pred_f) + smooth)

def dice_coef_necrotic(y_true, y_pred):
    return dice_coef(y_true[:,:,:,1], y_pred[:,:,:,1])

def dice_coef_edema(y_true, y_pred):
    return dice_coef(y_true[:,:,:,2], y_pred[:,:,:,2])

def dice_coef_enhancing(y_true, y_pred):
    return dice_coef(y_true[:,:,:,3], y_pred[:,:,:,3])

def precision(y_true, y_pred):
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    predicted_positives = K.sum(K.round(K.clip(y_pred, 0, 1)))
    precision = true_positives / (predicted_positives + K.epsilon())
    return precision

def sensitivity(y_true, y_pred):
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    possible_positives = K.sum(K.round(K.clip(y_true, 0, 1)))
    return true_positives / (possible_positives + K.epsilon())

def specificity(y_true, y_pred):
    true_negatives = K.sum(K.round(K.clip((1 - y_true) * (1 - y_pred), 0, 1)))
    possible_negatives = K.sum(K.round(K.clip(1 - y_true, 0, 1)))
    return true_negatives / (possible_negatives + K.epsilon())

# Load the saved model
logging.info("Loading the segmentation model...")
model = tf.keras.models.load_model("3D_MRI_Brain_tumor_segmentation.h5", custom_objects={
    'dice_coef': dice_coef,
    'precision': precision,
    'sensitivity': sensitivity,
    'specificity': specificity,
    'dice_coef_necrotic': dice_coef_necrotic,
    'dice_coef_edema': dice_coef_edema,
    'dice_coef_enhancing': dice_coef_enhancing
})
logging.info("Model loaded successfully.")

IMG_SIZE = 128

def preprocess_dicom(dicom_file):
    """
    Preprocess the uploaded DICOM file.
    """
    logging.info("Preprocessing DICOM file...")
    dicom = pydicom.dcmread(dicom_file)
    img = dicom.pixel_array.astype(float)
    img = img / np.max(img)  # Normalize
    img_resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    logging.info(f"DICOM file preprocessed successfully. {img_resized.shape}")
    return img_resized

def visualize_dicom(dicom_file):
    """
    Visualize the DICOM file and return it as a base64 string.
    """
    dicom = pydicom.dcmread(dicom_file)
    img = dicom.pixel_array

    # Display the DICOM image (optional for debugging purposes)
    plt.imshow(img, cmap='gray')
    plt.axis('off')
    plt.title('DICOM Image')
    plt.show()

    # Save the image to a buffer
    img_normalized = (img / np.max(img) * 255).astype(np.uint8)
    img_pil = Image.fromarray(img_normalized)
    buffer = io.BytesIO()
    img_pil.save(buffer, format="PNG")
    base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return base64_image

@app.route('/upload_dicom', methods=['POST'])
def upload_dicom():
    """
    Endpoint to upload and process a DICOM file.
    """
    logging.info("Received request to process DICOM file.")

    if 'dicom_file' not in request.files:
        logging.error("No DICOM file provided in the request.")
        return jsonify({'error': 'No DICOM file provided'}), 400

    file = request.files['dicom_file']
    logging.info(f"Processing file: {file.filename}")

    try:
        # Save the file temporarily for visualization
        temp_file_path = os.path.join('uploads', file.filename)
        file.save(temp_file_path)

        # Visualize the DICOM
        visualization = visualize_dicom(temp_file_path)

        # Preprocess and predict
        img_processed = preprocess_dicom(temp_file_path)
        X = np.zeros((1, IMG_SIZE, IMG_SIZE, 2))
        X[0, :, :, 0] = img_processed
        logging.info("Running prediction...")
        prediction = model.predict(X)
        logging.info("Prediction completed successfully.")

        pred_mask = np.argmax(prediction[0], axis=-1)

        # Convert brain and annotation masks to images
        brain_image = (img_processed * 255).astype(np.uint8)
        annotation_image = (pred_mask * 255 / pred_mask.max()).astype(np.uint8)

        # Convert images to base64
        brain_image_pil = Image.fromarray(brain_image)
        annotation_image_pil = Image.fromarray(annotation_image)

        brain_buffer = io.BytesIO()
        annotation_buffer = io.BytesIO()

        brain_image_pil.save(brain_buffer, format="PNG")
        annotation_image_pil.save(annotation_buffer, format="PNG")

        brain_base64 = base64.b64encode(brain_buffer.getvalue()).decode('utf-8')
        annotation_base64 = base64.b64encode(annotation_buffer.getvalue()).decode('utf-8')

        logging.info("Successfully processed and encoded images.")

        # Return the DICOM visualization along with predictions
        return jsonify({
            'brain_image': brain_base64,
            'annotation_image': annotation_base64,
            'dicom_visualization': visualization
        })

    except Exception as e:
        logging.error(f"Error processing file: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Main entry point
if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(debug=True, port=5001)
