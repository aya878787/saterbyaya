// Vercel Serverless Function - Proxy for Apps Script
export default async function handler(req, res) {
  // تفعيل CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // رابط الـ Apps Script
  const API_URL = 'https://script.google.com/macros/s/AKfycbzHlmumb3J3tdyKfWsSn-Q85bamEJaEylffvsvmshHFvQfPvaNxgXotiJqbh68roTR0/exec';
  
  // نجيب الـ action من الـ query
  const action = req.query.action || 'getProducts';
  
  try {
    const response = await fetch(`${API_URL}?action=${action}`);
    const data = await response.json();
    
    // نرجع البيانات مع headers CORS صحيحة
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
