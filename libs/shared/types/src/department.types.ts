/** Department types — SRS 4.6 */

import type { TBusinessRole } from '@sbrb/shared-constants';

export interface IDepartmentDto {
  id: string;
  name: string;
  parentId: string | null;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateDepartmentInput {
  businessId: string;
  name: string;
  parentId?: string | null;
}

export interface IUpdateDepartmentInput {
  name?: string;
  parentId?: string | null;
}

/** A department membership with nested user reference. */
export interface IDepartmentMemberRef {
  id: string;
  departmentId: string;
  userId: string;
  isManager: boolean;
  businessRole: TBusinessRole | null;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
}

/** Alias kept for hook back-compat. */
export type IDepartmentMember = IDepartmentMemberRef;

/** A subtree member: direct/inherited member tagged with real department + isDirect. */
export interface IDepartmentSubtreeMember extends IDepartmentMemberRef {
  departmentName: string | null;
  isDirect: boolean;
}

/** Department hierarchy node (recursive tree). */
export interface IDepartmentNode {
  id: string;
  name: string;
  parentId: string | null;
  businessId: string;
  isRoot: boolean;
  positionX: number | null;
  positionY: number | null;
  memberCount: number;
  directReportCount: number | null;
  manager: IDepartmentMemberRef | null;
  children?: IDepartmentNode[];
  createdAt: string;
  updatedAt: string;
}
