import Link from "next/link"

import { AuthCard } from "@/app/(auth)/_components/auth-card"
import { SignupForm } from "@/app/(auth)/_components/signup-form"

export default function SignupPage() {
  return (
    <AuthCard
      title="Crea tu espacio"
      description="Prepara la cuenta inicial para empezar a configurar una boda."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Acceder
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  )
}
