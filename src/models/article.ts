import youtrackClient from '../youtrack-client';
import * as YouTrackTypes from '../types/youtrack';

interface ListArticlesOptions {
  limit?: number;
  skip?: number;
  project?: string;
}

interface GetArticleAttachmentsOptions {
  limit?: number;
  skip?: number;
}

interface GetArticleCommentsOptions {
  limit?: number;
  skip?: number;
}

interface GetChildArticlesOptions {
  limit?: number;
  skip?: number;
}

export class ArticleModel {
  static async getById(articleId: string): Promise<YouTrackTypes.Article | null> {
    return youtrackClient.getArticle(articleId);
  }
  
  static async listArticles(options?: ListArticlesOptions): Promise<YouTrackTypes.Article[]> {
    return youtrackClient.listArticles(options);
  }
  
  static async getArticleAttachments(
    articleId: string, 
    options?: GetArticleAttachmentsOptions
  ): Promise<YouTrackTypes.ArticleAttachment[]> {
    return youtrackClient.getArticleAttachments(articleId, options);
  }
  
  static async getArticleComments(
    articleId: string,
    options?: GetArticleCommentsOptions
  ): Promise<YouTrackTypes.ArticleComment[]> {
    return youtrackClient.getArticleComments(articleId, options);
  }
  
  static async getChildArticles(
    articleId: string,
    options?: GetChildArticlesOptions
  ): Promise<YouTrackTypes.Article[]> {
    return youtrackClient.getChildArticles(articleId, options);
  }
  
  static async getParentArticle(articleId: string): Promise<YouTrackTypes.Article | null> {
    return youtrackClient.getParentArticle(articleId);
  }
} 