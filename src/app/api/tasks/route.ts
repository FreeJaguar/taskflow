import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: session.user.id
      },
      include: {
        assignee: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, startDate, endDate, tags } = body

    let workspace = await prisma.workspace.findUnique({
      where: { userId: session.user.id }
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: `סביבת עבודה של ${session.user.name}`,
          userId: session.user.id
        }
      })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        tags: tags || [],
        assigneeId: session.user.id,
        workspaceId: workspace.id
      },
      include: {
        assignee: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}