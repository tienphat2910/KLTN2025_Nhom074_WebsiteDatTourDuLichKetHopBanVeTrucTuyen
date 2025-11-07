// Destination data types and mock data
export interface FamousPlace {
  id: string;
  name: string;
  image: string;
  description?: string;
}

export interface TravelExperience {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  category: string;
}

export interface WeatherInfo {
  season: string;
  months: string;
  tempHigh: number;
  tempLow: number;
  description: string;
}

export interface DestinationInfo {
  timezone: string;
  timezoneOffset: string;
  currency: string;
  currencyCode: string;
  exchangeRate: string;
  officialLanguage: string;
  bestTimeToVisit: {
    period: string;
    season: string;
  }[];
  idealDuration: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface DestinationData {
  slug: string;
  famousPlaces: FamousPlace[];
  travelExperiences: TravelExperience[];
  weatherInfo: WeatherInfo[];
  destinationInfo: DestinationInfo;
  faqs: FAQ[];
}

// Mock data for destinations
export const destinationData: Record<string, DestinationData> = {
  "tp-ho-chi-minh": {
    slug: "tp-ho-chi-minh",
    famousPlaces: [
      {
        id: "1",
        name: "Bưu điện Trung tâm",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        description: "Công trình kiến trúc Pháp cổ điển nổi tiếng"
      },
      {
        id: "2",
        name: "Nhà thờ Đức Bà",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
        description: "Biểu tượng kiến trúc Gothic tại Sài Gòn"
      },
      {
        id: "3",
        name: "Dinh Độc Lập",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/du-lich-phu-quoc-kinh-nghiem-va-thong-tin-huu-ich_eomet8.jpg",
        description: "Nơi diễn ra sự kiện lịch sử quan trọng"
      },
      {
        id: "4",
        name: "Chợ Bến Thành",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754568367/LuTrip/hinh-nen-viet-nam-4k35_piebu1.jpg",
        description: "Chợ truyền thống nhộn nhịp nhất Sài Gòn"
      }
    ],
    travelExperiences: [
      {
        id: "1",
        title: "Món ngon Sài Gòn",
        description: "Khám phá ẩm thực đường phố đặc trưng của Sài Gòn với những món ăn ngon khó cưỡng",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        link: "https://www.klook.com/vi/blog/mon-ngon-sai-gon/?spm=City.BlogCard_LIST&clickId=701c4892d3",
        category: "Ẩm thực"
      },
      {
        id: "2",
        title: "Kinh nghiệm du lịch Sài Gòn",
        description: "Hướng dẫn chi tiết để có chuyến đi Sài Gòn hoàn hảo",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
        link: "https://www.klook.com/vi/blog/du-lich-sai-gon/?spm=City.BlogCard_LIST&clickId=701c4892d3",
        category: "Kinh nghiệm"
      }
    ],
    weatherInfo: [
      {
        season: "Mùa khô",
        months: "THG 12 - THG 4",
        tempHigh: 35,
        tempLow: 24,
        description: "Thời tiết khô ráo, dễ chịu"
      },
      {
        season: "Mùa mưa",
        months: "THG 5 - THG 11",
        tempHigh: 31,
        tempLow: 24,
        description: "Nhiều mưa, độ ẩm cao"
      }
    ],
    destinationInfo: {
      timezone: "GMT +07:00",
      timezoneOffset: "Không chênh lệch thời gian",
      currency: "Việt Nam Đồng",
      currencyCode: "VND",
      exchangeRate: "1VND = 1.00VND",
      officialLanguage: "Tiếng Việt",
      bestTimeToVisit: [
        { period: "THG 4 - THG 6", season: "Mùa Xuân" },
        { period: "THG 9 - THG 11", season: "Mùa Thu" },
        { period: "THG 1 - THG 2", season: "Chợ hoa mùa Tết" }
      ],
      idealDuration: "3 ngày"
    },
    faqs: [
      {
        id: "1",
        question: "Thời điểm nào là tốt nhất để du lịch Sài Gòn?",
        answer: "Thời điểm tốt nhất là từ tháng 12 đến tháng 4 (mùa khô) khi thời tiết mát mẻ và ít mưa. Tháng 1-2 còn có chợ hoa Tết rất đặc trưng."
      },
      {
        id: "2",
        question: "Phương tiện di chuyển nào tiện lợi nhất ở Sài Gòn?",
        answer: "Grab bike, taxi hoặc xe buýt là lựa chọn phổ biến. Ở trung tâm, bạn có thể đi bộ hoặc thuê xe đạp."
      },
      {
        id: "3",
        question: "Những món ăn nào nên thử ở Sài Gòn?",
        answer: "Phở, bún bò Huế, cơm tấm, bánh mì, và các loại hải sản tươi sống là những món không thể bỏ qua."
      },
      {
        id: "4",
        question: "Du lịch Sài Gòn có an toàn không?",
        answer: "Sài Gòn tương đối an toàn cho du khách. Tuy nhiên, cần cẩn thận với tài sản cá nhân và tuân thủ luật giao thông."
      }
    ]
  },
  "ha-noi": {
    slug: "ha-noi",
    famousPlaces: [
      {
        id: "1",
        name: "Hồ Hoàn Kiếm",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        description: "Hồ nước trung tâm với đền Ngọc Sơn"
      },
      {
        id: "2",
        name: "Văn Miếu Quốc Tử Giám",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
        description: "Trường đại học đầu tiên của Việt Nam"
      },
      {
        id: "3",
        name: "Lăng Chủ tịch Hồ Chí Minh",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/du-lich-phu-quoc-kinh-nghiem-va-thong-tin-huu-ich_eomet8.jpg",
        description: "Nơi an nghỉ của Chủ tịch Hồ Chí Minh"
      }
    ],
    travelExperiences: [
      {
        id: "1",
        title: "Ẩm thực Hà Nội",
        description: "Khám phá những món ăn đặc trưng của Hà Nội xưa",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        link: "https://www.klook.com/vi/blog/am-thuc-ha-noi/?spm=City.BlogCard_LIST&clickId=701c4892d3",
        category: "Ẩm thực"
      }
    ],
    weatherInfo: [
      {
        season: "Mùa khô",
        months: "THG 12 - THG 4",
        tempHigh: 20,
        tempLow: 10,
        description: "Thời tiết lạnh, nhiều sương mù"
      },
      {
        season: "Mùa mưa",
        months: "THG 5 - THG 11",
        tempHigh: 33,
        tempLow: 24,
        description: "Nóng ẩm, mưa nhiều"
      }
    ],
    destinationInfo: {
      timezone: "GMT +07:00",
      timezoneOffset: "Không chênh lệch thời gian",
      currency: "Việt Nam Đồng",
      currencyCode: "VND",
      exchangeRate: "1VND = 1.00VND",
      officialLanguage: "Tiếng Việt",
      bestTimeToVisit: [
        { period: "THG 9 - THG 11", season: "Mùa Thu" },
        { period: "THG 3 - THG 4", season: "Mùa Xuân" }
      ],
      idealDuration: "3-4 ngày"
    },
    faqs: [
      {
        id: "1",
        question: "Thời tiết Hà Nội như thế nào?",
        answer: "Hà Nội có 4 mùa rõ rệt. Mùa hè nóng ẩm, mùa đông lạnh với sương mù."
      },
      {
        id: "2",
        question: "Có cần visa để du lịch Hà Nội không?",
        answer: "Du khách Việt Nam không cần visa. Du khách quốc tế cần xin visa Việt Nam."
      }
    ]
  },
  "da-nang": {
    slug: "da-nang",
    famousPlaces: [
      {
        id: "1",
        name: "Cầu Rồng",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        description: "Cầu biểu tượng phun lửa và nước"
      },
      {
        id: "2",
        name: "Bãi biển Mỹ Khê",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
        description: "Bãi biển đẹp nhất Việt Nam"
      },
      {
        id: "3",
        name: "Cầu Vàng",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/du-lich-phu-quoc-kinh-nghiem-va-thong-tin-huu-ich_eomet8.jpg",
        description: "Cầu vàng nổi tiếng trên Bà Nà Hills"
      }
    ],
    travelExperiences: [
      {
        id: "1",
        title: "Du lịch Đà Nẵng",
        description: "Hướng dẫn du lịch Đà Nẵng đầy đủ nhất",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        link: "https://www.klook.com/vi/blog/du-lich-da-nang/?spm=City.BlogCard_LIST&clickId=701c4892d3",
        category: "Kinh nghiệm"
      }
    ],
    weatherInfo: [
      {
        season: "Mùa khô",
        months: "THG 2 - THG 8",
        tempHigh: 30,
        tempLow: 22,
        description: "Ít mưa, thời tiết ổn định"
      },
      {
        season: "Mùa mưa",
        months: "THG 9 - THG 1",
        tempHigh: 27,
        tempLow: 20,
        description: "Nhiều mưa, độ ẩm cao"
      }
    ],
    destinationInfo: {
      timezone: "GMT +07:00",
      timezoneOffset: "Không chênh lệch thời gian",
      currency: "Việt Nam Đồng",
      currencyCode: "VND",
      exchangeRate: "1VND = 1.00VND",
      officialLanguage: "Tiếng Việt",
      bestTimeToVisit: [
        { period: "THG 2 - THG 8", season: "Mùa khô" },
        { period: "THG 12 - THG 1", season: "Mùa lễ hội" }
      ],
      idealDuration: "2-3 ngày"
    },
    faqs: [
      {
        id: "1",
        question: "Đà Nẵng có những bãi biển nào đẹp?",
        answer: "Đà Nẵng có bãi biển Mỹ Khê được评为 bãi biển đẹp nhất Việt Nam, ngoài ra còn có bãi biển Sơn Trà, Non Nước."
      },
      {
        id: "2",
        question: "Cách di chuyển từ sân bay Đà Nẵng vào trung tâm?",
        answer: "Có thể đi taxi, grab hoặc xe buýt. Taxi khoảng 30-40 phút, giá khoảng 200.000-300.000 VND."
      }
    ]
  },
  "phu-quoc": {
    slug: "phu-quoc",
    famousPlaces: [
      {
        id: "1",
        name: "Dinh Cậu",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567626/LuTrip/dulichsapa-1650268886-1480-1650277620_bcldcd.png",
        description: "Ngôi đền linh thiêng trên đảo"
      },
      {
        id: "2",
        name: "Vinpearl Resort",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/anh-vinh-ha-long-59_qp6nt2.jpg",
        description: "Khu nghỉ dưỡng sang trọng"
      },
      {
        id: "3",
        name: "Chợ đêm Dinh Cậu",
        image: "https://res.cloudinary.com/de5rurcwt/image/upload/v1754567624/LuTrip/du-lich-phu-quoc-kinh-nghiem-va-thong-tin-huu-ich_eomet8.jpg",
        description: "Trải nghiệm văn hóa địa phương"
      }
    ],
    travelExperiences: [
      {
        id: "1",
        title: "13 Địa Điểm Du Lịch Phú Quốc Đẹp & Hot Nhất Hiện Nay",
        description: "Kinh nghiệm du lịch Phú Quốc chi tiết",
        image: "https://res.klook.com/image/upload/q_85/c_fill,w_1360/v1712048114/nbxr22o4hk0wqm8xbvyj.webp",
        link: "https://www.klook.com/vi/blog/dia-diem-du-lich-phu-quoc/?spm=City.BlogCard_LIST&clickId=190db07032",
        category: "Kinh nghiệm"
      }
    ],
    weatherInfo: [
      {
        season: "Mùa khô",
        months: "THG 12 - THG 4",
        tempHigh: 31,
        tempLow: 24,
        description: "Thời tiết khô ráo, biển lặng"
      },
      {
        season: "Mùa mưa",
        months: "THG 5 - THG 11",
        tempHigh: 29,
        tempLow: 25,
        description: "Mưa nhiều, biển động"
      }
    ],
    destinationInfo: {
      timezone: "GMT +07:00",
      timezoneOffset: "Không chênh lệch thời gian",
      currency: "Việt Nam Đồng",
      currencyCode: "VND",
      exchangeRate: "1VND = 1.00VND",
      officialLanguage: "Tiếng Việt",
      bestTimeToVisit: [
        { period: "THG 11 - THG 4", season: "Mùa khô" },
        { period: "THG 12 - THG 2", season: "Mùa lễ" }
      ],
      idealDuration: "3-4 ngày"
    },
    faqs: [
      {
        id: "1",
        question: "Phú Quốc có những đặc sản nào?",
        answer: "Phú Quốc nổi tiếng với nước mắm, hồ tiêu, rượu sim, và các loại hải sản tươi sống."
      },
      {
        id: "2",
        question: "Có cần visa để du lịch Phú Quốc không?",
        answer: "Du khách Việt Nam không cần visa. Du khách quốc tế cần visa Việt Nam hoặc có thể xin visa khi đến sân bay."
      }
    ]
  }
};

// Helper function to get destination data by slug
export const getDestinationData = (slug: string): DestinationData | null => {
  return destinationData[slug] || null;
};