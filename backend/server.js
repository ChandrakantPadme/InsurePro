const express = require('express');
const fileUpload = require('express-fileupload');
const readline = require('readline');
const stream = require('stream');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'client/build')));

function getMonth(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  return `${date.getFullYear()}-${month < 10 ? '0' + month : month}`;
}


app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No file uploaded.');
  }

  const salesFile = req.files.salesData;

  const bufferStream = new stream.PassThrough();
  bufferStream.end(salesFile.data);

  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity
  });

  let totalSales = 0;
  const monthWiseSales = {};
  const monthWiseItemQuantity = {};
  const monthWiseItemRevenue = {};
  const mostPopularItemOrders = {};

  let headers = [];

  rl.on('line', (line) => {
    if (!line.trim()) return;

    if (headers.length === 0) {
      headers = line.split(',').map(header => header.trim());
      return;
    }

    const data = line.split(',');

    const record = {};
    headers.forEach((header, idx) => {
      record[header] = data[idx].trim();
    });

    const date = record['Date'];
    const item = record['SKU']; 
    const quantity = parseInt(record['Quantity'], 10);
    const price = parseFloat(record['Unit Price']); 

    if (!date || !item || isNaN(quantity) || isNaN(price)) {
      console.error("Invalid data:", record);
      return; 
    }

    const month = getMonth(date);
    const revenue = quantity * price;

    totalSales += revenue;

    if (!monthWiseSales[month]) monthWiseSales[month] = 0;
    monthWiseSales[month] += revenue;

    if (!monthWiseItemQuantity[month]) monthWiseItemQuantity[month] = {};
    if (!monthWiseItemQuantity[month][item]) monthWiseItemQuantity[month][item] = 0;
    monthWiseItemQuantity[month][item] += quantity;

    if (!monthWiseItemRevenue[month]) monthWiseItemRevenue[month] = {};
    if (!monthWiseItemRevenue[month][item]) monthWiseItemRevenue[month][item] = 0;
    monthWiseItemRevenue[month][item] += revenue;

    if (!mostPopularItemOrders[month]) mostPopularItemOrders[month] = {};
    if (!mostPopularItemOrders[month][item]) mostPopularItemOrders[month][item] = [];
    mostPopularItemOrders[month][item].push(quantity);
  });

  rl.on('close', () => {
    const monthWiseReports = [];

    for (const month in monthWiseSales) {
      const popularItem = Object.keys(monthWiseItemQuantity[month]).reduce((a, b) => (monthWiseItemQuantity[month][a] > monthWiseItemQuantity[month][b] ? a : b));
      const topRevenueItem = Object.keys(monthWiseItemRevenue[month]).reduce((a, b) => (monthWiseItemRevenue[month][a] > monthWiseItemRevenue[month][b] ? a : b));
      const orders = mostPopularItemOrders[month][popularItem] || [];

      const minOrders = Math.min(...orders);
      const maxOrders = Math.max(...orders);
      const avgOrders = orders.reduce((a, b) => a + b, 0) / orders.length || 0;

      monthWiseReports.push({
        month,
        totalSales: monthWiseSales[month] || 0,
        popularItem: popularItem || 'N/A',
        popularItemQuantity: monthWiseItemQuantity[month][popularItem] || 0,
        topRevenueItem: topRevenueItem || 'N/A',
        topRevenue: monthWiseItemRevenue[month][topRevenueItem] || 0,
        popularItemStats: { min: minOrders || 0, max: maxOrders || 0, avg: avgOrders || 0 }
      });
    }

    res.json({ totalSales, monthWiseReports });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
