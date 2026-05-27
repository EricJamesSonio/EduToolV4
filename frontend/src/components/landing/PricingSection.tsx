import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    description: "Explore EduTool and evaluate its capabilities.",
    price: "$0",
    period: "forever",
    features: [
      "Access to all core features",
      "Up to 50 students",
      "Basic academic structure",
      "Standard reporting",
      "Community support",
    ],
    cta: "Get Started",
    href: "/register?plan=free",
  },
  {
    name: "Standard",
    description: "For growing schools that need more capacity.",
    price: "$20",
    period: "per month",
    popular: true,
    features: [
      "Everything in Free",
      "Up to 500 students",
      "Advanced grading schemes",
      "Bulk CSV enrollment",
      "Assessment generator",
      "Priority email support",
    ],
    cta: "Start Free Trial",
    href: "/register?plan=standard",
  },
  {
    name: "Pro",
    description: "For large institutions with advanced needs.",
    price: "$50",
    period: "per month",
    features: [
      "Everything in Standard",
      "Unlimited students",
      "Video meetings & live chat",
      "Custom templates",
      "Grade lock management",
      "Audit log & analytics",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    href: "/register?plan=pro",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="page-container py-6 md:py-10 space-y-14">
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>
        <h2 className="font-bold">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your school. No hidden fees, no surprises.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={
              "card-landing p-8 flex flex-col relative " +
              (plan.popular ? "ring-2 ring-primary shadow-lg scale-[1.02] md:scale-105" : "")
            }
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                Most Popular
              </span>
            )}

            <div className="space-y-2 mb-6">
              <h3 className="font-heading font-semibold text-xl text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => {
                const textColors = [
                  "text-primary",
                  "text-emerald-600",
                  "text-amber-600",
                  "text-purple-600",
                  "text-cyan-600",
                  "text-orange-600",
                ];
                return (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${textColors[i % textColors.length]}`} />
                    <span className={textColors[i % textColors.length]}>{feature}</span>
                  </li>
                );
              })}
            </ul>

            <Link href={plan.href}>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
