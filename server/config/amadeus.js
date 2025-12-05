// Amadeus API Configuration for Lutrip
// Đọc từ biến môi trường .env

const AMADEUS_CONFIG = {
    BASE_URL: process.env.AMADEUS_BASE_URL,
    API_KEY: process.env.AMADEUS_API_KEY,
    API_SECRET: process.env.AMADEUS_API_SECRET,
    TOKEN_URL: '/v1/security/oauth2/token',
    // Flight APIs
    FLIGHT_OFFERS_URL: '/v2/shopping/flight-offers',
    FLIGHT_OFFERS_PRICING_URL: '/v1/shopping/flight-offers/pricing',
    SEATMAP_URL: '/v1/shopping/seatmaps',
    FLIGHT_INSPIRATION_URL: '/v1/shopping/flight-destinations',
    FLIGHT_CHEAPEST_DATE_URL: '/v1/shopping/flight-dates',
    // Reference Data APIs
    AIRPORT_CITY_SEARCH_URL: '/v1/reference-data/locations',
    AIRPORT_NEAREST_URL: '/v1/reference-data/locations/airports',
    AIRLINE_URL: '/v1/reference-data/airlines',
    // Schedule APIs
    FLIGHT_SCHEDULES_URL: '/v2/schedule/flights'
};

// Vietnam Airlines codes (các hãng bay Việt Nam)
const VIETNAM_AIRLINES = {
    VN: 'Vietnam Airlines',
    VJ: 'VietJet Air',
    QH: 'Bamboo Airways',
    BL: 'Pacific Airlines (Jetstar Pacific)',
    OV: 'Vietravel Airlines'
};

// Vietnam Airport IATA codes
const VIETNAM_AIRPORTS = [
    'SGN', // Tân Sơn Nhất - TP.HCM
    'HAN', // Nội Bài - Hà Nội
    'DAD', // Đà Nẵng
    'CXR', // Cam Ranh - Nha Trang
    'PQC', // Phú Quốc
    'VCA', // Cần Thơ
    'HPH', // Hải Phòng
    'VII', // Vinh
    'HUI', // Huế
    'BMV', // Buôn Ma Thuột
    'DLI', // Đà Lạt
    'UIH', // Quy Nhơn
    'VDO', // Vân Đồn
    'VDH', // Đồng Hới
    'TBB', // Tuy Hòa
    'PXU', // Pleiku
    'VCL', // Chu Lai
    'THD', // Thanh Hóa
    'DIN', // Điện Biên
    'VKG', // Rạch Giá
    'CAH', // Cà Mau
    'VCS'  // Côn Đảo
];

// Cache token để tránh gọi lại mỗi lần
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get Amadeus access token
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
    // Kiểm tra nếu token còn hiệu lực (trừ 60s buffer)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
        return cachedToken;
    }

    try {
        const response = await fetch(`${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.TOKEN_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: AMADEUS_CONFIG.API_KEY,
                client_secret: AMADEUS_CONFIG.API_SECRET
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get Amadeus token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        cachedToken = data.access_token;
        // Token hết hạn sau expires_in giây (thường là 1799s ~ 30 phút)
        tokenExpiry = Date.now() + (data.expires_in * 1000);

        console.log('[Amadeus] Token obtained successfully, expires in:', data.expires_in, 'seconds');
        return cachedToken;
    } catch (error) {
        console.error('[Amadeus] Error getting access token:', error.message);
        throw error;
    }
}

/**
 * Search flight offers from Amadeus
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Flight offers response
 */
async function searchFlightOffers(params) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();

    // Required parameters
    searchParams.set('originLocationCode', params.originLocationCode);
    searchParams.set('destinationLocationCode', params.destinationLocationCode);
    searchParams.set('departureDate', params.departureDate);
    searchParams.set('adults', params.adults || '1');

    // Optional parameters
    if (params.returnDate) searchParams.set('returnDate', params.returnDate);
    if (params.children) searchParams.set('children', params.children);
    if (params.infants) searchParams.set('infants', params.infants);
    if (params.travelClass) searchParams.set('travelClass', params.travelClass);
    if (params.includedAirlineCodes) searchParams.set('includedAirlineCodes', params.includedAirlineCodes);
    if (params.excludedAirlineCodes) searchParams.set('excludedAirlineCodes', params.excludedAirlineCodes);
    if (params.nonStop) searchParams.set('nonStop', params.nonStop);
    if (params.currencyCode) searchParams.set('currencyCode', params.currencyCode || 'VND');
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice);
    if (params.max) searchParams.set('max', params.max || '10');

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.FLIGHT_OFFERS_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Searching flights:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Search error:', response.status, errorText);
            throw new Error(`Amadeus search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Amadeus] Found', data.data?.length || 0, 'flight offers');
        return data;
    } catch (error) {
        console.error('[Amadeus] Search flight offers error:', error.message);
        throw error;
    }
}

/**
 * Get flight offer pricing (confirm price)
 * @param {Object} flightOffer - Flight offer to price
 * @returns {Promise<Object>} Pricing response
 */
async function getFlightOfferPricing(flightOffer) {
    const token = await getAccessToken();

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.FLIGHT_OFFERS_PRICING_URL}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    type: 'flight-offers-pricing',
                    flightOffers: Array.isArray(flightOffer) ? flightOffer : [flightOffer]
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Pricing error:', response.status, errorText);
            throw new Error(`Amadeus pricing failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[Amadeus] Get pricing error:', error.message);
        throw error;
    }
}

/**
 * Get seat map for a flight offer
 * @param {Object} flightOffer - Flight offer
 * @returns {Promise<Object>} Seatmap response
 */
async function getSeatMap(flightOffer) {
    const token = await getAccessToken();

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.SEATMAP_URL}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                data: Array.isArray(flightOffer) ? flightOffer : [flightOffer]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Seatmap error:', response.status, errorText);
            throw new Error(`Amadeus seatmap failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[Amadeus] Get seatmap error:', error.message);
        throw error;
    }
}

/**
 * Search airports and cities
 * @param {Object} params - Search parameters
 * @param {string} params.keyword - Search keyword (city name, airport name, IATA code)
 * @param {string} params.subType - AIRPORT, CITY, or both
 * @param {string} params.countryCode - Filter by country (VN for Vietnam)
 * @returns {Promise<Object>} Locations response
 */
async function searchAirports(params) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();
    searchParams.set('keyword', params.keyword);
    searchParams.set('subType', params.subType || 'AIRPORT,CITY');
    if (params.countryCode) searchParams.set('countryCode', params.countryCode);
    if (params.page) searchParams.set('page[limit]', params.page.limit || '10');

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.AIRPORT_CITY_SEARCH_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Searching airports:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Airport search error:', response.status, errorText);
            throw new Error(`Amadeus airport search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Amadeus] Found', data.data?.length || 0, 'locations');
        return data;
    } catch (error) {
        console.error('[Amadeus] Search airports error:', error.message);
        throw error;
    }
}

/**
 * Get Vietnam airports only
 * @param {string} keyword - Optional search keyword
 * @returns {Promise<Object>} Vietnam airports
 */
async function getVietnamAirports(keyword = '') {
    return searchAirports({
        keyword: keyword || 'VN',
        subType: 'AIRPORT',
        countryCode: 'VN',
        page: { limit: 50 }
    });
}

/**
 * Get nearest airports by coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} radius - Search radius in km (default 500)
 * @returns {Promise<Object>} Nearest airports
 */
async function getNearestAirports(latitude, longitude, radius = 500) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();
    searchParams.set('latitude', latitude.toString());
    searchParams.set('longitude', longitude.toString());
    searchParams.set('radius', radius.toString());
    searchParams.set('page[limit]', '10');

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.AIRPORT_NEAREST_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Getting nearest airports:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Nearest airports error:', response.status, errorText);
            throw new Error(`Amadeus nearest airports failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[Amadeus] Get nearest airports error:', error.message);
        throw error;
    }
}

/**
 * Search airlines
 * @param {string} airlineCodes - Comma-separated airline IATA codes (e.g., "VN,VJ,QH")
 * @returns {Promise<Object>} Airlines information
 */
async function searchAirlines(airlineCodes) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();
    searchParams.set('airlineCodes', airlineCodes);

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.AIRLINE_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Searching airlines:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Airline search error:', response.status, errorText);
            throw new Error(`Amadeus airline search failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Amadeus] Found', data.data?.length || 0, 'airlines');
        return data;
    } catch (error) {
        console.error('[Amadeus] Search airlines error:', error.message);
        throw error;
    }
}

/**
 * Get Vietnam airlines information
 * @returns {Promise<Object>} Vietnam airlines
 */
async function getVietnamAirlines() {
    const codes = Object.keys(VIETNAM_AIRLINES).join(',');
    return searchAirlines(codes);
}

/**
 * Get flight schedules (actual flight timings)
 * @param {Object} params - Schedule parameters
 * @param {string} params.carrierCode - Airline IATA code (e.g., VN, VJ)
 * @param {string} params.flightNumber - Flight number
 * @param {string} params.scheduledDepartureDate - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} Flight schedules
 */
async function getFlightSchedules(params) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();
    searchParams.set('carrierCode', params.carrierCode);
    searchParams.set('flightNumber', params.flightNumber);
    searchParams.set('scheduledDepartureDate', params.scheduledDepartureDate);

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.FLIGHT_SCHEDULES_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Getting flight schedules:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Flight schedules error:', response.status, errorText);
            throw new Error(`Amadeus flight schedules failed: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[Amadeus] Get flight schedules error:', error.message);
        throw error;
    }
}

/**
 * Get flight inspiration (cheapest destinations from origin)
 * @param {Object} params - Inspiration parameters
 * @param {string} params.origin - Origin airport IATA code (e.g., SGN, HAN)
 * @param {string} params.departureDate - Optional departure date (YYYY-MM-DD)
 * @param {boolean} params.oneWay - One way or round trip
 * @param {number} params.duration - Trip duration in days
 * @param {boolean} params.nonStop - Direct flights only
 * @param {number} params.maxPrice - Maximum price
 * @param {string} params.currency - Currency code (default VND)
 * @returns {Promise<Object>} Flight destinations with prices
 */
async function getFlightInspiration(params) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();
    searchParams.set('origin', params.origin);
    if (params.departureDate) searchParams.set('departureDate', params.departureDate);
    if (params.oneWay !== undefined) searchParams.set('oneWay', params.oneWay.toString());
    if (params.duration) searchParams.set('duration', params.duration.toString());
    if (params.nonStop !== undefined) searchParams.set('nonStop', params.nonStop.toString());
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    searchParams.set('currency', params.currency || 'VND');

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.FLIGHT_INSPIRATION_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Getting flight inspiration:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Flight inspiration error:', response.status, errorText);
            throw new Error(`Amadeus flight inspiration failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Amadeus] Found', data.data?.length || 0, 'destinations');
        return data;
    } catch (error) {
        console.error('[Amadeus] Get flight inspiration error:', error.message);
        throw error;
    }
}

/**
 * Get cheapest flight dates for a route
 * @param {Object} params - Search parameters
 * @param {string} params.origin - Origin airport IATA code
 * @param {string} params.destination - Destination airport IATA code
 * @param {string} params.departureDate - Optional departure date (YYYY-MM-DD) for range start
 * @param {boolean} params.oneWay - One way or round trip
 * @param {number} params.duration - Trip duration in days (for round trip)
 * @param {boolean} params.nonStop - Direct flights only
 * @param {number} params.maxPrice - Maximum price
 * @param {string} params.currency - Currency code (default VND)
 * @returns {Promise<Object>} Cheapest dates with prices
 */
async function getCheapestFlightDates(params) {
    const token = await getAccessToken();

    const searchParams = new URLSearchParams();
    searchParams.set('origin', params.origin);
    searchParams.set('destination', params.destination);
    if (params.departureDate) searchParams.set('departureDate', params.departureDate);
    if (params.oneWay !== undefined) searchParams.set('oneWay', params.oneWay.toString());
    if (params.duration) searchParams.set('duration', params.duration.toString());
    if (params.nonStop !== undefined) searchParams.set('nonStop', params.nonStop.toString());
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    searchParams.set('currency', params.currency || 'VND');

    const url = `${AMADEUS_CONFIG.BASE_URL}${AMADEUS_CONFIG.FLIGHT_CHEAPEST_DATE_URL}?${searchParams.toString()}`;

    console.log('[Amadeus] Getting cheapest flight dates:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Amadeus] Cheapest dates error:', response.status, errorText);
            throw new Error(`Amadeus cheapest dates failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Amadeus] Found', data.data?.length || 0, 'dates');
        return data;
    } catch (error) {
        console.error('[Amadeus] Get cheapest dates error:', error.message);
        throw error;
    }
}

module.exports = {
    AMADEUS_CONFIG,
    VIETNAM_AIRLINES,
    VIETNAM_AIRPORTS,
    getAccessToken,
    searchFlightOffers,
    getFlightOfferPricing,
    getSeatMap,
    // New exports
    searchAirports,
    getVietnamAirports,
    getNearestAirports,
    searchAirlines,
    getVietnamAirlines,
    getFlightSchedules,
    getFlightInspiration,
    getCheapestFlightDates
};
