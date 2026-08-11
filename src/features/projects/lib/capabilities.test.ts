import { describe, expect, it } from "vitest"

import { canAddMembersToProject, canManageProject } from "@/features/projects/lib/capabilities"

describe("canManageProject", () => {
  it.each([
    ["OWNER", true],
    ["ADMIN", false],
    ["MEMBER", false],
    [undefined, false]
  ] as const)("role %s -> %s", (role, expected) => {
    expect(canManageProject(role)).toBe(expected)
  })
})

describe("canAddMembersToProject", () => {
  it.each([
    ["OWNER", true],
    ["ADMIN", true],
    ["MEMBER", false],
    [undefined, false]
  ] as const)("role %s -> %s", (role, expected) => {
    expect(canAddMembersToProject(role)).toBe(expected)
  })
})
