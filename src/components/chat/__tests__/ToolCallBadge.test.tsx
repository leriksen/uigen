import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

test("shows 'Creating' label for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/Card.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/components/Card.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Inserting into' label for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/components/Card.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Inserting into Card.tsx")).toBeDefined();
});

test("shows 'Reading' label for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/components/Card.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading Card.tsx")).toBeDefined();
});

test("shows 'Renaming' label for file_manager rename command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/components/Old.tsx", new_path: "src/components/New.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming Old.tsx → New.tsx")).toBeDefined();
});

test("shows 'Deleting' label for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/components/Card.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting Card.tsx")).toBeDefined();
});

test("shows spinner when state is call", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "Card.tsx" }}
      state="call"
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is result", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "Card.tsx" }}
      state="result"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("falls back to tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("uses only filename not full path in label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "a/very/deep/path/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});
