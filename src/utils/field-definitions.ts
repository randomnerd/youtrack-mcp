/**
 * Field definitions for YouTrack API
 * These define which fields to fetch for different entity types
 */

/**
 * Default fields to fetch for issues
 */
export const DEFAULT_ISSUE_FIELDS = 'id,idReadable,Stage,summary,description,created,updated,resolved,numberInProject,$type,project($type,id,name),reporter($type,id,login,ringId,name),updater($type,id,login),customFields($type,id,name,projectCustomField(id,field(id,name)),value($type,id,name,isResolved,fullName,login,avatarUrl,color(id))),links($type,direction,id,linkType($type,id,localizedName)),visibility($type,id,permittedGroups($type,id,name),permittedUsers($type,id,login)),comments($type,id,text,author($type,id,login),created)';

/**
 * Default fields to fetch for sprints
 */
export const DEFAULT_SPRINT_FIELDS = `id,name,goal,start,finish,archived,isDefault,unresolvedIssuesCount,issues(id,idReadable,projectCustomField(id,field(id,name))`;

/**
 * Default fields to fetch for agile boards
 */
export const DEFAULT_AGILE_FIELDS = `id,name,owner(id,name,login),projects(id,name),sprints(${DEFAULT_SPRINT_FIELDS}),columnSettings(field(id,name),columns(presentation,isResolved,fieldValues(id,name)))`; 