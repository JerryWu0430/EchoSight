import { InputForm } from "@/components/waitlist-form"
import { WaitlistWrapper } from "@/components/box"
import type { Metadata } from "next"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "EarEye - Personalized AI Assistant",
  description: "Join the waitlist for EarEye, the next generation of personalized AI assistance.",
  openGraph: {
    type: "website",
    title: "EarEye - Personalized AI Assistant",
    description: "Join the waitlist for EarEye, the next generation of personalized AI assistance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EarEye - Personalized AI Assistant",
    description: "Join the waitlist for EarEye, the next generation of personalized AI assistance.",
  },
}

export default function Home() {
  const waitlistData = {
    title: "EarEye: The Future of Personalized AI",
    subtitle: "Experience AI that truly understands you. Join our waitlist to be among the first to access revolutionary personalized AI assistance.",
    emailPlaceholder: "Enter your email address",
    buttonCopy: {
      idle: "Join Waitlist",
      success: "Welcome aboard!",
      loading: "Joining..."
    }
  }

  const handleFormSubmission = async (data: FormData) => {
    "use server"
    // Simulate form submission
    const email = data.get("email") as string
    if (!email || !email.includes("@")) {
      return {
        success: false as const,
        error: "Please enter a valid email address"
      }
    }
    
    // Here you could integrate with any email service or database
    console.log("Waitlist signup:", email)
    return { success: true as const }
  }

  return (
    <WaitlistWrapper>
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-medium text-slate-12 whitespace-pre-wrap text-pretty">
          {waitlistData.title}
        </h1>
        <div className="text-slate-10 [&>p]:tracking-tight text-pretty">
          <p>{waitlistData.subtitle}</p>
        </div>
      </div>
      {/* Form */}
      <div className="px-1 flex flex-col w-full self-stretch">
        <InputForm
          name="email"
          type="email"
          placeholder={waitlistData.emailPlaceholder}
          required
          buttonCopy={waitlistData.buttonCopy}
          formAction={handleFormSubmission}
        />
      </div>
    </WaitlistWrapper>
  )
}
