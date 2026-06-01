import React from 'react';

export default function NoticeBar() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="w-full bg-gradient-to-r from-[#2E0249] via-[#570A57] to-[#2E0249] text-white py-2">
            <div className="container mx-auto px-4 text-center">
                <p className="text-sm md:text-base font-medium tracking-wide">
                    대한예수교장로회 남경기노회 (Since 2001-{currentYear})
                </p>
            </div>
        </div>
    );
}
