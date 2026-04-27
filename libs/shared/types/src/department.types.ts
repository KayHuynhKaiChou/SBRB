/** Department types — SRS 4.6 */

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
