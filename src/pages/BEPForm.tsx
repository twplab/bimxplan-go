import { BEPFormWizard } from "@/components/bep/BEPFormWizard"
import { AuthProvider } from "@/components/auth/AuthProvider"

const BEPForm = () => {
  return (
    <AuthProvider>
      <BEPFormWizard onClose={() => window.location.href = '/'} />
    </AuthProvider>
  )
}

export default BEPForm