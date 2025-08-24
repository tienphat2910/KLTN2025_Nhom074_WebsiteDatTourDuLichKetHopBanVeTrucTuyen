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
                        _id: {
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
                            description: 'User phone number (10-11 digits)',
                            pattern: '^[0-9]{10,11}$'
                        },
                        dateOfBirth: {
                            type: 'string',
                            format: 'date',
                            description: 'User date of birth'
                        },
                        address: {
                            type: 'string',
                            description: 'User address',
                            maxLength: 200
                        },
                        bio: {
                            type: 'string',
                            description: 'User biography/description',
                            maxLength: 500
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
                        firebaseUid: {
                            type: 'string',
                            description: 'Firebase user ID'
                        },
                        lastLogin: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last login timestamp'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation date'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update date'
                        }
                    }
                },
                Tour: {
                    type: 'object',
                    required: ['title', 'destinationId', 'price', 'startDate', 'endDate'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Tour ID'
                        },
                        title: {
                            type: 'string',
                            description: 'Tour title',
                            example: 'Tour Phú Quốc 4N3Đ - Khám phá VinWonder, Safari, Bãi Sao, Cầu Hôn'
                        },
                        description: {
                            type: 'string',
                            description: 'Tour description'
                        },
                        destinationId: {
                            type: 'string',
                            description: 'Destination ID',
                            example: 'D004'
                        },
                        departureLocation: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    example: 'Hà Nội'
                                },
                                code: {
                                    type: 'string',
                                    description: 'City code',
                                    example: 'HAN'
                                },
                                fullName: {
                                    type: 'string',
                                    description: 'Full name of departure location',
                                    example: 'Hà Nội'
                                },
                                region: {
                                    type: 'string',
                                    enum: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
                                    description: 'Region of departure location',
                                    example: 'Miền Bắc'
                                }
                            },
                            required: ['name'],
                            description: 'Tour departure location information'
                        },
                        itinerary: {
                            oneOf: [
                                {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    description: 'Tour itinerary as array (legacy format)'
                                },
                                {
                                    type: 'object',
                                    patternProperties: {
                                        '^day\\d+$': {
                                            type: 'object',
                                            properties: {
                                                title: {
                                                    type: 'string',
                                                    example: 'Ngày 1: TP.HCM - PHÚ QUỐC (Ăn trưa, tối)'
                                                },
                                                description: {
                                                    type: 'string',
                                                    example: 'Tập trung tại sân bay Tân Sơn Nhất...'
                                                }
                                            },
                                            required: ['title', 'description']
                                        }
                                    },
                                    additionalProperties: false,
                                    description: 'Tour itinerary as object with day1, day2, etc.',
                                    example: {
                                        day1: {
                                            title: 'Ngày 1: TP.HCM - PHÚ QUỐC (Ăn trưa, tối)',
                                            description: 'Tập trung tại sân bay Tân Sơn Nhất...'
                                        },
                                        day2: {
                                            title: 'Ngày 2: BÃI SAO - CHÙA HỘ QUỐC',
                                            description: 'Tham quan Chùa Hộ Quốc...'
                                        }
                                    }
                                }
                            ],
                            description: 'Tour itinerary - supports both array and object formats'
                        },
                        startDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Tour start date'
                        },
                        endDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Tour end date'
                        },
                        price: {
                            type: 'number',
                            description: 'Tour price in VND',
                            example: 7989000
                        },
                        discount: {
                            type: 'number',
                            description: 'Discount percentage',
                            example: 0
                        },
                        pricingByAge: {
                            type: 'object',
                            properties: {
                                adult: {
                                    type: 'number',
                                    example: 7989000
                                },
                                child: {
                                    type: 'number',
                                    example: 6990000
                                },
                                infant: {
                                    type: 'number',
                                    example: 3790000
                                }
                            }
                        },
                        seats: {
                            type: 'number',
                            description: 'Total seats',
                            example: 30
                        },
                        availableSeats: {
                            type: 'number',
                            description: 'Available seats',
                            example: 30
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Tour images URLs'
                        },
                        isFeatured: {
                            type: 'boolean',
                            description: 'Whether tour is featured',
                            example: true
                        },
                        rating: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5,
                            description: 'Tour rating'
                        },
                        reviewCount: {
                            type: 'number',
                            description: 'Number of reviews'
                        },
                        category: {
                            type: 'string',
                            enum: ['adventure', 'cultural', 'relaxation', 'family', 'luxury', 'budget'],
                            description: 'Tour category'
                        },
                        duration: {
                            type: 'string',
                            description: 'Tour duration',
                            example: '4N3Đ'
                        },
                        slug: {
                            type: 'string',
                            description: 'URL-friendly slug'
                        },
                        isActive: {
                            type: 'boolean',
                            default: true,
                            description: 'Tour availability status'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update date'
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
                    required: ['name', 'destinationId'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Hotel ID'
                        },
                        name: {
                            type: 'string',
                            description: 'Hotel name',
                            example: 'Wyndham Garden Grandworld Phú Quốc'
                        },
                        destinationId: {
                            type: 'string',
                            description: 'Destination ID',
                            example: 'D004'
                        },
                        description: {
                            type: 'string',
                            description: 'Hotel description'
                        },
                        rating: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5,
                            description: 'Hotel rating',
                            example: 4.5
                        },
                        rooms: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: {
                                        type: 'string',
                                        description: 'Room type',
                                        example: 'Superior Twin'
                                    },
                                    size: {
                                        type: 'string',
                                        description: 'Room size',
                                        example: '29 m²'
                                    },
                                    price: {
                                        type: 'number',
                                        description: 'Room price in VND',
                                        example: 1450000
                                    },
                                    priceWithBreakfast: {
                                        type: 'number',
                                        description: 'Room price with breakfast in VND',
                                        example: 1850000
                                    },
                                    quantity: {
                                        type: 'number',
                                        description: 'Number of available rooms',
                                        example: 20
                                    },
                                    amenities: {
                                        type: 'array',
                                        items: {
                                            type: 'string'
                                        },
                                        description: 'Room amenities',
                                        example: ['2 giường đơn', 'Tối đa 2 người lớn + 1 trẻ em', 'Điều hòa']
                                    },
                                    images: {
                                        type: 'array',
                                        items: {
                                            type: 'string'
                                        },
                                        description: 'Room images URLs'
                                    }
                                },
                                required: ['type', 'price', 'quantity']
                            },
                            description: 'Hotel rooms'
                        },
                        gallery: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Hotel gallery images URLs'
                        },
                        contactInfo: {
                            type: 'object',
                            properties: {
                                phone: {
                                    type: 'string',
                                    description: 'Hotel phone number',
                                    example: '+84 297 388 6888'
                                },
                                email: {
                                    type: 'string',
                                    format: 'email',
                                    description: 'Hotel email address',
                                    example: 'info@wyndhamgrandworldphuquoc.com'
                                },
                                address: {
                                    type: 'string',
                                    description: 'Hotel address',
                                    example: 'Khu du lịch Bãi Dài, xã Gành Dầu, TP. Phú Quốc, tỉnh Kiên Giang'
                                }
                            },
                            description: 'Hotel contact information'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update date'
                        }
                    }
                },
                Destination: {
                    type: 'object',
                    required: ['_id', 'name', 'country', 'description', 'image'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Destination ID (e.g., D001)',
                            example: 'D001'
                        },
                        name: {
                            type: 'string',
                            description: 'Destination name',
                            example: 'TP. Hồ Chí Minh'
                        },
                        country: {
                            type: 'string',
                            description: 'Country name',
                            default: 'Việt Nam',
                            example: 'Việt Nam'
                        },
                        description: {
                            type: 'string',
                            description: 'Destination description',
                            example: 'Là thành phố lớn nhất và sầm uất nhất Việt Nam...'
                        },
                        image: {
                            type: 'string',
                            description: 'Destination image URL',
                            example: 'https://res.cloudinary.com/de5rurcwt/image/upload/v1754570813/LuTrip/night-vietnam-night-vietnam-wallpaper-preview_k9ipvw.jpg'
                        },
                        popular: {
                            type: 'boolean',
                            description: 'Whether destination is popular',
                            default: false,
                            example: true
                        },
                        slug: {
                            type: 'string',
                            description: 'URL-friendly slug',
                            example: 'tp-ho-chi-minh'
                        },
                        region: {
                            type: 'string',
                            enum: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
                            description: 'Vietnamese region',
                            example: 'Miền Nam'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update date'
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
                },
                Activity: {
                    type: 'object',
                    required: ['name', 'location', 'price'],
                    properties: {
                        _id: { type: 'string', description: 'Activity ID' },
                        name: { type: 'string', description: 'Tên hoạt động' },
                        description: { type: 'string', description: 'Mô tả hoạt động' },
                        location: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'Tên địa điểm' },
                                address: { type: 'string', description: 'Địa chỉ' }
                            }
                        },
                        price: {
                            type: 'object',
                            properties: {
                                retail: {
                                    type: 'object',
                                    properties: {
                                        adult: { type: 'number', description: 'Giá vé người lớn' },
                                        child: { type: 'number', description: 'Giá vé trẻ em' },
                                        locker: { type: 'number', description: 'Giá thuê tủ' },
                                        baby: { type: 'number', description: 'Giá vé em bé' },
                                        senior: { type: 'number', description: 'Giá vé người cao tuổi' }
                                    }
                                },
                                note: { type: 'string', description: 'Ghi chú giá vé' }
                            }
                        },
                        operating_hours: {
                            type: 'object',
                            properties: {
                                mon_to_sat: { type: 'string', description: 'Giờ mở cửa từ thứ 2 đến thứ 7' },
                                sunday_holidays: { type: 'string', description: 'Giờ mở cửa chủ nhật/ngày lễ' },
                                ticket_cutoff: { type: 'string', description: 'Giờ ngừng bán vé' },
                                rides_end: { type: 'string', description: 'Giờ kết thúc trò chơi' }
                            }
                        },
                        features: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Các tính năng nổi bật'
                        },
                        detail: {
                            type: 'object',
                            properties: {
                                d1: { type: 'string' },
                                d2: { type: 'string' },
                                d3: { type: 'string' },
                                d4: { type: 'string' },
                                d5: { type: 'string' },
                                d6: { type: 'string' },
                                d7: { type: 'string' }
                            }
                        },
                        gallery: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Ảnh hoạt động'
                        },
                        createdAt: { type: 'string', format: 'date-time', description: 'Ngày tạo' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Ngày cập nhật' },
                        popular: { type: 'boolean', description: 'Trạng thái nổi bật' }
                    }
                }
            },
            tags: [
                { name: 'Users', description: 'Operations about user' },
                { name: 'Tours', description: 'Operations about tours' },
                { name: 'Flights', description: 'Operations about flights' },
                { name: 'Hotels', description: 'Operations about hotels' },
                { name: 'Destinations', description: 'Operations about destinations' },
                { name: 'Activities', description: 'Các hoạt động giải trí, tham quan, vui chơi' }
            ]
        }
    },
    apis: [
        './routes/*.js',
        './index.js',
        './routes/flights.js',
        './routes/activities.js'
    ]
};

const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi
};
