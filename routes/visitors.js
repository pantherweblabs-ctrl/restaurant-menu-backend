const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
}

const supabase = createClient(
    supabaseUrl || 'https://yjynnclmzueqxitqszdt.supabase.co',
    supabaseKey || ''
);

// Validation schemas
const visitorSchema = Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    phone: Joi.string().required().min(10).max(15),
    opted_in: Joi.boolean().default(true),
    source: Joi.string().valid('website', 'menu', 'referral', 'walk-in', 'other').default('menu'),
    notes: Joi.string().max(500).allow('').optional().default('')
}).unknown(false); // Reject unknown fields

const messageLogSchema = Joi.object({
    visitor_id: Joi.number().integer().required(),
    channel: Joi.string().valid('whatsapp', 'sms', 'manual').required(),
    action: Joi.string().required(),
    body: Joi.string().required(),
    admin: Joi.string().optional()
});

// Helper function to normalize phone number - extract only 10-digit Indian number
function normalizePhone(phone, defaultCountry = 'IN') {
    if (!phone || typeof phone !== 'string') {
        return '';
    }
    
    try {
        // Extract only digits
        let cleaned = phone.replace(/\D/g, '');
        
        if (!cleaned || cleaned.length === 0) {
            return '';
        }
        
        // If it's 13 digits and starts with 91, remove the 91
        if (cleaned.length === 13 && cleaned.startsWith('91')) {
            cleaned = cleaned.substring(2);
        }
        // If it's 12 digits and starts with 91, remove the 91
        else if (cleaned.length === 12 && cleaned.startsWith('91')) {
            cleaned = cleaned.substring(2);
        }
        // If it's 11 digits and starts with 1, remove the 1
        else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            cleaned = cleaned.substring(1);
        }
        // If it's 10 digits, keep as is
        else if (cleaned.length === 10) {
            // Already correct
        }
        // If it's more than 10 digits, take the last 10
        else if (cleaned.length > 10) {
            cleaned = cleaned.slice(-10);
        }
        
        return cleaned || '';
    } catch (error) {
        console.error('Phone normalization error:', error);
        return phone.replace(/\D/g, '').slice(-10) || '';
    }
}

// GET /api/visitors - Get all visitors
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
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
        // Log incoming request for debugging
        console.log('Received visitor data:', JSON.stringify(req.body, null, 2));
        
        // Validate input
        const { error: validationError, value } = visitorSchema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });
        
        if (validationError) {
            console.error('Validation error details:', validationError.details);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: validationError.details.map(d => d.message).join(', '),
                details: validationError.details
            });
        }

        // Normalize phone number
        const normalizedPhone = normalizePhone(value.phone);

        // Check if visitor already exists
        const { data: existingVisitor, error: checkError } = await supabase
            .from('visitors')
            .select('*')
            .eq('phone', normalizedPhone)
            .maybeSingle();

        // If there's an error checking (like table doesn't exist), log it but continue
        if (checkError && checkError.code !== 'PGRST116') {
            console.warn('Error checking existing visitor:', checkError);
        }

        if (existingVisitor) {
            // Return existing visitor data instead of error
            return res.status(200).json({
                success: true,
                data: existingVisitor,
                message: 'Visitor already exists, returning existing data'
            });
        }

        // Create visitor
        const { data, error } = await supabase
            .from('visitors')
            .insert([{
                ...value,
                phone: normalizedPhone
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: 'Visitor created successfully'
        });
    } catch (error) {
        console.error('Error creating visitor:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        
        // Return more detailed error in development
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Failed to create visitor';
            
        res.status(500).json({
            success: false,
            error: 'Failed to create visitor',
            message: errorMessage
        });
    }
});

// GET /api/visitors/:id - Get visitor by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Visitor not found'
            });
        }

        res.json({
            success: true,
            data
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

        const { data, error } = await supabase
            .from('visitors')
            .update({
                ...value,
                phone: normalizedPhone
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Visitor not found'
            });
        }

        res.json({
            success: true,
            data,
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

        const { error } = await supabase
            .from('visitors')
            .delete()
            .eq('id', id);

        if (error) throw error;

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

        const { data, error } = await supabase
            .from('message_logs')
            .insert([value])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
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

        const { data, error } = await supabase
            .from('message_logs')
            .select('*')
            .eq('visitor_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
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
