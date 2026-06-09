import { redirect } from 'next/navigation'

export default async function LegacyTrackRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const normalized = (id || '').trim()
  if (!normalized) {
    redirect('/track')
  }

  redirect(`/track?query=${encodeURIComponent(normalized)}`)
}

