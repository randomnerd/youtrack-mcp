import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ArticleController } from '../controllers/articleController';
import { ArticleView } from '../views/articleView';
import { McpResponse } from '../views/common';
import { ControllerResult, ArticleListResult, ArticleDetailResult } from '../types/controllerResults';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';
import { Request } from '../types/controllerResults';

export function registerArticleRoutes(server: McpServer) {
  // List articles
  server.tool(
    'youtrack_list_articles',
    'List all available articles',
    {
      limit: z.number().optional().default(DEFAULT_PAGINATION.LIMIT).transform(val => 
        Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS)
      ).describe(`Maximum number of articles to return (1-${PAGINATION_LIMITS.PROJECTS})`),
      skip: z.number().optional().default(DEFAULT_PAGINATION.SKIP).transform(val => 
        Math.max(val, 0)
      ).describe('Number of articles to skip (for pagination)'),
      project: z.string().optional().describe('Project short name to filter articles by')
    },
    async ({ limit, skip, project }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ArticleController.listArticles({ limit, skip, project });
      
      return ArticleView.renderList(result as ControllerResult<ArticleListResult>);
    }
  );

  // Get article details
  server.tool(
    'youtrack_get_article',
    'Get details of a specific article',
    {
      articleId: z.string().describe('ID of the article (e.g., "NP-A-1" or database ID)')
    },
    async ({ articleId }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ArticleController.getArticle(articleId);
      
      return ArticleView.renderDetail(result as ControllerResult<ArticleDetailResult>);
    }
  );

  // Get article attachments
  server.tool(
    'youtrack_get_article_attachments',
    'Get attachments for a specific article',
    {
      articleId: z.string().describe('ID of the article'),
      limit: z.number().optional().default(DEFAULT_PAGINATION.LIMIT).transform(val => 
        Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS)
      ).describe(`Maximum number of attachments to return (1-${PAGINATION_LIMITS.PROJECTS})`),
      skip: z.number().optional().default(DEFAULT_PAGINATION.SKIP).transform(val => 
        Math.max(val, 0)
      ).describe('Number of attachments to skip (for pagination)')
    },
    async ({ articleId, limit, skip }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ArticleController.getArticleAttachments(articleId, { limit, skip });
      
      if (!result.success || !result.data) {
        return ArticleView.renderError(result.error || 'Failed to fetch article attachments');
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }]
      };
    }
  );

  // Get article comments
  server.tool(
    'youtrack_get_article_comments',
    'Get comments for a specific article',
    {
      articleId: z.string().describe('ID of the article'),
      limit: z.number().optional().default(DEFAULT_PAGINATION.LIMIT).transform(val => 
        Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS)
      ).describe(`Maximum number of comments to return (1-${PAGINATION_LIMITS.PROJECTS})`),
      skip: z.number().optional().default(DEFAULT_PAGINATION.SKIP).transform(val => 
        Math.max(val, 0)
      ).describe('Number of comments to skip (for pagination)')
    },
    async ({ articleId, limit, skip }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ArticleController.getArticleComments(articleId, { limit, skip });
      
      if (!result.success || !result.data) {
        return ArticleView.renderError(result.error || 'Failed to fetch article comments');
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result.data, null, 2)
        }]
      };
    }
  );

  // Get child articles
  server.tool(
    'youtrack_get_child_articles',
    'Get sub-articles (child articles) of a specific article',
    {
      articleId: z.string().describe('ID of the parent article'),
      limit: z.number().optional().default(DEFAULT_PAGINATION.LIMIT).transform(val => 
        Math.min(Math.max(val, 1), PAGINATION_LIMITS.PROJECTS)
      ).describe(`Maximum number of child articles to return (1-${PAGINATION_LIMITS.PROJECTS})`),
      skip: z.number().optional().default(DEFAULT_PAGINATION.SKIP).transform(val => 
        Math.max(val, 0)
      ).describe('Number of child articles to skip (for pagination)')
    },
    async ({ articleId, limit, skip }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ArticleController.getChildArticles(articleId, { limit, skip });
      
      return ArticleView.renderList(result as ControllerResult<ArticleListResult>);
    }
  );

  // Get parent article
  server.tool(
    'youtrack_get_parent_article',
    'Get the parent article of a specific article',
    {
      articleId: z.string().describe('ID of the child article')
    },
    async ({ articleId }): Promise<McpResponse> => {
      // Call controller to get data
      const result = await ArticleController.getParentArticle(articleId);
      
      if (!result.success) {
        return ArticleView.renderError(result.error || 'Failed to fetch parent article');
      }
      
      if (!result.data) {
        return {
          content: [{
            type: "text",
            text: `Article ${articleId} has no parent article.`
          }]
        };
      }
      
      return ArticleView.renderDetail(result as ControllerResult<ArticleDetailResult>);
    }
  );

  server.resource(
    "articles",
    new ResourceTemplate("youtrack://articles/{articleId?}", { list: undefined }),
    async (uri, req) => ArticleController.handleResourceRequest(uri, {
      ...req,
      params: req.variables || {},
    } as Request)
  );
} 