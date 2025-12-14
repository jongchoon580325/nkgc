export const MENU_ITEMS = [
    { label: 'Home', href: '/' },
    {
        label: '노회소개',
        href: '/about/greeting',
        submenu: [
            { label: '노회장인사', href: '/about/greeting' },
            { label: '노회소개', href: '/about/introduction' },
            { label: '역대임원', href: '/about/past-officers' },
            { label: '현재임원', href: '/about/officers' },
        ],
    },
    {
        label: '시찰소개',
        href: '/about/inspections',
    },
    {
        label: '기관소개',
        href: '/organizations/sunday-school',
        submenu: [
            { label: '주교연합회', href: '/organizations/sunday-school' },
            { label: '학생면려회', href: '/organizations/student' },
            { label: '청장년면려회', href: '/organizations/young-adult' },
            { label: '여전도회', href: '/organizations/womens' },
            { label: '남전도회', href: '/organizations/mens' },
        ],
    },
    {
        label: '노회행정',
        href: '/board/form_admin',
        submenu: [
            { label: '노회행정서식', href: '/board/form_admin' },
            { label: '자립위원회서식', href: '/board/form_self' },
            { label: '노회원현황', href: '/administration/members-status' },
            { label: '상비부현황', href: '/administration/standing-committees' },
            { label: '상회비현황', href: '/administration/fees-status' },
            { label: '별명부', href: '/administration/separate-registry' },
        ],
    },
    {
        label: '노회자료',
        href: '/board/gallery',
        submenu: [
            { label: '사진자료실', href: '/board/gallery' },
            { label: '영상자료실', href: '/board/video' },
            { label: '규칙자료실', href: '/resources/rules' },
            { label: '고시자료실', href: '/board/exam' },
            { label: '결의서자료실', href: '/resources/resolutions' },
            { label: '노회록자료실', href: '/board/meeting' },
        ],
    },
    {
        label: '노회알림',
        href: '/board/notice',
        submenu: [
            { label: '노회공지판', href: '/board/notice' },
            { label: '회원게시판', href: '/board/member' },
            { label: '자유게시판', href: '/board/free' },
        ],
    },
];
