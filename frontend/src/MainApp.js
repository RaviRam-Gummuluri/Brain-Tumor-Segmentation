import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainApp.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ImageDisplay from './ImageDisplay'; // Importing the new ImageDisplay component

function MainApp() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  useEffect(() => {
    const savedProjects = JSON.parse(localStorage.getItem('projects')) || [];
    setProjects(savedProjects);
  }, []);

  const saveProjects = (updatedProjects) => {
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const handleNewProject = () => {
    setShowNewProjectModal(true);
    setEditingProject(null); // Clear editing project
  };

  const handleCreateProject = () => {
    if (newProjectName.trim() === '') return;

    if (editingProject) {
      // Edit existing project
      const updatedProjects = projects.map((project) =>
        project.id === editingProject.id ? { ...project, name: newProjectName } : project
      );
      saveProjects(updatedProjects);
      setEditingProject(null);
    } else {
      // Create new project
      const newProject = { name: newProjectName, id: Date.now() };
      saveProjects([...projects, newProject]);
    }

    setShowNewProjectModal(false);
    setNewProjectName('');
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setShowNewProjectModal(true);
  };

  const handleDeleteProject = (projectId) => {
    const updatedProjects = projects.filter((project) => project.id !== projectId);
    saveProjects(updatedProjects);
  };

  const handleOpenProject = (project) => {
    setCurrentProject(project);
  };

  return (
    <div className="app-container">
      <button className="main-back-button" onClick={handleBack}>
        &#8592; Back
      </button>
      {!currentProject && (
        <div className="project-list">
          <h1>My Projects</h1>
          <button className="new-project-button" onClick={handleNewProject}>
            + New Project
          </button>
          {projects.length > 0 ? (
            <ul className="project-items">
              {projects.map((project) => (
                <li key={project.id}>
                  <span onClick={() => handleOpenProject(project)}>{project.name}</span>
                  <div className="action-icons">
                    <FaEdit
                      className="icon edit-icon"
                      onClick={() => handleEditProject(project)}
                    />
                    <FaTrash
                      className="icon delete-icon"
                      onClick={() => handleDeleteProject(project.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-projects">No projects found. Create a new project to get started.</p>
          )}
        </div>
      )}

      {showNewProjectModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
            <input
              type="text"
              placeholder="Enter project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button className="create-button" onClick={handleCreateProject}>
              {editingProject ? 'Save' : 'Create'}
            </button>
            <button
              className="cancel-button"
              onClick={() => setShowNewProjectModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {currentProject && <ImageDisplay projectName={currentProject.name} />}
    </div>
  );
}

export default MainApp;
