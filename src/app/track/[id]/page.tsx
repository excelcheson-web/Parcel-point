export const runtime = 'edge'

import TrackContent from '../_content'

export default async function TrackByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TrackContent initialId={decodeURIComponent(id)} />
}
