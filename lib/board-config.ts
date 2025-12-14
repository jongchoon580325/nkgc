// 게시판 타입 정의 및 설정
export const BOARD_TYPES = {
    NOTICE: 'NOTICE',
    FREE: 'FREE',
    MEMBER: 'MEMBER',
    FORM_ADMIN: 'FORM_ADMIN',
    FORM_SELF: 'FORM_SELF',
    EXAM_DEPT: 'EXAM_DEPT',
    EXAM_USER: 'EXAM_USER',
    GALLERY: 'GALLERY',
    VIDEO: 'VIDEO',
    MEETING_MINUTES: 'MEETING_MINUTES',
} as const;

export type BoardType = typeof BOARD_TYPES[keyof typeof BOARD_TYPES];

// 게시판 메타데이터
export const BOARD_CONFIG: Record<BoardType, {
    title: string;
    description: string;
    viewType: 'list' | 'gallery';
    writePermission: 'all' | 'member' | 'admin';
    canComment: boolean;
    canLike: boolean;
    categories?: string[];
}> = {
    [BOARD_TYPES.NOTICE]: {
        title: '노회 공지사항',
        description: '노회 공지사항입니다.',
        viewType: 'list',
        writePermission: 'admin',
        canComment: true,
        canLike: false,
    },
    [BOARD_TYPES.FREE]: {
        title: '자유게시판',
        description: '자유롭게 의견을 나누는 공간입니다.',
        viewType: 'list',
        writePermission: 'member',
        canComment: true,
        canLike: true,
    },
    [BOARD_TYPES.MEMBER]: {
        title: '회원게시판',
        description: '정회원만 접근 가능한 게시판입니다.',
        viewType: 'list',
        writePermission: 'member',
        canComment: true,
        canLike: true,
    },
    [BOARD_TYPES.FORM_ADMIN]: {
        title: '노회행정서식',
        description: '노회 행정 관련 서식 자료실입니다.',
        viewType: 'list',
        writePermission: 'admin',
        canComment: false,
        canLike: false,
    },
    [BOARD_TYPES.FORM_SELF]: {
        title: '자립위원회서식',
        description: '자립위원회 관련 서식 자료실입니다.',
        viewType: 'list',
        writePermission: 'admin',
        canComment: false,
        canLike: false,
    },
    [BOARD_TYPES.EXAM_DEPT]: {
        title: '고시부 자료실',
        description: '고시부 관련 자료입니다.',
        viewType: 'list',
        writePermission: 'admin',
        canComment: false,
        canLike: false,
    },
    [BOARD_TYPES.EXAM_USER]: {
        title: '응시자 자료실',
        description: '응시자를 위한 자료실입니다.',
        viewType: 'list',
        writePermission: 'admin',
        canComment: false,
        canLike: false,
    },
    [BOARD_TYPES.GALLERY]: {
        title: '사진자료실',
        description: '노회 활동 사진을 공유하는 공간입니다.',
        viewType: 'gallery',
        writePermission: 'admin',
        canComment: true,
        canLike: true,
    },
    [BOARD_TYPES.VIDEO]: {
        title: '영상자료실',
        description: '노회 활동 영상을 공유하는 공간입니다.',
        viewType: 'gallery',
        writePermission: 'admin',
        canComment: true,
        canLike: true,
    },
    [BOARD_TYPES.MEETING_MINUTES]: {
        title: '노회록 자료실',
        description: '노회록 관련 자료입니다.',
        viewType: 'list',
        writePermission: 'admin',
        canComment: false,
        canLike: false,
    },
};
