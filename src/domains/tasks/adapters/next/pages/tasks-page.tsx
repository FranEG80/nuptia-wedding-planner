import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { TasksView } from "@/domains/tasks/adapters/next/components/tasks-view"
import { buildMemberNameMap } from "@/domains/tasks/application/dtos/task.dto"
import { listTasksUseCase } from "@/domains/tasks/application/use-cases/list-tasks.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function TasksPage() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const memberNameById = buildMemberNameMap(wedding.members, session.appUser)
  const tasks = await listTasksUseCase({
    taskRepository: repositories.task,
    weddingId: wedding.id,
    memberNameById,
  })

  return <TasksView tasks={tasks} currentUserName={session.appUser.name} />
}
