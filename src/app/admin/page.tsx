import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'true'

  if (isAdmin) {
    redirect('/admin/dashboard')
  } else {
    redirect('/admin/login')
  }
}
