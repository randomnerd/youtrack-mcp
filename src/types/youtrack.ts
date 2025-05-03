/**
 * YouTrack API interfaces
 */

export interface User {
  id: string;
  name: string;
  fullName?: string;
  login?: string;
  email?: string;
  avatarUrl?: string;
  ringId?: string;
  banned?: boolean;
  online?: boolean;
  isLocked?: boolean;
  banBadge?: string | null;
  issueRelatedGroup?: UserGroup;
  profiles?: UserProfiles;
  $type?: string;
}

export interface UserProfiles {
  general?: GeneralUserProfile;
  $type?: string;
}

export interface GeneralUserProfile {
  trackOnlineStatus?: boolean;
  $type?: string;
}

export interface Project {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  ringId?: string;
  leader?: User;
  team?: UserGroup;
  plugins?: ProjectPlugins;
  isDemo?: boolean;
  archived?: boolean;
  $type?: string;
}

export interface ProjectPlugins {
  vcsIntegrationSettings?: ProjectVcsIntegrationSettings;
  timeTrackingSettings?: ProjectTimeTrackingSettings;
  helpDeskSettings?: ProjectHelpDeskSettings;
  $type?: string;
}

export interface ProjectVcsIntegrationSettings {
  processors?: any[];
  $type?: string;
}

export interface ProjectTimeTrackingSettings {
  estimate?: any | null;
  timeSpent?: any | null;
  enabled?: boolean;
  $type?: string;
}

export interface ProjectHelpDeskSettings {
  enabled?: boolean;
  $type?: string;
}

export interface Bundle {
  id: string;
  name: string;
  values?: BundleElement[];
  $type?: string;
}

export interface BaseBundle {
  id: string;
  name: string;
  $type?: string;
}

export interface FieldStyle {
  id?: string;
  background?: string;
  foreground?: string;
}

export interface BundleElement {
  id: string;
  name: string;
  bundle?: Bundle;
  description?: string;
  archived?: boolean;
  ordinal?: number;
  color?: FieldStyle;
  hasRunningJob?: boolean;
  $type?: string;
}

export interface StateBundleElement extends BundleElement {
  isResolved?: boolean;
}

export interface EnumBundleElement extends BundleElement {
  localizedName?: string | null;
}

export interface OwnedBundleElement extends BundleElement {
  owner: User;
}

export interface VersionBundleElement extends BundleElement {
  archived?: boolean;
  releaseDate?: number;
  released?: boolean;
}

export interface OwnedBundle extends BaseBundle {
  values?: OwnedBundleElement[];
}

export interface VersionBundle extends BaseBundle {
  values?: VersionBundleElement[];
}

export interface UserGroup {
  id: string;
  name: string;
  icon?: string | null;
  ringId?: string;
  allUsersGroup?: boolean;
  $type?: string;
}

export interface VcsServer {
  id: string;
  url: string;
  $type?: string;
}

export interface VcsHostingServer extends VcsServer {
  id: string;
  url: string;
}

export interface VcsChange {
  id: string;
  date: number;
  fetched?: number;
  files?: number;
  author: User;
  processors?: ChangesProcessor[];
  text: string;
  urls?: string[];
  version?: string;
  issue?: Issue;
  state?: number;
  $type?: string;
}

export interface ChangesProcessor {
  id: string;
  server: VcsServer;
  project: Project;
  relatedProjects?: Project[];
  enabled: boolean;
  visibleForGroups?: UserGroup[];
  addComments?: boolean;
}

export interface VcsHostingChangesProcessor extends ChangesProcessor {
  id: string;
  server: VcsHostingServer;
  path?: string;
  branchSpecification?: string;
  committers?: UserGroup;
}

export interface OnlineUsers {
  id: string;
  users: number;
  $type?: string;
}

export interface TelemetryData {
  id: string;
  availableProcessors: number;
  availableMemory: string;
  allocatedMemory?: string;
  usedMemory: string;
  uptime: string;
  startedTime?: number;
  databaseBackgroundThreads?: number;
  pendingAsyncJobs?: number;
  databaseSize: string;
  fullDatabaseSize?: string;
  textIndexSize?: string;
  onlineUsers: OnlineUsers;
  $type?: string;
}

