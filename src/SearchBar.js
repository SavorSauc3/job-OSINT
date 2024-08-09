import React, { useState } from 'react';
import { FormControl, Container, Row, Col, Card, ListGroup, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './SearchBar.css';  // Import the CSS file

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setIsLoading(true);  // Start loading
    try {
      const response = await axios.get('http://127.0.0.1:5000/jobs', {
        params: {
          keyword: query,
          location: location
        }
      });

      setResults(response.data);
      setSelectedJob(null); // Clear selected job when searching new results
    } catch (error) {
      console.error('Error fetching job data:', error);
      setResults([]);
      setSelectedJob(null);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };
  
  const handleSaveToTxt = async (job) => {
    try {
      const saveResponse = await axios.post('http://127.0.0.1:5000/save-job', job);
      const url = window.URL.createObjectURL(new Blob([saveResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'job-details.txt');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error saving job to TXT:', error);
    }
  };

  return (
    <Container fluid className="text-white">
      <Row className="mb-4 text-center">
        <Col>
          <h1>Linkedin Job Search App</h1>
          <p>Search for job postings and see the results below.</p>
        </Col>
      </Row>
      <Row className="mb-4 justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <form onSubmit={handleSearch} className="d-flex flex-column flex-sm-row">
            <FormControl
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search for jobs..."
              className="me-2 mb-2 mb-sm-0 flex-grow-1"
              disabled={isLoading}
            />
            <FormControl
              type="text"
              value={location}
              onChange={handleLocationChange}
              placeholder="Enter location..."
              className="me-2 mb-2 mb-sm-0 flex-grow-1"
              disabled={isLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <Spinner animation="border" size="sm" /> : 'Search'}
            </button>
          </form>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col xs={12} md={6} lg={4} className={`transition-effect ${isLoading ? 'loading' : ''}`}>
          <Card bg="dark" text="white" className="results-card">
            <Card.Body>
              <Card.Title>Search Results</Card.Title>
              <ListGroup variant="flush" className="results-list">
                {results.length > 0 ? (
                  results.map((job, index) => (
                    <ListGroup.Item
                      key={index}
                      action
                      className="job-item"
                      onClick={() => handleJobClick(job)}
                    >
                      <div className="job-title">
                        <strong>{job["job-title"] || "No title"}</strong>
                      </div>
                      <div className="job-company">
                        {job["company"] || "No company"}
                      </div>
                      <div className="job-level">
                        {job["level"] || "No level"}
                      </div>
                      {job["id"] && (  // Only show button if job["id"] exists
                        <Button 
                          variant="secondary" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to ListGroup.Item
                            handleSaveToTxt(job); // Pass the entire job object
                          }} 
                          className="mt-2"
                        >
                          Save to TXT
                        </Button>
                      )}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>No results to display.</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={8} className={`transition-effect ${isLoading ? 'loading' : ''}`}>
          <Card bg="dark" text="white">
            <Card.Body>
              <Card.Title>Job Description</Card.Title>
              <div
                className="job-description"
                dangerouslySetInnerHTML={{ __html: selectedJob ? selectedJob["description"] || "No description available." : "Click on a job to see the description." }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="text-center">
        <Col>
          <footer>
            <p>© 2024 Nathaniel Lybrand</p>
          </footer>
        </Col>
      </Row>
    </Container>
  );
};

export default SearchBar;
