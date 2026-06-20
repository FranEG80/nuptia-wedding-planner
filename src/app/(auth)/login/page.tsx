import Link from "next/link"

import { AuthCard } from "@/app/(auth)/_components/auth-card"
import { LoginForm } from "@/app/(auth)/_components/login-form"

export default function LoginPage() {
  return (
    <AuthCard
      title="Accede a Nuptia"
      description="Entra para gestionar invitaciones, invitados y la web de vuestra boda."
      footer={
        <>
          ¿Todavía no tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
