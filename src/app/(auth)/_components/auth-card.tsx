import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"

export function AuthCard({
  children,
  title,
  description,
  footer,
}: {
  children: React.ReactNode
  title: string
  description: string
  footer: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen bg-background px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(480px,1.05fr)] lg:p-0">
      <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center lg:min-h-screen lg:px-10 lg:py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex w-fit items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
            </span>
            <span className="font-serif text-2xl text-foreground">Nuptia</span>
          </Link>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <h1 className="font-serif text-3xl leading-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          </div>
        </div>
      </section>

      <aside
        aria-hidden="true"
        className="relative hidden min-h-screen overflow-hidden bg-primary lg:block"
      >
        <Image
          src="/images/invite-floral.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <div className="max-w-lg space-y-4">
            <p className="font-serif text-4xl leading-tight">
              Un espacio sobrio para preparar cada detalle importante.
            </p>
            <p className="max-w-md text-sm leading-6 text-primary-foreground/75">
              Invitaciones, invitados y web de boda en una experiencia pensada
              para trabajar sin ruido.
            </p>
          </div>
        </div>
      </aside>
    </main>
  )
}
