import { AIChatInterface } from "@/components/chat/ai-chat-interface";

export const metadata = {
  title: "AI Executive Assistant | MediTouch Admin",
  description: "Agentic AI Command Console for MediTouch Platform Operations",
};

export default function AdminAIAssistantPage() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-100">AI Command Console</h1>
        <p className="text-xs text-slate-400">
          Autonomous multi-turn agent with direct database read/write access via domain services
        </p>
      </div>
      <AIChatInterface defaultSessionType="ADMIN" />
    </div>
  );
}