export interface CustomField {
  id: string;
  name: string;
  localizedName?: string | null;
  fieldType?: {
    valueType?: string;
    isMultiValue?: boolean;
    presentation?: string;
    id?: string;
    $type?: string;
  };
  ordinal?: number;
  fieldDefaults?: any;
  instances?: any[];
  $type?: string;
}

export interface CustomFieldValue {
  id?: string;
  name?: string;
  $type?: string;
  color?: FieldStyle;
  isResolved?: boolean;
  description?: string;
  archived?: boolean;
  localizedName?: string | null;
}

export interface IssueCustomField {
  id: string;
  name: string;
  value?: CustomFieldValue | CustomFieldValue[] | string | number | null;
  isUpdatable?: boolean;
  projectCustomField?: {
    id: string;
    field?: CustomField;
    bundle?: BaseBundle;
    emptyFieldText?: string;
    canBeEmpty?: boolean;
    isPublic?: boolean;
    ordinal?: number;
    isSpentTime?: boolean;
    isEstimation?: boolean;
    $type?: string;
  };
  $type?: string;
}

export interface SingleEnumIssueCustomField extends IssueCustomField {
  value?: EnumBundleElement | null;
}

export interface MultiUserIssueCustomField extends IssueCustomField {
  value?: User[];
}

export interface SingleUserIssueCustomField extends IssueCustomField {
  value?: User | null;
}

export interface StateIssueCustomField extends IssueCustomField {
  value?: StateBundleElement | null;
}

export interface SimpleIssueCustomField extends IssueCustomField {
  value?: string | number | null;
}

export interface PeriodIssueCustomField extends IssueCustomField {
  value?: string | null;
}

export interface EntityAction {
  executing?: boolean;
  userInputType?: string | null;
  description?: string;
  name?: string;
  id?: string;
  $type?: string;
}

export interface Issue {
  id: string;
  idReadable?: string;
  numberInProject?: number;
  summary: string;
  description?: string;
  usesMarkdown?: boolean;
  created?: number;
  updated?: number;
  resolved?: boolean | null;
  reporter?: User;
  updater?: User;
  isDraft?: boolean;
  draftOwner?: User;
  votes?: number;
  voters?: IssueVoters;
  comments?: IssueComment[];
  commentsCount?: number;
  tags?: IssueTag[];
  links?: IssueLink[];
  attachments?: IssueAttachment[];
  subtasks?: IssueLink;
  parent?: IssueLink;
  watchers?: IssueWatchers;
  customFields?: Array<{
    name: string;
    value: CustomFieldValue | CustomFieldValue[];
  }>;
  fields?: IssueCustomField[];
  visibility?: Visibility;
  project?: Project;
  hasEmail?: boolean;
  widgets?: any[];
  mentionedIssues?: any[];
  mentionedUsers?: any[];
  mentionedArticles?: any[];
  applicableActions?: EntityAction[];
  canUpdateVisibility?: boolean;
  canAddPublicComment?: boolean;
  externalIssue?: any | null;
  hiddenAttachmentsCount?: number;
  $type?: string;
}

export interface Sprint {
  id: string;
  name: string;
  start?: number;
  finish?: number;
  isCompleted?: boolean;
  issues?: Issue[];
  archived?: boolean;
  isDefault?: boolean;
  isStarted?: boolean;
  $type?: string;
}

export interface Board {
  id: string;
  name: string;
  projects?: Project[];
  sprints?: Sprint[];
  currentSprint?: Sprint;
  backlog?: any | null;
  swimlaneSettings?: any | null;
  estimationField?: any | null;
  hideOrphansSwimlane?: boolean;
  colorizeCustomFields?: boolean;
  orphansAtTheTop?: boolean;
  isDemo?: boolean;
  flatBacklog?: boolean;
  columnSettings?: ColumnSettings;
  cardSettings?: CardSettings;
  colorCoding?: FieldBasedColorCoding;
  originalEstimationField?: any | null;
  sprintsSettings?: SprintsSettings;
  readSharingSettings?: AgileSharingSettings;
  updateSharingSettings?: AgileSharingSettings;
  isUpdatable?: boolean;
  owner?: User;
  extensions?: AgileExtensions;
  status?: AgileStatus;
  $type?: string;
}

export interface ColumnSettings {
  columns?: AgileColumn[];
  showBundleWarning?: boolean;
  field?: CustomField;
  id?: string;
  $type?: string;
}

