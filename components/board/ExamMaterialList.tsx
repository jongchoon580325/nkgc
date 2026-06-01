import { useEffect, useState } from 'react';
import { BoardType } from '@/lib/board-config';
import dynamic from 'next/dynamic';

// Dynamic import for PDFFlipViewer to avoid SSR issues with canvas/window
const PDFFlipViewer = dynamic(() => import('./PDFFlipViewer'), { ssr: false });

interface Post {
    id: number;
    title: string;
    attachments: {
        id: number;
        fileUrl: string;
        fileName: string;
    }[];
}

interface ExamMaterialListProps {
    boardType: BoardType;
}

export default function ExamMaterialList({ boardType }: ExamMaterialListProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [gridColumns, setGridColumns] = useState(4);
    const [viewMode, setViewMode] = useState<'new_tab' | 'flip_book'>('flip_book');
    const [coverImage, setCoverImage] = useState<string>('');
    const [titleColor, setTitleColor] = useState<string>('#000000');
    const [titleSize, setTitleSize] = useState<string>('1.25rem');
    const [search, setSearch] = useState('');

    // Viewer State
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, [boardType]);

    useEffect(() => {
        fetchPosts();
    }, [page, search, boardType]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/board-settings/${boardType}`);
            const data = await res.json();
            if (data.settings) {
                const settings = typeof data.settings === 'string'
                    ? JSON.parse(data.settings)
                    : data.settings;
                setGridColumns(settings.gridColumns || 4);
                setViewMode(settings.viewMode || 'flip_book');
                setCoverImage(settings.coverImage || '');
                setTitleColor(settings.titleColor || '#000000');
                setTitleSize(settings.titleSize || '1.25rem');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const limit = gridColumns * 3; // 3 rows per page
            const params = new URLSearchParams({
                type: boardType,
                page: page.toString(),
                limit: limit.toString(),
                search,
            });

            const res = await fetch(`/api/posts?${params}`);
            const data = await res.json();

            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (post: Post) => {
        if (post.attachments && post.attachments.length > 0) {
            const fileUrl = post.attachments[0].fileUrl;

            if (viewMode === 'flip_book' && fileUrl.toLowerCase().endsWith('.pdf')) {
                setSelectedFile(fileUrl);
            } else {
                window.open(fileUrl, '_blank');
            }
        } else {
            alert('첨부된 파일이 없습니다.');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPosts();
    };

    const isExamUser = boardType === 'EXAM_USER';

}
