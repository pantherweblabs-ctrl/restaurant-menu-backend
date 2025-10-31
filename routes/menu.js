const express = require('express');
const router = express.Router();

// Mock menu data (replace with database queries)
const categories = [
    { id: 'veg', name: 'Veg', image: '/images/veg.jpg', color: '#8bc34a' },
    { id: 'non-veg', name: 'Non-Veg', image: '/images/non-veg.jpg', color: '#f44336' },
    { id: 'main-course', name: 'Main Course', image: '/images/main-course.jpg', color: '#ff9800' },
    { id: 'soup', name: 'Soup', image: '/images/soup.jpg', color: '#00bcd4' },
    { id: 'snacks', name: 'Snacks', image: '/images/snacks.jpg', color: '#e91e63' },
    { id: 'drinks', name: 'Drinks', image: '/images/drinks.jpg', color: '#2196f3' },
    { id: 'dessert', name: 'Dessert', image: '/images/dessert.jpg', color: '#9c27b0' }
];

const foodItems = {
    veg: [
        { id: 1, name: 'Paneer Tikka', price: 250, image: '/images/paneer-tikka.jpg' },
        { id: 2, name: 'Vegetable Biryani', price: 180, image: '/images/veg-biryani.jpg' },
        { id: 3, name: 'Malai Kofta', price: 220, image: '/images/malai-kofta.jpg' },
        { id: 4, name: 'Palak Paneer', price: 200, image: '/images/palak-paneer.jpg' },
        { id: 29, name: 'Mushroom Masala', price: 230, image: '/images/mushroom-masala.jpg' },
        { id: 30, name: 'Aloo Matar', price: 170, image: '/images/aloo-matar.jpg' }
    ],
    'non-veg': [
        { id: 5, name: 'Butter Chicken', price: 280, image: '/images/butter-chicken.jpg' },
        { id: 6, name: 'Chicken Biryani', price: 220, image: '/images/chicken-biryani.jpg' },
        { id: 7, name: 'Tandoori Chicken', price: 300, image: '/images/tandoori-chicken.jpg' },
        { id: 8, name: 'Fish Curry', price: 350, image: '/images/fish-curry.jpg' },
        { id: 31, name: 'Mutton Rogan Josh', price: 320, image: '/images/mutton-rogan-josh.jpg' },
        { id: 32, name: 'Chicken Korma', price: 270, image: '/images/chicken-korma.jpg' }
    ],
    'main-course': [
        { id: 9, name: 'Dal Makhani', price: 180, image: '/images/dal-makhani.jpg' },
        { id: 10, name: 'Rajma Chawal', price: 160, image: '/images/rajma-chawal.jpg' },
        { id: 11, name: 'Chole Bhature', price: 150, image: '/images/chole-bhature.jpg' },
        { id: 12, name: 'Aloo Gobi', price: 140, image: '/images/aloo-gobi.jpg' },
        { id: 33, name: 'Paneer Butter Masala', price: 240, image: '/images/paneer-butter-masala.jpg' },
        { id: 34, name: 'Veg Pulao', price: 170, image: '/images/veg-pulao.jpg' }
    ],
    soup: [
        { id: 13, name: 'Tomato Soup', price: 90, image: '/images/tomato-soup.jpg' },
        { id: 14, name: 'Hot & Sour Soup', price: 110, image: '/images/hot-sour-soup.jpg' },
        { id: 15, name: 'Manchow Soup', price: 120, image: '/images/manchow-soup.jpg' },
        { id: 16, name: 'Sweet Corn Soup', price: 100, image: '/images/corn-soup.jpg' },
        { id: 35, name: 'Lentil Soup', price: 95, image: '/images/lentil-soup.jpg' },
        { id: 36, name: 'Mushroom Soup', price: 105, image: '/images/mushroom-soup.jpg' }
    ],
    snacks: [
        { id: 17, name: 'Samosa', price: 60, image: '/images/samosa.jpg' },
        { id: 18, name: 'Spring Rolls', price: 80, image: '/images/spring-rolls.jpg' },
        { id: 19, name: 'Paneer Pakora', price: 100, image: '/images/paneer-pakora.jpg' },
        { id: 20, name: 'Chicken Tikka', price: 150, image: '/images/chicken-tikka.jpg' },
        { id: 37, name: 'Aloo Tikki', price: 70, image: '/images/aloo-tikki.jpg' },
        { id: 38, name: 'Veg Cutlet', price: 85, image: '/images/veg-cutlet.jpg' }
    ],
    drinks: [
        { id: 21, name: 'Mango Lassi', price: 80, image: '/images/mango-lassi.jpg' },
        { id: 22, name: 'Masala Chai', price: 50, image: '/images/masala-chai.jpg' },
        { id: 23, name: 'Fresh Lime Soda', price: 60, image: '/images/lime-soda.jpg' },
        { id: 24, name: 'Cold Coffee', price: 90, image: '/images/cold-coffee.jpg' },
        { id: 39, name: 'Buttermilk', price: 45, image: '/images/buttermilk.jpg' },
        { id: 40, name: 'Virgin Mojito', price: 85, image: '/images/virgin-mojito.jpg' }
    ],
    dessert: [
        { id: 25, name: 'Gulab Jamun', price: 80, image: '/images/gulab-jamun.jpg' },
        { id: 26, name: 'Rasmalai', price: 90, image: '/images/rasmalai.jpg' },
        { id: 27, name: 'Gajar Halwa', price: 100, image: '/images/gajar-halwa.jpg' },
        { id: 28, name: 'Ice Cream', price: 70, image: '/images/ice-cream.jpg' },
        { id: 41, name: 'Rasgulla', price: 75, image: '/images/rasgulla.jpg' },
        { id: 42, name: 'Kheer', price: 85, image: '/images/kheer.jpg' }
    ]
};

// GET /api/menu - Get all menu data
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                categories,
                foodItems
            }
        });
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch menu',
            message: error.message
        });
    }
});

// GET /api/menu/categories - Get all categories
router.get('/categories', (req, res) => {
    try {
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// GET /api/menu/items - Get all food items
router.get('/items', (req, res) => {
    try {
        res.json({
            success: true,
            data: foodItems
        });
    } catch (error) {
        console.error('Error fetching food items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch food items',
            message: error.message
        });
    }
});

// GET /api/menu/items/:categoryId - Get items by category
router.get('/items/:categoryId', (req, res) => {
    try {
        const { categoryId } = req.params;
        const items = foodItems[categoryId] || [];

        res.json({
            success: true,
            data: items,
            category: categories.find(cat => cat.id === categoryId)
        });
    } catch (error) {
        console.error('Error fetching category items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category items',
            message: error.message
        });
    }
});

// GET /api/menu/search - Search menu items
router.get('/search', (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const searchTerm = q.toLowerCase();
        const results = [];

        Object.entries(foodItems).forEach(([category, items]) => {
            items.forEach(item => {
                if (item.name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        ...item,
                        category: categories.find(c => c.id === category)
                    });
                }
            });
        });

        res.json({
            success: true,
            data: results,
            count: results.length,
            query: q
        });
    } catch (error) {
        console.error('Error searching menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search menu',
            message: error.message
        });
    }
});

module.exports = router;
