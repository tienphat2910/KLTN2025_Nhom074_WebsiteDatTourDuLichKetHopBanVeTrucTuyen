import React, { useState } from 'react';
import { FAQ } from '@/data/destinationData';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQSectionProps {
  faqs: FAQ[];
  destinationName: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, destinationName }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  if (faqs.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Câu hỏi thường gặp về {destinationName}
      </h3>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {faqs.map((faq, index) => {
          const isOpen = openItems.has(faq.id);
          return (
            <div
              key={faq.id}
              className={`border-b border-gray-100 last:border-b-0 ${
                index === 0 ? '' : ''
              }`}
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
              >
                <span className="font-medium text-gray-800 pr-4">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-4">
                  <div className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;