import type { HouseholdMember } from "@/household/members";

export function memberName(
  members: HouseholdMember[],
  memberId: string,
): string {
  return (
    members.find((member) => member.user_id === memberId)?.username ?? "Member"
  );
}
