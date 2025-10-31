const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Mock orders storage (replace with database)
let orders = [];
let orderIdCounter = 1;

// Validation schemas
const orderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().required(),
            name: Joi.string().required(),
            price: Joi.number().positive().required(),
            quantity: Joi.number().integer().positive().required(),
            selectedOption: Joi.string().optional()
        })
    ).min(1).required(),
    customer: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        phone: Joi.string().required(),
        email: Joi.string().email().optional(),
        address: Joi.string().optional()
    }).required(),
    total: Joi.number().positive().required(),
    notes: Joi.string().max(500).optional()
});

// GET /api/orders - Get all orders
router.get('/', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let filteredOrders = orders;
        
        if (status) {
            filteredOrders = orders.filter(order => order.status === status);
        }
        
        const paginatedOrders = filteredOrders
            .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            success: true,
            data: paginatedOrders,
            count: paginatedOrders.length,
            total: filteredOrders.length
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
            message: error.message
        });
    }
});

// POST /api/orders - Create new order
router.post('/', (req, res) => {
    try {
        // Validate input
        const { error: validationError, value } = orderSchema.validate(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: validationError.details
            });
        }

        // Create order
        const order = {
            id: orderIdCounter++,
            ...value,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        orders.push(order);

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: error.message
        });
    }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const order = orders.find(o => o.id === parseInt(id));

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            message: error.message
        });
    }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const orderIndex = orders.findIndex(o => o.id === parseInt(id));
        
        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        orders[orderIndex].status = status;
        orders[orderIndex].updated_at = new Date().toISOString();

        res.json({
            success: true,
            data: orders[orderIndex],
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            message: error.message
        });
    }
});

// DELETE /api/orders/:id - Cancel order
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const orderIndex = orders.findIndex(o => o.id === parseInt(id));

        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const order = orders[orderIndex];
        
        // Only allow cancellation of pending or confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel order',
                message: 'Only pending or confirmed orders can be cancelled'
            });
        }

        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].updated_at = new Date().toISOString();

        res.json({
            success: true,
            data: orders[orderIndex],
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel order',
            message: error.message
        });
    }
});

// GET /api/orders/stats - Get order statistics
router.get('/stats', (req, res) => {
    try {
        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: orders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + o.total, 0)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order statistics',
            message: error.message
        });
    }
});

module.exports = router;
