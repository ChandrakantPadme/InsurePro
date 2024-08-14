import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload a file.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('salesData', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Ice Cream Parlour Sales Analysis</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload and Analyze</button>
      </form>

      {loading && <p>Processing...</p>}

      {results && (
        <div className="results">
          <h2>Total Sales: ₹ {results?.totalSales?.toFixed(2)}</h2>
          {results.monthWiseReports.map((report, idx) => (
            <div key={idx} className="month-report">
              <h3>{report.month}</h3>
              <p>Total Sales: ₹ {report?.totalSales?.toFixed(2)}</p>
              <p>Most Popular Item: {report.popularItem} ({report.popularItemQuantity} units)</p>
              <p>Top Revenue Item: {report.topRevenueItem} (₹ {report?.topRevenue?.toFixed(2)})</p>
              <p>Popular Item Stats: Min={report.popularItemStats.min}, Max={report.popularItemStats.max}, Avg={report?.popularItemStats?.avg?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
