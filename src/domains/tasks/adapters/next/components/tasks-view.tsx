"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Circle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"

import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/domains/tasks/adapters/next/actions"
import type { WeddingTaskDto } from "@/domains/tasks/application/dtos/task.dto"
import { useDemoState } from "@/core/demo/use-demo-state"
import { cn } from "@/shared/lib/utils"

function TaskRow({
  task,
  onToggle,
  onSave,
  onDelete,
}: {
  task: WeddingTaskDto
  onToggle: (task: WeddingTaskDto) => void
  onSave: (taskId: string, title: string, notes: string) => void
  onDelete: (taskId: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? "")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!title.trim()) {
      return
    }
    onSave(task.id, title.trim(), notes.trim())
    setIsEditing(false)
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => onToggle(task))}
          className="mt-0.5 shrink-0 text-primary transition-opacity hover:opacity-70 disabled:opacity-40"
          aria-label={task.done ? "Marcar como pendiente" : "Marcar como hecha"}
        >
          {task.done ? (
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="Título de la tarea"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                placeholder="Notas (opcional)"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(task.title)
                    setNotes(task.notes ?? "")
                    setIsEditing(false)
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                className={cn(
                  "text-sm font-medium text-foreground",
                  task.done && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </p>
              {task.notes && (
                <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {task.done
                  ? `Completada por ${task.completedByName ?? "alguien"}`
                  : task.createdByName
                    ? `Añadida por ${task.createdByName}`
                    : null}
              </p>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Editar tarea"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => onDelete(task.id))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:opacity-40"
              aria-label="Borrar tarea"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

export function TasksView({
  tasks: initialTasks,
  currentUserName,
}: {
  tasks: WeddingTaskDto[]
  currentUserName: string
}) {
  const [tasks, setTasks, isDemo] = useDemoState("tasks", initialTasks)
  const [newTitle, setNewTitle] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [showNotesField, setShowNotesField] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!newTitle.trim()) {
      return
    }

    const title = newTitle.trim()
    const notes = newNotes.trim()

    if (isDemo) {
      const now = new Date().toISOString()
      setTasks((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          weddingId: "demo",
          title,
          notes: notes || null,
          done: false,
          createdByName: currentUserName,
          completedByName: null,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ])
      setNewTitle("")
      setNewNotes("")
      setShowNotesField(false)
      return
    }

    startTransition(async () => {
      const task = await createTaskAction({
        title,
        notes: notes || undefined,
      })

      if (task) {
        setTasks((current) => [...current, task])
      }

      setNewTitle("")
      setNewNotes("")
      setShowNotesField(false)
    })
  }

  function handleToggle(task: WeddingTaskDto) {
    if (isDemo) {
      const now = new Date().toISOString()
      const done = !task.done
      setTasks((current) =>
        current.map((t) =>
          t.id === task.id
            ? {
                ...t,
                done,
                completedByName: done ? currentUserName : null,
                completedAt: done ? now : null,
                updatedAt: now,
              }
            : t,
        ),
      )
      return
    }

    startTransition(async () => {
      const updated = await toggleTaskAction(task.id, !task.done)
      if (updated) {
        setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)))
      }
    })
  }

  function handleSave(taskId: string, title: string, notes: string) {
    if (isDemo) {
      const now = new Date().toISOString()
      setTasks((current) =>
        current.map((t) =>
          t.id === taskId ? { ...t, title, notes: notes || null, updatedAt: now } : t,
        ),
      )
      return
    }

    startTransition(async () => {
      const updated = await updateTaskAction(taskId, { title, notes: notes || null })
      if (updated) {
        setTasks((current) => current.map((t) => (t.id === taskId ? updated : t)))
      }
    })
  }

  function handleDelete(taskId: string) {
    if (isDemo) {
      setTasks((current) => current.filter((t) => t.id !== taskId))
      return
    }

    startTransition(async () => {
      const deleted = await deleteTaskAction(taskId)
      if (deleted) {
        setTasks((current) => current.filter((t) => t.id !== taskId))
      }
    })
  }

  const pending = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Tareas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizad juntos todo lo pendiente para el gran día.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showNotesField) {
                handleCreate()
              }
            }}
            placeholder="Añadir una nueva tarea..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {!showNotesField && (
            <button
              type="button"
              onClick={() => setShowNotesField(true)}
              className="shrink-0 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
            >
              + Nota
            </button>
          )}
          <button
            type="button"
            disabled={isPending || !newTitle.trim()}
            onClick={handleCreate}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Añadir
          </button>
        </div>
        {showNotesField && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notas (opcional)"
              rows={2}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setShowNotesField(false)
                setNewNotes("")
              }}
              className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-secondary"
              aria-label="Cerrar notas"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Pendientes ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground">
            Completadas ({done.length})
          </h2>
          <ul className="space-y-2">
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
