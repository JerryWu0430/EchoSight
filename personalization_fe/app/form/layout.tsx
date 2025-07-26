import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback Preferences - EarEye",
  description: "Customize your EarEye feedback preferences",
  openGraph: {
    type: "website",
    title: "Feedback Preferences - EarEye",
    description: "Customize your EarEye feedback preferences",
  },
  twitter: {
    card: "summary_large_image",
    title: "Feedback Preferences - EarEye",
    description: "Customize your EarEye feedback preferences",
  },
};

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 