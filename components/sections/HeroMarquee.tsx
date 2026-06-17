'use client';

import { useEffect, useState } from 'react';

interface MarqueeItem {
    name: string;
    url: string;
}

export default function HeroMarquee() {
    const [items, setItems] = useState<MarqueeItem[]>([]);

    useEffect(() => {
        fetch('/api/hero-marquee')
            .then(r => r.json())
            .then(data => setItems(data.items || []))
            .catch(() => {});
    }, []);

    if (items.length === 0) return null;

    const doubled = [...items, ...items];

    return (
        <div className="bg-white py-4 overflow-hidden hero-marquee-wrap">
            <div className="hero-marquee-track" style={{ gap: '18px' }}>
                {doubled.map((item, i) => (
                    <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 inline-flex items-center px-5 py-2 rounded-2xl text-sm font-medium text-gray-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                        style={{
                            backgroundColor: '#dbd9d9',
                            border: '1px solid #b5b3b3',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {item.name}
                    </a>
                ))}
            </div>
        </div>
    );
}
