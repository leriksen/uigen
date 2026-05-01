"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();

  // Keep refs to current values so we can read them at submit time
  // without putting them in render-time deps that recreate on every keystroke.
  const fileSystemRef = useRef(fileSystem);
  fileSystemRef.current = fileSystem;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const onToolCall = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ toolCall }: { toolCall: any }) => {
      handleToolCall(toolCall);
    },
    [handleToolCall]
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    status,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    onToolCall,
  });

  // Serialize the file system only at submit time, not on every render.
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      aiHandleSubmit(e, {
        body: {
          files: fileSystemRef.current.serialize(),
          projectId: projectIdRef.current,
        },
      });
    },
    [aiHandleSubmit]
  );

  // Track anonymous work
  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}