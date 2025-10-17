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
                    required: ['_id', 'name', 'description', 'image'],
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
                            enum: ['Miền Bắc', 'Miền Trung', 'Miền Nam', 'Tây Nguyên'],
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
                        popular: { type: 'boolean', description: 'Trạng thái nổi bật' },
                        destinationId: { type: 'string', description: 'ID địa điểm' }
                    }
                },
                Booking: {
                    type: 'object',
                    required: ['userId', 'bookingDate', 'totalPrice', 'status', 'bookingType'],
                    properties: {
                        _id: { type: 'string', description: 'Booking ID' },
                        userId: { type: 'string', description: 'User ID' },
                        bookingDate: { type: 'string', format: 'date-time', description: 'Booking date' },
                        totalPrice: { type: 'number', description: 'Total price' },
                        discountCode: { type: 'string', description: 'Discount code ID' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
                            description: 'Booking status'
                        },
                        bookingType: { type: 'string', description: 'Booking type' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                BookingTour: {
                    type: 'object',
                    required: ['bookingId', 'tourId', 'numAdults', 'numChildren', 'numInfants', 'priceByAge', 'subtotal', 'status'],
                    properties: {
                        _id: { type: 'string', description: 'BookingTour ID' },
                        bookingId: { type: 'string', description: 'Booking ID' },
                        tourId: { type: 'string', description: 'Tour ID' },
                        numAdults: { type: 'number', description: 'Number of adults' },
                        numChildren: { type: 'number', description: 'Number of children' },
                        numInfants: { type: 'number', description: 'Number of infants' },
                        priceByAge: {
                            type: 'object',
                            properties: {
                                adult: { type: 'number', description: 'Giá người lớn', example: 7989000 },
                                child: { type: 'number', description: 'Giá trẻ em', example: 6990000 },
                                infant: { type: 'number', description: 'Giá em bé', example: 3790000 }
                            },
                            required: ['adult', 'child', 'infant'],
                            description: 'Giá theo từng nhóm tuổi'
                        },
                        subtotal: { type: 'number', description: 'Subtotal price' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
                            description: 'BookingTour status'
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Discount: {
                    type: 'object',
                    required: ['code', 'description', 'discountType', 'value', 'validFrom', 'validUntil', 'usageLimit'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Discount ID'
                        },
                        code: {
                            type: 'string',
                            description: 'Discount code (uppercase)',
                            example: 'WELCOME50K'
                        },
                        description: {
                            type: 'string',
                            description: 'Discount description',
                            example: 'Mã giảm giá chào mừng thành viên mới'
                        },
                        discountType: {
                            type: 'string',
                            enum: ['percentage', 'fixed'],
                            description: 'Type of discount',
                            example: 'fixed'
                        },
                        value: {
                            type: 'number',
                            description: 'Discount value (percentage 0-100 or fixed amount)',
                            example: 50000
                        },
                        validFrom: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Start date',
                            example: '2024-01-01T00:00:00.000Z'
                        },
                        validUntil: {
                            type: 'string',
                            format: 'date-time',
                            description: 'End date',
                            example: '2024-12-31T23:59:59.000Z'
                        },
                        usageLimit: {
                            type: 'number',
                            description: 'Maximum usage count',
                            example: 500
                        },
                        usedCount: {
                            type: 'number',
                            description: 'Current usage count',
                            default: 0,
                            example: 123
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether discount is active',
                            default: true,
                            example: true
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
                }
            },
            tags: [
                { name: 'Users', description: 'Operations about user' },
                { name: 'Tours', description: 'Operations about tours' },
                { name: 'Flights', description: 'Operations about flights' },
                { name: 'Hotels', description: 'Operations about hotels' },
                { name: 'Destinations', description: 'Operations about destinations' },
                { name: 'Activities', description: 'Các hoạt động giải trí, tham quan, vui chơi' },
                { name: 'Booking', description: 'Operations about booking' },
                { name: 'BookingTour', description: 'Operations about booking tour' },
                { name: 'Discounts', description: 'Discount code management' }
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

// Thêm mô tả API airports vào specs cho swagger test
specs.paths = specs.paths || {};
specs.paths['/api/airports'] = {
    get: {
        tags: ['Airports'],
        summary: 'Lấy danh sách sân bay',
        description: 'Trả về danh sách các sân bay.',
        responses: {
            200: {
                description: 'Danh sách sân bay',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Airport'
                            }
                        }
                    }
                }
            }
        }
    }
};
specs.paths['/api/airports/{id}'] = {
    get: {
        tags: ['Airports'],
        summary: 'Lấy thông tin chi tiết sân bay',
        description: 'Trả về thông tin chi tiết của một sân bay theo id.',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'ID sân bay'
            }
        ],
        responses: {
            200: {
                description: 'Thông tin sân bay',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Airport'
                        }
                    }
                }
            },
            404: {
                description: 'Không tìm thấy sân bay'
            }
        }
    }
};

