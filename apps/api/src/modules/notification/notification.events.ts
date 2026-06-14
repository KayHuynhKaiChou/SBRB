/**
 * Notification event types + payload builders shared by business/admin services.
 * Titles/messages are Vietnamese (product default locale). See
 * docs/business-approval-rules.md §7.
 */

export enum ENotificationType {
  BUSINESS_SUBMITTED = 'business.submitted',
  BUSINESS_RESUBMITTED = 'business.resubmitted',
  BUSINESS_APPROVED = 'business.approved',
  BUSINESS_REJECTED = 'business.rejected',
  BUSINESS_INACTIVATED = 'business.inactivated',
  BUSINESS_REACTIVATED = 'business.reactivated',
  BUSINESS_CHANGE_SUBMITTED = 'business.change_submitted',
  BUSINESS_CHANGE_APPROVED = 'business.change_approved',
  BUSINESS_CHANGE_REJECTED = 'business.change_rejected',
}

export interface IBusinessNotificationContext {
  businessId: string;
  businessName: string;
  changeRequestId?: string;
  reason?: string;
}

export interface INotificationPayload {
  type: string;
  title: string;
  message: string;
  businessId: string | null;
  metadata: Record<string, unknown>;
}

/** Admin deep-link → opens the review drawer for this business on the Businesses tab. */
const adminReviewRoute = (businessId: string) => `/admin/businesses?review=${businessId}`;
/** Admin deep-link → the Change-requests tab. */
const ADMIN_CHANGES_ROUTE = '/admin/businesses?tab=changes';
const MY_BUSINESS_ROUTE = '/my-business';

/** Build a notification payload (title/message/metadata) for a business event. */
export function buildBusinessNotification(
  type: ENotificationType,
  ctx: IBusinessNotificationContext,
): INotificationPayload {
  const base = {
    businessId: ctx.businessId,
    metadata: {
      businessId: ctx.businessId,
      changeRequestId: ctx.changeRequestId ?? null,
    } as Record<string, unknown>,
  };

  switch (type) {
    case ENotificationType.BUSINESS_SUBMITTED:
      return {
        ...base,
        type,
        title: 'Doanh nghiệp mới chờ duyệt',
        message: `"${ctx.businessName}" vừa được gửi và đang chờ bạn duyệt.`,
        metadata: { ...base.metadata, route: adminReviewRoute(ctx.businessId) },
      };
    case ENotificationType.BUSINESS_RESUBMITTED:
      return {
        ...base,
        type,
        title: 'Doanh nghiệp đã sửa & gửi lại',
        message: `"${ctx.businessName}" đã chỉnh sửa theo phản hồi và chờ bạn duyệt lại.`,
        metadata: { ...base.metadata, route: adminReviewRoute(ctx.businessId) },
      };
    case ENotificationType.BUSINESS_APPROVED:
      return {
        ...base,
        type,
        title: 'Doanh nghiệp đã được duyệt',
        message: `"${ctx.businessName}" đã được duyệt. Bạn có thể bắt đầu sử dụng.`,
        metadata: { ...base.metadata, route: MY_BUSINESS_ROUTE },
      };
    case ENotificationType.BUSINESS_REJECTED:
      return {
        ...base,
        type,
        title: 'Doanh nghiệp bị từ chối',
        message: `"${ctx.businessName}" bị từ chối${ctx.reason ? `: ${ctx.reason}` : ''}.`,
        metadata: { ...base.metadata, route: MY_BUSINESS_ROUTE, reason: ctx.reason ?? null },
      };
    case ENotificationType.BUSINESS_INACTIVATED:
      return {
        ...base,
        type,
        title: 'Doanh nghiệp bị tạm khóa',
        message: `"${ctx.businessName}" đã bị tạm khóa${ctx.reason ? `: ${ctx.reason}` : ''}.`,
        metadata: { ...base.metadata, route: MY_BUSINESS_ROUTE, reason: ctx.reason ?? null },
      };
    case ENotificationType.BUSINESS_REACTIVATED:
      return {
        ...base,
        type,
        title: 'Doanh nghiệp đã mở lại',
        message: `"${ctx.businessName}" đã được kích hoạt lại.`,
        metadata: { ...base.metadata, route: MY_BUSINESS_ROUTE },
      };
    case ENotificationType.BUSINESS_CHANGE_SUBMITTED:
      return {
        ...base,
        type,
        title: 'Yêu cầu thay đổi doanh nghiệp',
        message: `"${ctx.businessName}" gửi yêu cầu thay đổi thông tin, chờ bạn duyệt.`,
        metadata: { ...base.metadata, route: ADMIN_CHANGES_ROUTE },
      };
    case ENotificationType.BUSINESS_CHANGE_APPROVED:
      return {
        ...base,
        type,
        title: 'Thay đổi đã được duyệt',
        message: `Yêu cầu thay đổi thông tin "${ctx.businessName}" đã được duyệt.`,
        metadata: { ...base.metadata, route: MY_BUSINESS_ROUTE },
      };
    case ENotificationType.BUSINESS_CHANGE_REJECTED:
      return {
        ...base,
        type,
        title: 'Thay đổi bị từ chối',
        message: `Yêu cầu thay đổi "${ctx.businessName}" bị từ chối${ctx.reason ? `: ${ctx.reason}` : ''}.`,
        metadata: { ...base.metadata, route: MY_BUSINESS_ROUTE, reason: ctx.reason ?? null },
      };
    default:
      return {
        ...base,
        type,
        title: 'Thông báo',
        message: ctx.businessName,
        metadata: base.metadata,
      };
  }
}
