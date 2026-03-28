export class EnrollmentEntity {
  id: string
  orgId: string
  classId: string
  studentId: string
  status: 'active' | 'pending' | 'removed'
  createdAt: Date
}