// Thêm schema Airport vào components nếu chưa có
specs.components = specs.components || {};
specs.components.schemas = specs.components.schemas || {};
specs.components.schemas.Airport = {
    type: 'object',
    required: ['_id', 'name', 'city', 'icao', 'iata'],
    properties: {
        _id: { type: 'string', description: 'ID sân bay', example: 'A001' },
        name: { type: 'string', description: 'Tên sân bay', example: 'Sân bay Quốc tế Nội Bài' },
        city: { type: 'string', description: 'Thành phố', example: 'Hà Nội' },
        icao: { type: 'string', description: 'Mã ICAO', example: 'VVNB' },
        iata: { type: 'string', description: 'Mã IATA', example: 'HAN' }
    }
};

// Thêm mô tả API booking và bookingtours vào specs.paths
specs.paths['/api/booking'] = {
    get: {
        tags: ['Booking'],
        summary: 'Lấy danh sách booking',
        description: 'Trả về danh sách các booking.',
        responses: {
            200: {
                description: 'Danh sách booking',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                data: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Booking' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    post: {
        tags: ['Booking'],
        summary: 'Tạo booking mới',
        description: 'Tạo một booking mới.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Booking' }
                }
            }
        },
        responses: {
            201: {
                description: 'Tạo booking thành công',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Booking' }
                    }
                }
            }
        }
    }
};

specs.paths['/api/booking/{id}'] = {
    get: {
        tags: ['Booking'],
        summary: 'Lấy thông tin booking theo ID',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'Booking ID'
            }
        ],
        responses: {
            200: {
                description: 'Thông tin booking',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Booking' }
                    }
                }
            },
            404: { description: 'Không tìm thấy booking' }
        }
    },
    put: {
        tags: ['Booking'],
        summary: 'Cập nhật booking',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'Booking ID'
            }
        ],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Booking' }
                }
            }
        },
        responses: {
            200: {
                description: 'Cập nhật booking thành công',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Booking' }
                    }
                }
            },
            404: { description: 'Không tìm thấy booking' }
        }
    },
    delete: {
        tags: ['Booking'],
        summary: 'Xóa booking',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'Booking ID'
            }
        ],
        responses: {
            200: { description: 'Xóa booking thành công' },
            404: { description: 'Không tìm thấy booking' }
        }
    }
};

specs.paths['/api/bookingtours'] = {
    get: {
        tags: ['BookingTour'],
        summary: 'Lấy danh sách booking tour',
        description: 'Trả về danh sách các booking tour.',
        responses: {
            200: {
                description: 'Danh sách booking tour',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                data: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/BookingTour' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    post: {
        tags: ['BookingTour'],
        summary: 'Tạo booking tour mới',
        description: 'Tạo một booking tour mới.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/BookingTour' }
                }
            }
        },
        responses: {
            201: {
                description: 'Tạo booking tour thành công',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/BookingTour' }
                    }
                }
            }
        }
    }
};

specs.paths['/api/bookingtours/{id}'] = {
    get: {
        tags: ['BookingTour'],
        summary: 'Lấy thông tin booking tour theo ID',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'BookingTour ID'
            }
        ],
        responses: {
            200: {
                description: 'Thông tin booking tour',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/BookingTour' }
                    }
                }
            },
            404: { description: 'Không tìm thấy booking tour' }
        }
    },
    put: {
        tags: ['BookingTour'],
        summary: 'Cập nhật booking tour',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'BookingTour ID'
            }
        ],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/BookingTour' }
                }
            }
        },
        responses: {
            200: {
                description: 'Cập nhật booking tour thành công',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/BookingTour' }
                    }
                }
            },
            404: { description: 'Không tìm thấy booking tour' }
        }
    },
    delete: {
        tags: ['BookingTour'],
        summary: 'Xóa booking tour',
        parameters: [
            {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'BookingTour ID'
            }
        ],
        responses: {
            200: { description: 'Xóa booking tour thành công' },
            404: { description: 'Không tìm thấy booking tour' }
        }
    }
};

module.exports = {
    specs,
    swaggerUi
};

