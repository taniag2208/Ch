export type IntentType =
  | "send_email"
  | "create_task"
  | "create_reminder"
  | "create_calendar_event"
  | "summarize_today"
  | "general_response";

export interface IntentParameters {
  // send_email
  recipient?: string;
  subject?: string;
  body?: string;
  cc?: string[];
  // create_task
  title?: string;
  description?: string;
  assignee?: string;
  project?: string;
  due_date?: string;
  // create_reminder
  message?: string;
  date?: string;
  time?: string;
  // create_calendar_event
  duration?: string;
  attendees?: string[];
  location?: string;
  // generic
  [key: string]: unknown;
}

export interface CharlieResponse {
  intent: IntentType;
  parameters: IntentParameters;
  message: string;
  requires_action: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  intent?: IntentType | null;
  parameters?: IntentParameters | null;
  requires_action?: boolean | null;
  action_status?: "pending" | "executing" | "success" | "error" | null;
  action_result?: Record<string, unknown> | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ActionLog {
  id: string;
  user_id: string;
  message_id: string | null;
  intent: IntentType;
  parameters: IntentParameters;
  status: "pending" | "executing" | "success" | "error";
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

export interface ChatApiResponse {
  message: Message;
  charlie: CharlieResponse;
}

export interface ExecuteActionApiResponse {
  status: "success" | "error";
  result?: Record<string, unknown>;
  error?: string;
}
