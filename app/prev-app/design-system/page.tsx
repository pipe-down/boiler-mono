import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Separator } from '@/src/components/ui/separator';

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return (
    <main className="container mx-auto p-6 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Design System</h1>
        <p className="text-muted-foreground">Tokens and primitives preview for getmoim-fe-v2</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'background', var: '--background' },
            { name: 'foreground', var: '--foreground' },
            { name: 'primary', var: '--primary' },
            { name: 'primary-foreground', var: '--primary-foreground' },
            { name: 'secondary', var: '--secondary' },
            { name: 'secondary-foreground', var: '--secondary-foreground' },
            { name: 'accent', var: '--accent' },
            { name: 'accent-foreground', var: '--accent-foreground' },
            { name: 'muted', var: '--muted' },
            { name: 'muted-foreground', var: '--muted-foreground' },
            { name: 'destructive', var: '--destructive' },
            { name: 'destructive-foreground', var: '--destructive-foreground' },
            { name: 'border', var: '--border' },
            { name: 'ring', var: '--ring' },
            { name: 'sidebar', var: '--sidebar' },
            { name: 'sidebar-foreground', var: '--sidebar-foreground' },
          ].map((t) => (
            <div key={t.name} className="rounded-md border p-3">
              <div className="text-sm text-muted-foreground">{t.name}</div>
              <div
                className="mt-2 h-10 w-full rounded"
                style={{
                  background: `var(${t.var})`,
                  border: t.name === 'border' ? '1px solid var(--border)' : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm">Name</label>
            <Input placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Email</label>
            <Input type="email" placeholder="you@example.com" />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Card</div>
            <div className="mt-2 font-medium">Basic card with padding</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Card</div>
            <div className="mt-2 font-medium">Styled by tokens</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Card</div>
            <div className="mt-2 font-medium">Works in dark and light</div>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Tab content one.</TabsContent>
          <TabsContent value="two">Tab content two.</TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
