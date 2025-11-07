import React, { useState } from 'react';
import { DestinationInfo, WeatherInfo } from '@/data/destinationData';
import { Thermometer, Clock, DollarSign, Languages, Calendar, MapPin } from 'lucide-react';

interface DestinationInfoSectionProps {
  info: DestinationInfo;
  weatherInfo: WeatherInfo[];
  destinationName: string;
}

const DestinationInfoSection: React.FC<DestinationInfoSectionProps> = ({
  info,
  weatherInfo,
  destinationName,
}) => {
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const convertTemp = (temp: number) => {
    if (tempUnit === 'F') {
      return Math.round((temp * 9/5) + 32);
    }
    return temp;
  };

  const tempSymbol = tempUnit === 'C' ? '°C' : '°F';

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Thông tin du lịch {destinationName}
      </h3>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Weather Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <Thermometer className="w-5 h-5 mr-2 text-blue-500" />
              Thời tiết địa phương
            </h4>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTempUnit('C')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  tempUnit === 'C' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setTempUnit('F')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  tempUnit === 'F' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {weatherInfo.map((weather, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{weather.season}</span>
                  <span className="text-sm text-gray-600">{weather.months}</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {convertTemp(weather.tempHigh)}{tempSymbol}
                  </span>
                  <span className="text-lg text-gray-500">
                    {convertTemp(weather.tempLow)}{tempSymbol}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{weather.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* General Information */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-500" />
            Thông tin chung
          </h4>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Timezone */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Múi giờ</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{info.timezone}</div>
                <div className="text-sm text-gray-600">{info.timezoneOffset}</div>
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Tiền tệ</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{info.currency}</div>
                <div className="text-sm text-gray-600">{info.exchangeRate}</div>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <Languages className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Ngôn ngữ chính thức</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{info.officialLanguage}</div>
              </div>
            </div>

            {/* Ideal Duration */}
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Thời lượng lý tưởng</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{info.idealDuration}</div>
              </div>
            </div>
          </div>

          {/* Best Time to Visit */}
          <div className="mt-6">
            <div className="flex items-center text-gray-700 mb-3">
              <Calendar className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm font-medium">Thời gian tuyệt nhất để đến</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {info.bestTimeToVisit.map((time, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="font-medium text-orange-800 text-sm">{time.period}</div>
                  <div className="text-xs text-orange-600 mt-1">{time.season}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DestinationInfoSection;