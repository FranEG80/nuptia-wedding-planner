import { AuthCard } from "@/app/(auth)/_components/auth-card"
import { LoginForm } from "@/app/(auth)/_components/login-form"

export default function LoginPage() {
  return (
    <AuthCard
      title="Accede a Nuptia"
      description="Entra para gestionar invitaciones, invitados y la web de vuestra boda."
      footer={
        <>Acceso privado para cada pareja. Las nuevas cuentas se crean desde Nuptia.</>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
