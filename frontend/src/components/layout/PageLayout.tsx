import { Header } from './Header'

interface PageLayoutProps {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageLayout({ title, actions, children }: PageLayoutProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Header title={title} actions={actions} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
    </div>
  )
}
