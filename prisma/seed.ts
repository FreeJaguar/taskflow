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

  await prisma.task.create({
    data: {
      title: 'פיתוח מערכת אימות',
      description: 'יישום מערכת התחברות וניהול משתמשים',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      assigneeId: admin.id,
      workspaceId: adminWorkspace.id,
      tags: ['פיתוח', 'אבטחה'],
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-20'),
    },
  })

  await prisma.task.create({
    data: {
      title: 'עיצוב UI חדש',
      description: 'עדכון הממשק הגרפי',
      status: TaskStatus.OPEN,
      priority: Priority.MEDIUM,
      assigneeId: employee.id,
      workspaceId: employeeWorkspace.id,
      tags: ['עיצוב', 'UI'],
      startDate: new Date('2025-06-15'),
      endDate: new Date('2025-06-25'),
    },
  })

  await prisma.task.create({
    data: {
      title: 'בדיקות איכות',
      description: 'ביצוע בדיקות מקיפות',
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      assigneeId: employee.id,
      workspaceId: employeeWorkspace.id,
      tags: ['QA', 'בדיקות'],
      startDate: new Date('2025-05-20'),
      endDate: new Date('2025-06-10'),
    },
  })

  console.log('✅ Created sample tasks')
  console.log('🎉 Seed completed!')
  console.log('📋 Login: admin@taskflow.com / 123456')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })