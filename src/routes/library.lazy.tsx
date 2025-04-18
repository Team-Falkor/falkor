import { Tab } from '@/@types'
import { useLanguageContext } from '@/contexts/I18N'
import ActiveLibrary from '@/features/library/components/activeLibrary'
import LibraryTabs from '@/features/library/components/containers/tabs'
import { useLists } from '@/features/lists/hooks/useLists'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createLazyFileRoute('/library')({
  component: Library,
})

function Library() {
  const { t } = useLanguageContext()
  const { lists } = useLists()

  const tabs = useMemo((): Tab[] => {
    const listsTabs: Tab[] = lists.map((list) => {
      return {
        name: `${list.name}`,
        component: (
          <ActiveLibrary
            type="list"
            listId={list.id}
            description={list.description}
            title={list.name}
            key={list.id}
          />
        ),
      }
    })

    return [
      {
        name: t('sections.continue_playing'),
        component: (
          <ActiveLibrary type="game" title={t('sections.continue_playing')} />
        ),
      },
      ...listsTabs,
    ]
  }, [lists, t])

  // Only set activeTab after tabs is ready to avoid undefined issues.
  const [activeTab, setActiveTab] = useState<Tab | undefined>(tabs[0])

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) setActiveTab(tabs[0])

    if (!tabs.find((tab) => tab.name === activeTab?.name)) {
      setActiveTab(tabs[0])
    }
  }, [tabs, activeTab])

  return (
    <div className="p-0 py-0">
      <LibraryTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="mt-4">{activeTab && activeTab.component}</div>
    </div>
  )
}
