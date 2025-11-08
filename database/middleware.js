// Middleware for JSON Server to add timestamps and validation
module.exports = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const now = new Date().toISOString();
    
    if (req.method === 'POST') {
      req.body.createdAt = now;
      req.body.updatedAt = now;
    } else {
      req.body.updatedAt = now;
    }
  }
  
  next();
};




