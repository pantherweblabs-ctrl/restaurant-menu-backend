const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Get allowed origins from environment variable or use defaults
        const allowedOriginsString = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000';
        const allowedOrigins = allowedOriginsString.split(',').map(origin => origin.trim());
        
        // Add default origins for development
        allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000', 'file://', 'null');
        
        // Log for debugging
        console.log('CORS check - Origin:', origin);
        console.log('CORS check - Allowed origins:', allowedOrigins);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS check - Origin not in allowed list:', origin);
            // Allow Vercel deployments (check if origin contains vercel.app)
            if (origin && origin.includes('vercel.app')) {
                console.log('Allowing Vercel origin:', origin);
                callback(null, true);
            } else {
                // For now, allow all origins to prevent CORS issues
                // TODO: Restrict this to specific domains in production
                console.log('Allowing origin (temporary):', origin);
                callback(null, true);
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/menu', require('./routes/menu'));
app.use('/api/visitors', require('./routes/visitors-direct'));
app.use('/api/orders', require('./routes/orders'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