export interface AgileColumn {
  wipLimit?: number | null;
  fieldValues?: AgileColumnFieldValue[];
  ordinal?: number;
  parent?: ColumnSettings;
  isResolved?: boolean;
  id?: string;
  $type?: string;
}

export interface AgileColumnFieldValue {
  column?: AgileColumn;
  canUpdate?: boolean;
  name?: string;
  isResolved?: boolean;
  presentation?: string;
  id?: string;
  $type?: string;
}

export interface CardSettings {
  fields?: CardField[];
  $type?: string;
}

export interface CardField {
  presentation?: CardFieldPresentation;
  field?: CustomField;
  id?: string;
  $type?: string;
}

export interface CardFieldPresentation {
  id?: string;
  $type?: string;
}

export interface FieldBasedColorCoding {
  prototype?: CustomField;
  id?: string;
  $type?: string;
}

export interface SprintsSettings {
  isExplicit?: boolean;
  explicitQuery?: string | null;
  disableSprints?: boolean;
  hideSubtasksOfCards?: boolean;
  cardOnSeveralSprints?: boolean;
  defaultSprint?: Sprint | null;
  addNewIssueToKanban?: boolean;
  sprintSyncField?: CustomField;
  $type?: string;
}

export interface AgileSharingSettings {
  projectBased?: boolean;
  permittedGroups?: UserGroup[];
  permittedUsers?: User[];
  $type?: string;
}

export interface AgileExtensions {
  reportSettings?: AgileReportSettings;
  $type?: string;
}

export interface AgileReportSettings {
  filterType?: AgileReportFilterType;
  subQuery?: string | null;
  doNotUseBurndown?: boolean;
  yaxis?: BurndownYAxis;
  estimationBurndownField?: any | null;
  id?: string;
  $type?: string;
}

export interface AgileReportFilterType {
  id?: string;
  $type?: string;
}

export interface BurndownYAxis {
  id?: string;
  $type?: string;
}

export interface AgileStatus {
  hasJobs?: boolean;
  valid?: boolean;
  warnings?: string[];
  errors?: string[];
  $type?: string;
}

export interface NotificationsUserProfile {
  id: string;
  notifyOnOwnChanges?: boolean;
  jabberNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  mentionNotificationsEnabled?: boolean;
  duplicateClusterNotificationsEnabled?: boolean;
  mailboxIntegrationNotificationsEnabled?: boolean;
  usePlainTextEmails?: boolean;
  autoWatchOnComment?: boolean;
  autoWatchOnCreate?: boolean;
  autoWatchOnVote?: boolean;
  autoWatchOnUpdate?: boolean;
  $type?: string;
}

export interface Visibility {
  id?: string;
  $type?: string;
}

export interface IssueAttachment {
  id: string;
  name: string;
  author?: User;
  created?: number;
  updated?: number;
  url?: string;
  mimeType?: string;
  size?: number;
  thumbnailURL?: string;
  removed?: boolean;
  issue?: Issue;
  comment?: IssueComment;
  visibility?: Visibility;
  imageDimensions?: {
    width: number;
    height: number;
  };
  $type?: string;
}

export interface IssueComment {
  id: string;
  text?: string;
  created?: number;
  updated?: number;
  author?: User;
  attachments?: IssueAttachment[];
  visibility?: Visibility;
  isPinned?: boolean;
  $type?: string;
}

export interface IssueLinkType {
  id?: string;
  name: string;
  sourceToTarget: string;
  targetToSource: string;
  directed: boolean;
  aggregation?: boolean;
  readOnly?: boolean;
  localizedName?: string;
  localizedSourceToTarget?: string;
  localizedTargetToSource?: string;
  uid?: number;
  $type?: string;
}

export interface IssueLink {
  id: string;
  direction?: 'INWARD' | 'OUTWARD' | 'BOTH';
  linkType?: IssueLinkType;
  issues?: Issue[];
  trimmedIssues?: Issue[];
  issuesSize?: number;
  unresolvedIssuesSize?: number;
  $type?: string;
}

export interface IssueTag {
  id: string;
  name: string;
  untagOnResolve?: boolean;
  owner?: User;
  $type?: string;
}

export interface IssueWatchers {
  hasStar?: boolean;
  $type?: string;
}

export interface IssueVoters {
  hasVote?: boolean;
  $type?: string;
} 