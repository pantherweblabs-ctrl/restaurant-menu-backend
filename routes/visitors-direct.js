const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const Joi = require('joi');

// Direct PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Contact@123@db.yjynnclmzueqxitqszdt.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// Validation schemas
const visitorSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().required(),
    opted_in: Joi.boolean().default(true),
    source: Joi.string().valid('website', 'menu', 'referral', 'walk-in', 'other').optional(),
    notes: Joi.string().max(500).allow('').optional()
});

const messageLogSchema = Joi.object({
    visitor_id: Joi.number().integer().required(),
    channel: Joi.string().valid('whatsapp', 'sms', 'manual').required(),
    action: Joi.string().required(),
    body: Joi.string().required(),
    admin: Joi.string().optional()
});

// Helper function to normalize phone number
function normalizePhone(phone, defaultCountry = 'IN') {
    try {
        // Simple phone normalization
        return phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    } catch (error) {
        console.error('Phone normalization error:', error);
        return phone.replace(/\s+/g, '');
    }
}

// GET /api/visitors - Get all visitors
router.get('/', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM public.visitors ORDER BY created_at DESC');
        client.release();

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch visitors',
            message: error.message
        });
    }
});

// POST /api/visitors - Create new visitor
router.post('/', async (req, res) => {
    try {
        // Validate input
        const { error: validationError, value } = visitorSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: validationError.details
            });
        }

        // Normalize phone number
        const normalizedPhone = normalizePhone(value.phone);

        // Check if visitor already exists
        const client = await pool.connect();
        const existingResult = await client.query(
            'SELECT id FROM public.visitors WHERE phone = $1',
            [normalizedPhone]
        );

        if (existingResult.rows.length > 0) {
            client.release();
            return res.status(409).json({
                success: false,
                error: 'Visitor already exists',
                message: 'A visitor with this phone number already exists'
            });
        }

        // Create visitor
        const result = await client.query(
            'INSERT INTO public.visitors (name, phone, opted_in, source, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [value.name, normalizedPhone, value.opted_in, value.source, value.notes]
        );

        client.release();

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Visitor created successfully'
        });
    } catch (error) {
        console.error('Error creating visitor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create visitor',
            message: error.message
        });
    }
});

// GET /api/visitors/:id - Get visitor by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM public.visitors WHERE id = $1', [id]);
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Visitor not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching visitor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch visitor',
            message: error.message
        });
    }
});

// PUT /api/visitors/:id - Update visitor
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate input
        const { error: validationError, value } = visitorSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: validationError.details
            });
        }

        // Normalize phone number
        const normalizedPhone = normalizePhone(value.phone);

        const client = await pool.connect();
        const result = await client.query(
            'UPDATE public.visitors SET name = $1, phone = $2, opted_in = $3, source = $4, notes = $5 WHERE id = $6 RETURNING *',
            [value.name, normalizedPhone, value.opted_in, value.source, value.notes, id]
        );
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Visitor not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Visitor updated successfully'
        });
    } catch (error) {
        console.error('Error updating visitor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update visitor',
            message: error.message
        });
    }
});

// DELETE /api/visitors/:id - Delete visitor
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        const result = await client.query('DELETE FROM public.visitors WHERE id = $1', [id]);
        client.release();

        res.json({
            success: true,
            message: 'Visitor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting visitor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete visitor',
            message: error.message
        });
    }
});

// POST /api/visitors/:id/contact - Log contact attempt
router.post('/:id/contact', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate input
        const { error: validationError, value } = messageLogSchema.validate({
            ...req.body,
            visitor_id: parseInt(id)
        });
        if (validationError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: validationError.details
            });
        }

        const client = await pool.connect();
        const result = await client.query(
            'INSERT INTO public.message_logs (visitor_id, channel, action, body, admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [value.visitor_id, value.channel, value.action, value.body, value.admin]
        );
        client.release();

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Contact logged successfully'
        });
    } catch (error) {
        console.error('Error logging contact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log contact',
            message: error.message
        });
    }
});

// GET /api/visitors/:id/messages - Get visitor's message history
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM public.message_logs WHERE visitor_id = $1 ORDER BY created_at DESC',
            [id]
        );
        client.release();

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages',
            message: error.message
        });
    }
});

module.exports = router;
