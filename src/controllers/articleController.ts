import { ArticleModel } from '../models/article';
import { McpResponse, ResourceResponse } from '../views/common';
import { extractParam, createResourceErrorResponse, withErrorHandling } from '../utils/controller-utils';
import { ControllerResult, ArticleDetailResult, ArticleListResult, Request } from '../types/controllerResults';
import { PAGINATION_LIMITS, DEFAULT_PAGINATION } from '../utils/constants';

interface ListArticlesOptions {
  limit?: number;
  skip?: number;
  project?: string;
}

export class ArticleController {
  static getArticle = withErrorHandling(
    async (articleId: string): Promise<ControllerResult<ArticleDetailResult>> => {
      const article = await ArticleModel.getById(articleId);
      
      if (!article) {
        return {
          success: false,
          error: `No article found with ID: ${articleId}`
        };
      }
      
      return {
        success: true,
        data: {
          article
        }
      };
    },
    'Error fetching article details'
  );
  
  static listArticles = withErrorHandling(
    async (options?: ListArticlesOptions): Promise<ControllerResult<ArticleListResult>> => {
      const articles = await ArticleModel.listArticles(options);
      
      // Create title for the list
      const title = `Found ${articles.length} articles${options?.project ? ` in project "${options.project}"` : ''}${options?.limit ? `\nShowing ${Math.min(articles.length, options.limit)} results starting from ${options.skip || 0}.` : ''}`;
      
      return {
        success: true,
        data: {
          articles,
          total: articles.length,
          project: options?.project,
          pagination: {
            limit: options?.limit,
            skip: options?.skip || 0
          }
        }
      };
    },
    'Error fetching articles'
  );
  
  static getArticleAttachments = withErrorHandling(
    async (articleId: string, options?: { limit?: number; skip?: number }): Promise<ControllerResult<any>> => {
      const attachments = await ArticleModel.getArticleAttachments(articleId, options);
      
      return {
        success: true,
        data: {
          attachments,
          total: attachments.length,
          articleId
        }
      };
    },
    'Error fetching article attachments'
  );
  
  static getArticleComments = withErrorHandling(
    async (articleId: string, options?: { limit?: number; skip?: number }): Promise<ControllerResult<any>> => {
      const comments = await ArticleModel.getArticleComments(articleId, options);
      
      return {
        success: true,
        data: {
          comments,
          total: comments.length,
          articleId
        }
      };
    },
    'Error fetching article comments'
  );
  
  static getChildArticles = withErrorHandling(
    async (articleId: string, options?: { limit?: number; skip?: number }): Promise<ControllerResult<ArticleListResult>> => {
      const articles = await ArticleModel.getChildArticles(articleId, options);
      
      return {
        success: true,
        data: {
          articles,
          total: articles.length,
          pagination: {
            limit: options?.limit,
            skip: options?.skip || 0
          }
        }
      };
    },
    'Error fetching child articles'
  );
  
  static getParentArticle = withErrorHandling(
    async (articleId: string): Promise<ControllerResult<ArticleDetailResult | null>> => {
      const article = await ArticleModel.getParentArticle(articleId);
      
      if (!article) {
        return {
          success: true,
          data: null
        };
      }
      
      return {
        success: true,
        data: {
          article
        }
      };
    },
    'Error fetching parent article'
  );

  static async handleResourceRequest(uri: URL, req: Request): Promise<ResourceResponse> {
    const articleId = extractParam(req.params, 'articleId');
    
    if (!articleId) {
      return createResourceErrorResponse(uri, 'Article ID is required');
    }
    
    const result = await ArticleController.getArticle(articleId);
    
    if (!result.success || !result.data?.article) {
      return createResourceErrorResponse(uri, result.error || 'Article not found');
    }
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(result.data.article, null, 2)
      }]
    };
  }
} 