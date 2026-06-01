import OrganizationAdminForm from '@/components/admin/OrganizationAdminForm'

export default function AdminStudentPage() {
    return (
        <OrganizationAdminForm
            organizationId="student"
            publicPageUrl="/organizations/student"
        />
    )
}
