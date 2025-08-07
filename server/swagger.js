const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LuTrip API',
            version: '1.0.0',
            description: 'API documentation for LuTrip - Travel booking platform',
            contact: {
                name: 'LuTrip Team',
                email: 'support@lutrip.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            },
            {
                url: 'https://api.lutrip.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['email', 'password', 'fullName'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        fullName: {
                            type: 'string',
                            description: 'User full name'
                        },
                        password: {
                            type: 'string',
                            minLength: 6,
                            description: 'User password (min 6 characters)'
                        },
                        avatar: {
                            type: 'string',
                            description: 'User avatar URL'
                        },
                        phone: {
                            type: 'string',
                            description: 'User phone number (optional)'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'admin'],
                            default: 'user',
                            description: 'User role'
                        },
                        isVerified: {
                            type: 'boolean',
                            default: false,
                            description: 'Email verification status'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation date'
                        }
                    }
                },
                Tour: {
                    type: 'object',
                    required: ['title', 'destination', 'price', 'duration'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Tour ID'
                        },
                        title: {
                            type: 'string',
                            description: 'Tour title'
                        },
                        destination: {
                            type: 'string',
                            description: 'Tour destination'
                        },
                        price: {
                            type: 'number',
                            description: 'Tour price in VND'
                        },
                        duration: {
                            type: 'string',
                            description: 'Tour duration (e.g., "3 ngày 2 đêm")'
                        },
                        description: {
                            type: 'string',
                            description: 'Tour description'
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Tour images URLs'
                        },
                        highlights: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Tour highlights'
                        },
                        includes: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'What\'s included in the tour'
                        },
                        category: {
                            type: 'string',
                            enum: ['adventure', 'cultural', 'relaxation', 'family'],
                            description: 'Tour category'
                        },
                        maxGuests: {
                            type: 'number',
                            description: 'Maximum number of guests'
                        },
                        rating: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5,
                            description: 'Tour rating'
                        },
                        isActive: {
                            type: 'boolean',
                            default: true,
                            description: 'Tour availability status'
                        }
                    }
                },
                Flight: {
                    type: 'object',
                    required: ['airline', 'from', 'to', 'price', 'departureTime'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Flight ID'
                        },
                        airline: {
                            type: 'string',
                            description: 'Airline name'
                        },
                        from: {
                            type: 'string',
                            description: 'Departure airport'
                        },
                        to: {
                            type: 'string',
                            description: 'Arrival airport'
                        },
                        price: {
                            type: 'number',
                            description: 'Flight price in VND'
                        },
                        departureTime: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Departure time'
                        },
                        arrivalTime: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Arrival time'
                        },
                        duration: {
                            type: 'string',
                            description: 'Flight duration'
                        },
                        aircraft: {
                            type: 'string',
                            description: 'Aircraft type'
                        },
                        availableSeats: {
                            type: 'number',
                            description: 'Number of available seats'
                        }
                    }
                },
                Hotel: {
                    type: 'object',
                    required: ['name', 'location', 'pricePerNight'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Hotel ID'
                        },
                        name: {
                            type: 'string',
                            description: 'Hotel name'
                        },
                        location: {
                            type: 'string',
                            description: 'Hotel location'
                        },
                        pricePerNight: {
                            type: 'number',
                            description: 'Price per night in VND'
                        },
                        rating: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5,
                            description: 'Hotel rating'
                        },
                        amenities: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Hotel amenities'
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Hotel images URLs'
                        },
                        description: {
                            type: 'string',
                            description: 'Hotel description'
                        },
                        availableRooms: {
                            type: 'number',
                            description: 'Number of available rooms'
                        }
                    }
                },
                Entertainment: {
                    type: 'object',
                    required: ['name', 'location', 'price', 'type'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Entertainment ID'
                        },
                        name: {
                            type: 'string',
                            description: 'Entertainment venue name'
                        },
                        location: {
                            type: 'string',
                            description: 'Entertainment venue location'
                        },
                        price: {
                            type: 'number',
                            description: 'Ticket price in VND'
                        },
                        type: {
                            type: 'string',
                            enum: ['theme_park', 'museum', 'show', 'activity'],
                            description: 'Entertainment type'
                        },
                        highlights: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Entertainment highlights'
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Entertainment images URLs'
                        },
                        description: {
                            type: 'string',
                            description: 'Entertainment description'
                        },
                        openingHours: {
                            type: 'string',
                            description: 'Opening hours'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        error: {
                            type: 'string',
                            description: 'Error details'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            description: 'Success message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js', './index.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi
};
