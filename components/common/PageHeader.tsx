interface PageHeaderProps {
    title: string;
    subtitle?: string;
}

export default function PageHeader({ title, subtitle = '대한예수교 장로회 남경기노회' }: PageHeaderProps) {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-green-500 text-white py-16">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-bold mb-4">{title}</h1>
                <p className="text-xl text-blue-100">{subtitle}</p>
            </div>
        </div>
    );
}
