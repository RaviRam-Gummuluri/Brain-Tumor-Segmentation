import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BrainDataset.css'; // CSS for styling

// Import the images for dataset cards
import yoloImage from './Assets/yolo.jpg';
import dataportalImage from './Assets/data.jpg';
import openfmriImage from './Assets/fmri.jpg';
import synapseImage from './Assets/synapse.jpg';

function BrainDataset() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const datasets = [
    {
      name: 'Ultralytics Yolo Docs',
      url: 'https://docs.ultralytics.com/datasets/detect/brain-tumor/',
      description: 'Explore brain tumor detection datasets for YOLO models.',
      image: yoloImage,
    },
    {
      name: 'Dataportal Asia',
      url: 'https://dataportal.asia/dataset/212571056_braintumorprogression',
      description: 'Comprehensive brain tumor progression datasets at dataportal.',
      image: dataportalImage,
    },
    {
      name: 'Openfmri',
      url: 'https://openfmri.org/',
      description: 'Open access fMRI datasets for brain tumor research purposes.',
      image: openfmriImage,
    },
    {
      name: 'Synapse Brain Images',
      url: 'https://www.synapse.org/Synapse:syn53708249/wiki/626323',
      description: 'Synapse repository of brain images and related data.',
      image: synapseImage,
    },
  ];

  return (
    <div className="brain-dataset-container">
      <button className="back-button" onClick={handleBack}>
        &#8592; Back
      </button>
      <h1>Brain Datasets</h1>
      <div className="datasets-container">
        {datasets.map((dataset, index) => (
          <div key={index} className="dataset-card">
            <img src={dataset.image} alt={dataset.name} className="dataset-card-image" />
            <h3>{dataset.name}</h3>
            <p>{dataset.description}</p>
            <a href={dataset.url} target="_blank" rel="noopener noreferrer">
              Visit Dataset
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrainDataset;
