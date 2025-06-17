import * as YouTrackTypes from '../types/youtrack';
import { CommonView, McpResponse, ResourceResponse } from './common';
import { createSeparator } from '../utils/view-utils';
import { ControllerResult, ArticleDetailResult, ArticleListResult } from '../types/controllerResults';
import { formatYouTrackData } from '../utils/youtrack-json-formatter';

export class ArticleView {
  static renderDetail(result: ControllerResult<ArticleDetailResult>, json = true): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch article details');
    }
    
    const { article } = result.data;
    
    return {
      content: [{ 
        type: "text", 
        text: json ? formatYouTrackData(article, { stringify: true }) : this.formatArticleForAI(article), 
      }]
    };
  }
  
  static renderList(result: ControllerResult<ArticleListResult>, json = true): McpResponse {
    if (!result.success || !result.data) {
      return this.renderError(result.error || 'Failed to fetch articles');
    }
    
    const { articles, project } = result.data;
    
    if (articles.length === 0) {
      return this.renderEmpty(`No articles found${project ? ` in project "${project}"` : ''}.`);
    }
    
    try {
      const data = json ? formatYouTrackData(articles, { stringify: true }) : this.formatArticlesForAI(articles);
      
      return {
        content: [
          { type: "text" as const, text: data }
        ]
      };
    } catch (error) {
      return {
        content: [
          { 
            type: "text" as const, 
            text: `Error processing articles: ${(error as Error).message}`
          }
        ]
      };
    }
  }
  
  static renderEmpty = CommonView.renderEmpty;
  static renderError = CommonView.renderError;

  static handleResourceRequest(uri: URL, article?: YouTrackTypes.Article): ResourceResponse {
    if (!article) {
      return CommonView.createResourceResponse(uri, "Please specify an article ID to view article details.");
    }
    
    try {
      return CommonView.createResourceResponse(uri, formatYouTrackData(article, { stringify: true }));
    } catch (error) {
      return CommonView.createResourceResponse(uri, `Error processing article: ${(error as Error).message}`);
    }
  }

  /**
   * Format a single article for AI consumption
   */
  private static formatArticleForAI(article: YouTrackTypes.Article): string {
    const separator = createSeparator();
    const lines: string[] = [];
    
    lines.push(`${separator}`);
    lines.push(`ARTICLE: ${article.idReadable} - ${article.summary}`);
    lines.push(`${separator}`);
    
    if (article.project) {
      lines.push(`Project: ${article.project.shortName} (${article.project.name})`);
    }
    
    if (article.reporter) {
      lines.push(`Reporter: ${article.reporter.name || article.reporter.login}`);
    }
    
    if (article.created) {
      lines.push(`Created: ${new Date(article.created).toISOString()}`);
    }
    
    if (article.updated) {
      lines.push(`Updated: ${new Date(article.updated).toISOString()}`);
    }
    
    if (article.hasStar !== undefined) {
      lines.push(`Starred: ${article.hasStar ? 'Yes' : 'No'}`);
    }
    
    if (article.tags && article.tags.length > 0) {
      lines.push(`Tags: ${article.tags.map(tag => tag.name).join(', ')}`);
    }
    
    lines.push('');
    
    if (article.content) {
      lines.push('CONTENT:');
      lines.push(article.content);
      lines.push('');
    }
    
    if (article.childArticles && article.childArticles.length > 0) {
      lines.push('CHILD ARTICLES:');
      article.childArticles.forEach(child => {
        lines.push(`  - ${child.idReadable}: ${child.summary}`);
      });
      lines.push('');
    }
    
    if (article.comments && article.comments.length > 0) {
      lines.push('COMMENTS:');
      article.comments.forEach((comment, index) => {
        lines.push(`  Comment ${index + 1} by ${comment.author?.name || 'Unknown'} (${comment.created ? new Date(comment.created).toISOString() : 'Unknown date'}):`);
        if (comment.text) {
          lines.push(`    ${comment.text}`);
        }
        lines.push('');
      });
    }
    
    lines.push(`${separator}`);
    
    return lines.join('\n');
  }

  /**
   * Format multiple articles for AI consumption
   */
  private static formatArticlesForAI(articles: YouTrackTypes.Article[]): string {
    const separator = createSeparator();
    const lines: string[] = [];
    
    lines.push(`${separator}`);
    lines.push(`ARTICLES (${articles.length} total)`);
    lines.push(`${separator}`);
    
    articles.forEach((article, index) => {
      lines.push(`${index + 1}. ${article.idReadable} - ${article.summary}`);
      
      if (article.project) {
        lines.push(`   Project: ${article.project.shortName}`);
      }
      
      if (article.reporter) {
        lines.push(`   Reporter: ${article.reporter.name || article.reporter.login}`);
      }
      
      if (article.created) {
        lines.push(`   Created: ${new Date(article.created).toISOString()}`);
      }
      
      if (article.content) {
        const preview = article.content.length > 100 
          ? article.content.substring(0, 100) + '...'
          : article.content;
        lines.push(`   Content: ${preview.replace(/\n/g, ' ')}`);
      }
      
      lines.push('');
    });
    
    lines.push(`${separator}`);
    
    return lines.join('\n');
  }
} 