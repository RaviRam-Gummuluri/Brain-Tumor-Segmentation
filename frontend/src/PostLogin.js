import React from 'react';
import './PostLogin.css'; // Updated styling file

function PostLogin() {
  return (
    <div className="post-login-wrapper">
      {/* Main Content */}
      <div className="main-content">
        <h1>Welcome to Tumor Annotation</h1>
        <div className="app-introduction">
          <p>
            This Brain App is a comprehensive solution for brain image analysis. Use this tool to segment tumor brain images, explore curated brain tumor datasets, and access the latest research in neuroscience.
          </p>
          <h2>How It Works</h2>
          <ol className="usage-steps">
            <li><strong>Brain Segmentation:</strong> Upload DICOM files to annotate and segment brain regions accurately.</li>
            <li><strong>Explore Datasets:</strong> Browse through various brain datasets for your research needs.</li>
            <li><strong>Research Work:</strong> Dive into the latest advancements and findings in brain studies.</li>
          </ol>
          <h2>Interactive Demo</h2>
          <div className="demo-container">
            <p>
              Below is an interactive walkthrough of the app's functionality. Click on the options in the navbar to experience different features.
            </p>
            <div className="video-container">
              <iframe
                width="60%"
                height="500"
                src="https://www.youtube.com/embed/_m7FplcDeCA"
                title="Interactive Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostLogin;
