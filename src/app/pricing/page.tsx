import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-6 md:grid-cols-3">
      {[
        ["Starter", "USD 19/mo", "Up to 100 members"],
        ["Growth", "USD 49/mo", "Up to 1,000 members"],
        ["Enterprise", "Custom", "Unlimited groups and audit tooling"],
      ].map(([name, price, desc]) => (
        <Card key={name}>
          <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
