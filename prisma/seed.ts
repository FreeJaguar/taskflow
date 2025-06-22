import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      email: 'admin@taskflow.com',
      name: 'מנהל המערכת',
      password: hashedPassword,
      role: Role.MANAGER,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  const employee = await prisma.user.upsert({
    where: { email: 'employee@taskflow.com' },
    update: {},
    create: {
      email: 'employee@taskflow.com',
      name: 'עובד לדוגמה',
      password: hashedPassword,
      role: Role.EMPLOYEE,
    },
  })

  console.log('✅ Created employee user:', employee.email)

  const adminWorkspace = await prisma.workspace.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      name: 'המשרד הראשי',
      description: 'סביבת העבודה הראשית',
      userId: admin.id,
    },
  })

  const employeeWorkspace = await prisma.workspace.upsert({
    where: { userId: employee.id },
    update: {},
    create: {
      name: 'סביבת עבודה אישית',
      description: 'סביבת העבודה האישית',
      userId: employee.id,
    },
  })

  console.log('✅ Created workspaces')

  const sampleTasks = [
    {
      title: 'פיתוח מערכת אימות',
      description: 'יישום מערכת התחברות וניהול משתמשים עם NextAuth',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      assigneeId: admin.id,
      workspaceId: adminWorkspace.id,
      tags: ['פיתוח', 'אבטחה', 'NextAuth'],
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-20'),
    },
    {
      title: 'עיצוב UI חדש',
      description: 'עדכון הממשק הגרפי לפי הדרישות החדשות',
      status: TaskStatus.OPEN,
      priority: Priority.MEDIUM,
      assigneeId: employee.id,
      workspaceId: employeeWorkspace.id,
      tags: ['עיצוב', 'UI/UX'],
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-06-25'),
    },
    {
      title: 'בדיקות איכות',
      description: 'ביצוע בדיקות מקיפות למערכת',
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      assigneeId: employee.id,
      workspaceId: employeeWorkspace.id,
      tags: ['QA', 'בדיקות'],
      startDate: new Date('2025-05-20'),
      endDate: new Date('2025-06-10'),
    },
    {
      title: 'תיעוד טכני',
      description: 'כתיבת תיעוד מפורט למערכת',
      status: TaskStatus.PAUSED,
      priority: Priority.LOW,
      assigneeId: admin.id,
      workspaceId: adminWorkspace.id,
      tags: ['תיעוד'],
      startDate: new Date('2025-06-05'),
      endDate: new Date('2025-06-30'),
    },
  ]

  for (const taskData of sampleTasks) {
    await prisma.task.create({
      data: taskData,
    })
  }

  console.log('✅ Created sample tasks')
  console.log('🎉 Seed completed successfully!')
  
  console.log('\n📋 Login credentials:')
  console.log('Admin: admin@taskflow.com / 123456')
  console.log('Employee: employee@taskflow.com / 123456')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })