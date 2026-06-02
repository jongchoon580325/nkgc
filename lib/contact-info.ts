export interface ContactInfo {
    secretary: {
        name: string
        phone: string
    }
    president: {
        name: string
        phone: string
    }
    address: string
    email: string
}

export const DEFAULT_CONTACT_INFO: ContactInfo = {
    president: { name: '유병구 목사', phone: '010-4324-0756' },
    secretary: { name: '문보길 목사', phone: '010-9777-1409' },
    email: 'bo-gil71@hanmail.net',
    address: '경기도 안산시 상록구 광덕산2로 5-1 (월피동)',
}

export function formatPhoneNumber(value: string) {
    const numbers = value.replace(/[^\d]/g, '').slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

export function normalizeContactInfo(value: Partial<ContactInfo> | null | undefined): ContactInfo {
    return {
        president: {
            name: value?.president?.name || DEFAULT_CONTACT_INFO.president.name,
            phone: formatPhoneNumber(value?.president?.phone || DEFAULT_CONTACT_INFO.president.phone),
        },
        secretary: {
            name: value?.secretary?.name || DEFAULT_CONTACT_INFO.secretary.name,
            phone: formatPhoneNumber(value?.secretary?.phone || DEFAULT_CONTACT_INFO.secretary.phone),
        },
        email: value?.email || DEFAULT_CONTACT_INFO.email,
        address: value?.address || DEFAULT_CONTACT_INFO.address,
    }
}
