import { WaitlistWrapper } from "@/components/box";
import { Alex_Brush } from "next/font/google";
import clsx from "clsx";
import { Metadata } from "next";

const font = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin"],
  weight: "400",
});

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Manifesto - EarEye",
  description: "Our vision for the future of personalized AI assistance",
  openGraph: {
    type: "website",
    title: "Manifesto - EarEye",
    description: "Our vision for the future of personalized AI assistance",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manifesto - EarEye",
    description: "Our vision for the future of personalized AI assistance",
  },
};

// Static manifesto content
const staticManifesto = {
  body: `
    We believe in a future where artificial intelligence understands you as deeply as you understand yourself. 
    
    Too long have we accepted one-size-fits-all solutions in a world where every individual is unique. EarEye represents our commitment to building AI that adapts, learns, and grows with you.
    
    Our vision is simple: technology should amplify human potential, not replace it. Every interaction should feel natural, every response should feel personal, and every experience should feel uniquely yours.
    
    We're not just building software; we're crafting digital companions that understand your context, respect your privacy, and enhance your daily life in meaningful ways.
    
    Join us in revolutionizing how humans and AI collaborate. The future is personal, and it starts with EarEye.
  `,
  author: {
    signatureName: "The EarEye Team",
    name: "EarEye Founders",
    role: "Builders of Personalized AI",
  },
};

export default function Manifesto() {
  return (
    <WaitlistWrapper>
      <div className="flex flex-col gap-10">
        <div className="text-slate-11 [&>p]:tracking-tight [&>p]:leading-[1.6] [&>p:not(:last-child)]:mb-3 text-pretty text-start">
          {staticManifesto.body.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph.trim()}</p>
          ))}
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-0.5 items-start">
            <p
              className={clsx(
                "text-slate-12 text-4xl font-medium italic transform -rotate-12",
                font.className
              )}
            >
              {staticManifesto.author.signatureName}
            </p>
            <p className="text-slate-11 text-sm font-medium">
              {staticManifesto.author.name}{" "}
              <span className="text-slate-10 text-xs">
                {staticManifesto.author.role}
              </span>
            </p>
          </div>
        </div>
      </div>
    </WaitlistWrapper>
  );
}
