import { ChatArea } from "@/components/chat/ChatArea";
import { ComingSoonView } from "@/components/chat/ComingSoonView";

interface ChatPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { view } = await searchParams;

  if (view && view !== "today") {
    return <ComingSoonView view={view} />;
  }

  return <ChatArea />;
}
