/** User-guide / help-hub types. Drives the guide catalog + cards + tours. */

/** Build status of a guide feature (controls badge + whether Usage/Tour is offered). */
export type TGuideStatus = 'done' | 'partial' | 'coming-soon';

/** Who can actually run a feature's tour (Usage button visibility). */
export type TGuideAudience = 'all' | 'admin' | 'owner' | 'manager' | 'staff';

/** One feature entry in the guide. i18n keys derived by convention: `guide:feat_<key>_title` / `_desc`. */
export interface IGuideFeature {
  /** Stable kebab key — also used to derive i18n keys. */
  key: string;
  status: TGuideStatus;
  /** Target page route for the Usage button (omit for coming-soon / non-navigable). */
  route?: string;
  /** Tour id run on the target page (omit if no tour). */
  tourId?: string;
  /** Roles allowed to run the tour. Default treated as ['all'] if omitted. */
  audience?: TGuideAudience[];
}

/** A grouped section of features. Area title i18n key: `guide:area_<key>`. */
export interface IGuideArea {
  key: string;
  features: IGuideFeature[];
}
