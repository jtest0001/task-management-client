import { describe, expect, it } from "vitest"

import {
  canAddMembersToProject,
  canChangeMemberRole,
  canManageLabels,
  canManageProject,
  canRemoveMember
} from "@/features/projects/lib/capabilities"

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

describe("canChangeMemberRole", () => {
  it.each([
    ["OWNER", "ADMIN", true],
    ["OWNER", "MEMBER", true],
    ["OWNER", "OWNER", false],
    ["ADMIN", "ADMIN", false],
    ["ADMIN", "MEMBER", false],
    ["MEMBER", "MEMBER", false],
    [undefined, "MEMBER", false]
  ] as const)("actor %s, target %s -> %s", (actor, target, expected) => {
    expect(canChangeMemberRole(actor, target)).toBe(expected)
  })
})

describe("canRemoveMember", () => {
  it.each([
    ["OWNER", "ADMIN", true],
    ["OWNER", "MEMBER", true],
    ["OWNER", "OWNER", false],
    ["ADMIN", "MEMBER", true],
    ["ADMIN", "ADMIN", false],
    ["ADMIN", "OWNER", false],
    ["MEMBER", "MEMBER", false],
    ["MEMBER", "OWNER", false],
    [undefined, "MEMBER", false]
  ] as const)("actor %s, target %s -> %s", (actor, target, expected) => {
    expect(canRemoveMember(actor, target)).toBe(expected)
  })
})

describe("canManageLabels", () => {
  it.each([
    ["OWNER", true],
    ["ADMIN", true],
    ["MEMBER", false],
    [undefined, false]
  ] as const)("role %s -> %s", (role, expected) => {
    expect(canManageLabels(role)).toBe(expected)
  })
})
