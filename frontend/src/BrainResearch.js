import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BrainResearch.css';

// Import the images for research cards
import drugDeliveryImage from './Assets/drug.jpg';
import meningiomaImage from './Assets/menin.jpg';
import drugTargetImage from './Assets/cancer.jpg';
import stemCellsImage from './Assets/stem.jpg';
import immuneResponseImage from './Assets/immu.jpg';

function BrainResearch() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  const researchLinks = [
    {
      name: "Local Drug Delivery in Brain Tumor",
      url: "https://www.hopkinsmedicine.org/brain-tumor/research/drug-delivery",
      description: "Innovative approaches to delivering drugs directly to brain tumor sites to improve treatment efficacy.",
      image: drugDeliveryImage,
    },
    {
      name: "Meningioma Research",
      url: "https://www.hopkinsmedicine.org/brain-tumor/research/meningioma",
      description: "Comprehensive research on meningioma, a common type of brain tumor, focusing on its causes and treatment.",
      image: meningiomaImage,
    },
    {
      name: "New Drug Target for Brain Cancer",
      url: "https://www.hopkinsmedicine.org/brain-tumor/research/drug-targets",
      description: "Exploring new molecular targets for the development of drugs to treat brain cancer effectively.",
      image: drugTargetImage,
    },
    {
      name: "Stem Cells and Brain Tumor Research",
      url: "https://www.hopkinsmedicine.org/brain-tumor/research/stem-cells",
      description: "Research on the role of stem cells in brain tumor growth and their potential use in treatment.",
      image: stemCellsImage,
    },
    {
      name: "Immune Response to Brain Tumors",
      url: "https://www.hopkinsmedicine.org/brain-tumor/research/immune-response",
      description: "Studying the immune system's interaction with brain tumors to develop immunotherapy approaches.",
      image: immuneResponseImage,
    },
  ];

  return (
    <div className="brain-research-container">
      <button className="back-button" onClick={handleBack}>
        &#8592; Back
      </button>
      <h1>Brain Tumor Research</h1>
      <div className="research-list">
        {researchLinks.map((research, index) => (
          <div key={index} className="research-card">
            <img src={research.image} alt={research.name} className="research-card-image" />
            <h3>{research.name}</h3>
            <p>{research.description}</p>
            <a href={research.url} target="_blank" rel="noopener noreferrer">
              Learn More
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrainResearch;
