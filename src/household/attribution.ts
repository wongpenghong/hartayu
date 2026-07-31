import type { HouseholdMember } from "@/household/members";
import { memberName } from "@/household/member-utils";
import type { Entry } from "@/ledger/types";

export const FAMILY_ATTRIBUTION_ID = "family";

export function attributionSegmentId(
  entry: Pick<Entry, "attributedMemberId" | "memberId">,
): string {
  if (entry.attributedMemberId === null) {
    return FAMILY_ATTRIBUTION_ID;
  }

  return entry.attributedMemberId ?? entry.memberId;
}

export function entryAttributionLabel(
  members: HouseholdMember[],
  entry: Pick<Entry, "attributedMemberId" | "memberId">,
): string {
  const segmentId = attributionSegmentId(entry);
  if (segmentId === FAMILY_ATTRIBUTION_ID) {
    return "Family";
  }

  return memberName(members, segmentId);
}

export function partnerMember(
  members: HouseholdMember[],
  userId: string,
): HouseholdMember | undefined {
  return members.find((member) => member.user_id !== userId);
}

export function attributionPickerValue(
  entry: Pick<Entry, "attributedMemberId" | "memberId"> | null,
  userId: string,
): string {
  if (!entry) {
    return userId;
  }

  if (entry.attributedMemberId === null) {
    return FAMILY_ATTRIBUTION_ID;
  }

  return entry.attributedMemberId ?? entry.memberId;
}

export function attributedMemberIdFromPicker(
  pickerValue: string,
): string | null {
  return pickerValue === FAMILY_ATTRIBUTION_ID ? null : pickerValue;
}

export function isFamilyAttribution(
  entry: Pick<Entry, "attributedMemberId">,
): boolean {
  return entry.attributedMemberId === null;
}

export const ALL_MEMBERS_FILTER_ID = "all";

export function memberFilterOptions(
  members: HouseholdMember[],
  userId: string,
): { value: string; label: string }[] {
  const options = [{ value: ALL_MEMBERS_FILTER_ID, label: "All" }];
  options.push({ value: userId, label: "Me" });
  const partner = partnerMember(members, userId);
  if (partner) {
    options.push({ value: partner.user_id, label: partner.username });
  }
  options.push({ value: FAMILY_ATTRIBUTION_ID, label: "Family" });
  return options;
}

export function canEditEntry(
  entry: Pick<Entry, "memberId" | "attributedMemberId">,
  userId: string | undefined,
): boolean {
  if (!userId) {
    return false;
  }

  return entry.memberId === userId || isFamilyAttribution(entry);
}
