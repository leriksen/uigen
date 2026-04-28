"use client";

import { Loader2 } from "lucide-react";

interface StrReplaceArgs {
  command: "view" | "create" | "str_replace" | "insert" | "undo_edit";
  path: string;
  new_path?: string;
}

interface FileManagerArgs {
  command: "rename" | "delete";
  path: string;
  new_path?: string;
}

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "partial-call" | "result";
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    const { command, path } = args as StrReplaceArgs;
    const file = path ? path.split("/").pop() : path;
    switch (command) {
      case "create":
        return `Creating ${file}`;
      case "str_replace":
        return `Editing ${file}`;
      case "insert":
        return `Inserting into ${file}`;
      case "view":
        return `Reading ${file}`;
      case "undo_edit":
        return `Undoing edit in ${file}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path, new_path } = args as FileManagerArgs;
    const file = path ? path.split("/").pop() : path;
    switch (command) {
      case "rename":
        const dest = new_path ? new_path.split("/").pop() : new_path;
        return `Renaming ${file} → ${dest}`;
      case "delete":
        return `Deleting ${file}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const done = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}