'use client'

import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <PageLayout
      title="Дашборд"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Дашборд #{params.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Детальный просмотр дашборда в разработке.
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
