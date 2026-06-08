import React from 'react';
import { useNavigate } from 'react-router-dom';
const BackButtonPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
    <div style={styles.container}>
        <div>Just checking!!!You are in About Page</div>
        <br />
        <hr />
      <button onClick={handleGoBack} style={styles.button}>
        Go Back
      </button>
    </div>
            
    </>
    
  );
};

const styles = {
  container: {
    fontFamily: 'sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f4f4f9',
  },
  button: {
    padding: '15px 30px',
    fontSize: '18px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
  }
};

export default BackButtonPage;