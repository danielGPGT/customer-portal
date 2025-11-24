import {
  UndrawBeTheHero,
  UndrawCelebration,
  UndrawGift,
  UndrawHappyBirthday,
  UndrawMakeItRain,
  UndrawWishes,
} from "react-undraw-illustrations"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const illustrationPalette = {
  primaryColor: "#8B5CF6",
  accentColor: "#FBBF24",
  hairColor: "#FDE68A",
  skinColor: "#FCD9B8",
}

const rewardIllustrations = [
  {
    name: "Make It Rain",
    description: "Classic points-and-rewards celebration",
    Component: UndrawMakeItRain,
  },
  {
    name: "Gift",
    description: "Perfect for bonus or reward announcements",
    Component: UndrawGift,
  },
  {
    name: "Celebration",
    description: "Great for milestones and program wins",
    Component: UndrawCelebration,
  },
  {
    name: "Be The Hero",
    description: "Use when highlighting top-performing members",
    Component: UndrawBeTheHero,
  },
  {
    name: "Happy Birthday",
    description: "Rewards tied to birthdays or anniversaries",
    Component: UndrawHappyBirthday,
  },
  {
    name: "Wishes",
    description: "A softer option for surprise-and-delight rewards",
    Component: UndrawWishes,
  },
]

export default function RewardsIllustrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rewards Illustration Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Quick reference for Undraw artwork that fits bonuses, celebrations, and loyalty rewards. Click or copy the
          component names directly into your UI.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rewardIllustrations.map(({ name, description, Component }) => (
          <Card key={name} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center">
              <Component
                height="200px"
                primaryColor={illustrationPalette.primaryColor}
                accentColor={illustrationPalette.accentColor}
                hairColor={illustrationPalette.hairColor}
                skinColor={illustrationPalette.skinColor}
              />
            </CardContent>
            <div className="border-t px-6 py-3 text-xs text-muted-foreground">
              Component: <code className="font-mono text-[11px]">{`<${Component.name} />`}</code>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

