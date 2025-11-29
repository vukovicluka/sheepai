import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Lazy initialization of email transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    // Only create transporter if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      transporter = nodemailer.createTransport(emailConfig);
      logger.info('Email transporter initialized');
    } else {
      logger.warn('SMTP credentials not configured. Email notifications will be disabled.');
    }
  }
  return transporter;
};

/**
 * Sends an email notification to a user about a new article
 */
const sendArticleNotification = async (userEmail, article) => {
  try {
    const emailTransporter = getTransporter();

    if (!emailTransporter) {
      logger.warn('Email transporter not available. Skipping email notification.');
      return false;
    }

    const articleUrl = article.url || '#';
    const articleTitle = article.title || 'New Article';
    const articleSummary = article.summary || article.content?.substring(0, 200) + '...' || 'No summary available';
    const publishedDate = article.publishedDate
      ? new Date(article.publishedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : 'Recently';

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'SheepAI'}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `New Article: ${articleTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 0 0 8px 8px;
            }
            .article-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 15px;
            }
            .article-summary {
              background: white;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              border-left: 4px solid #667eea;
            }
            .article-meta {
              color: #666;
              font-size: 14px;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #888;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Article Alert</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>A new article matching your interests has been published!</p>

            <div class="article-title">${articleTitle}</div>

            <div class="article-meta">
              <strong>Published:</strong> ${publishedDate}
            </div>

            <div class="article-summary">
              <strong>Summary:</strong><br>
              ${articleSummary}
            </div>

            <a href="${articleUrl}" class="button" style="color: white;">Read Full Article</a>

            <div class="footer">
              <p>This is an automated notification from SheepAI.</p>
              <p>You are receiving this because you subscribed to articles in this category.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Article Alert

Hello,

A new article matching your interests has been published!

Title: ${articleTitle}
Published: ${publishedDate}

Summary:
${articleSummary}

Read the full article: ${articleUrl}

---
This is an automated notification from SheepAI.
You are receiving this because you subscribed to articles in this category.
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`Email notification sent to ${userEmail} for article: ${articleTitle}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${userEmail}:`, error.message);
    return false;
  }
};

/**
 * Calculates relevance score for an article based on user's category
 * Returns a score from 0-100
 */
const calculateRelevanceScore = (article, userCategory) => {
  if (!userCategory) return 50;

  const categoryLower = userCategory.toLowerCase().trim();
  const title = (article.title || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const summary = (article.summary || '').toLowerCase();
  const tags = (article.tags || []).map(t => t.toLowerCase()).join(' ');

  const allText = `${title} ${content} ${summary} ${tags}`;

  let score = 0;

  // Exact match in title (highest weight)
  if (title.includes(categoryLower)) {
    score += 40;
  }

  // Exact match in summary
  if (summary.includes(categoryLower)) {
    score += 30;
  }

  // Match in content
  const contentMatches = (content.match(new RegExp(categoryLower, 'g')) || []).length;
  score += Math.min(contentMatches * 5, 20);

  // Match in tags
  if (tags.includes(categoryLower)) {
    score += 10;
  }

  // Ensure score is between 0-100
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Gets color for relevance score
 */
const getRelevanceColor = (score) => {
  if (score >= 80) return '#4caf50'; // Green - High relevance
  if (score >= 60) return '#8bc34a'; // Light green - Medium-high
  if (score >= 40) return '#ffc107'; // Yellow - Medium
  if (score >= 20) return '#ff9800'; // Orange - Low-medium
  return '#f44336'; // Red - Low
};

/**
 * Gets sentiment color
 */
const getSentimentColor = (sentiment) => {
  const colors = {
    positive: '#4caf50',
    negative: '#f44336',
    neutral: '#9e9e9e',
  };
  return colors[sentiment?.toLowerCase()] || colors.neutral;
};

/**
 * Gets sentiment icon/emoji
 */
const getSentimentIcon = (sentiment) => {
  const icons = {
    positive: '✓',
    negative: '⚠',
    neutral: '—',
  };
  return icons[sentiment?.toLowerCase()] || icons.neutral;
};

/**
 * Sends a batch email notification to a user with multiple articles
 */
const sendBatchArticleNotification = async (userEmail, articles, userCategory) => {
  try {
    const emailTransporter = getTransporter();

    if (!emailTransporter) {
      logger.warn('Email transporter not available. Skipping email notification.');
      return false;
    }

    if (articles.length === 0) {
      return false;
    }

    // Calculate relevance scores and sort articles by relevance (highest first)
    const articlesWithScores = articles.map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article, userCategory),
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    const articleCount = articles.length;
    const subject = articleCount === 1
      ? `New Article: ${articles[0].title || 'New Article'}`
      : `${articleCount} New Articles Matching Your Interests`;

    // Generate HTML for all articles with visual enhancements
    const articlesHTML = articlesWithScores.map((article, index) => {
      const articleUrl = article.url || '#';
      const articleTitle = article.title || 'New Article';
      const articleSummary = article.summary || article.content?.substring(0, 250) + '...' || 'No summary available';
      const publishedDate = article.publishedDate
        ? new Date(article.publishedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
        : 'Recently';

      const relevanceScore = article.relevanceScore || 50;
      const relevanceColor = getRelevanceColor(relevanceScore);
      const sentiment = article.sentiment || 'neutral';
      const sentimentColor = getSentimentColor(sentiment);
      const sentimentIcon = getSentimentIcon(sentiment);
      const tags = article.tags || [];

      // Calculate relevance bar width
      const relevanceBarWidth = relevanceScore;

      return `
        <div class="article-item" style="background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 5px solid ${relevanceColor};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 200px;">
              <h3 class="article-title" style="font-size: 20px; font-weight: bold; color: #333; margin: 0 0 8px 0; line-height: 1.3;">
                ${articleTitle}
              </h3>
              <div class="article-meta" style="color: #666; font-size: 13px; display: flex; gap: 12px; flex-wrap: wrap;">
                <span>📅 ${publishedDate}</span>
                ${article.author ? `<span>✍️ ${article.author}</span>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="background: ${relevanceColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 8px; display: inline-block;">
                ${relevanceScore}% Match
              </div>
              <div style="width: 80px; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                <div style="width: ${relevanceBarWidth}%; height: 100%; background: ${relevanceColor}; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <span style="background: ${sentimentColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
              ${sentimentIcon} ${sentiment}
            </span>
            ${tags.slice(0, 3).map(tag => `
              <span style="background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                #${tag}
              </span>
            `).join('')}
          </div>

          <div class="article-summary" style="background: linear-gradient(to right, #f9f9f9 0%, #ffffff 100%); padding: 15px; border-radius: 6px; margin: 12px 0; border-left: 3px solid ${relevanceColor};">
            <strong style="color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Summary:</strong>
            <p style="margin: 8px 0 0 0; color: #444; line-height: 1.6; font-size: 14px;">${articleSummary}</p>
          </div>

          ${article.keyPoints && article.keyPoints.length > 0 ? `
            <div style="margin: 12px 0;">
              <strong style="color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Key Points:</strong>
              <ul style="margin: 8px 0 0 20px; padding: 0; color: #444; font-size: 13px; line-height: 1.8;">
                ${article.keyPoints.slice(0, 3).map(point => `<li style="margin-bottom: 4px;">${point}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <a href="${articleUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px; font-size: 14px; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);">
            Read Full Article →
          </a>
        </div>
      `;
    }).join('');

    // Generate text version
    const articlesText = articles.map((article, index) => {
      const articleUrl = article.url || '#';
      const articleTitle = article.title || 'New Article';
      const articleSummary = article.summary || article.content?.substring(0, 200) + '...' || 'No summary available';
      const publishedDate = article.publishedDate
        ? new Date(article.publishedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        : 'Recently';

      return `
${index + 1}. ${articleTitle}
   Published: ${publishedDate}
   Summary: ${articleSummary}
   Read: ${articleUrl}
`;
    }).join('\n\n');

    // Calculate average relevance score
    const avgRelevance = Math.round(
      articlesWithScores.reduce((sum, a) => sum + a.relevanceScore, 0) / articlesWithScores.length
    );
    const avgRelevanceColor = getRelevanceColor(avgRelevance);

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'SheepAI'}" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 650px;
              margin: 0 auto;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              margin: 20px auto;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header-stats {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-top: 15px;
              flex-wrap: wrap;
            }
            .stat-item {
              background: rgba(255,255,255,0.2);
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
            }
            .content {
              padding: 30px 20px;
              background: #fafafa;
            }
            .intro {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid ${avgRelevanceColor};
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .intro h2 {
              margin: 0 0 10px 0;
              font-size: 20px;
              color: #333;
            }
            .intro p {
              margin: 8px 0;
              color: #666;
              font-size: 14px;
            }
            .relevance-badge {
              display: inline-block;
              background: ${avgRelevanceColor};
              color: white;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              margin-top: 10px;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 5px 0;
              color: #888;
              font-size: 12px;
            }
            @media only screen and (max-width: 600px) {
              body {
                margin: 0;
              }
              .container {
                margin: 0;
                border-radius: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📰 New Articles Alert</h1>
              <div class="header-stats">
                <div class="stat-item">${articleCount} Article${articleCount === 1 ? '' : 's'}</div>
                <div class="stat-item">${avgRelevance}% Avg Match</div>
                <div class="stat-item">${userCategory}</div>
              </div>
            </div>
            <div class="content">
              <div class="intro">
                <h2>Hello! 👋</h2>
                <p>We found <strong style="color: #667eea;">${articleCount}</strong> new article${articleCount === 1 ? '' : 's'} matching your interest in "<strong style="color: #764ba2;">${userCategory}</strong>"!</p>
                <p style="font-size: 13px; margin-top: 12px;">Articles are sorted by relevance to help you prioritize your reading.</p>
                <div class="relevance-badge">Average Relevance: ${avgRelevance}%</div>
              </div>
              ${articlesHTML}
            </div>
            <div class="footer">
              <p><strong>SheepAI</strong> - Automated Article Discovery</p>
              <p>You're receiving this because you subscribed to articles in the "<strong>${userCategory}</strong>" category.</p>
              <p style="margin-top: 10px; font-size: 11px; color: #aaa;">Articles sorted by relevance score • Color coding indicates match quality</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Articles Alert

Hello,

We found ${articleCount} new article${articleCount === 1 ? '' : 's'} matching your interest in "${userCategory}"!

${articlesText}

---
This is an automated notification from SheepAI.
You are receiving this because you subscribed to articles in the "${userCategory}" category.
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`Batch email notification sent to ${userEmail} with ${articleCount} articles`);
    return true;
  } catch (error) {
    logger.error(`Error sending batch email to ${userEmail}:`, error.message);
    return false;
  }
};

/**
 * Sends batch email notifications to users about new articles from a scrape
 * Groups articles by user category and sends one email per user with all matching articles
 */
const notifyUsersAboutBatchArticles = async (articles) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.debug('SMTP not configured, skipping email notifications');
      return;
    }

    if (!articles || articles.length === 0) {
      logger.debug('No articles to notify about, skipping email notifications');
      return;
    }

    const User = (await import('../models/User.js')).default;

    // Get all users
    const users = await User.find({}).lean();

    if (users.length === 0) {
      logger.debug('No users found, skipping email notifications');
      return;
    }

    // Group articles by matching users
    const userArticleMap = new Map(); // Map<userEmail, {user, articles: []}>

    for (const user of users) {
      const categoryLower = user.category?.toLowerCase().trim();
      if (!categoryLower) continue;

      const matchingArticles = articles.filter(article => {
        const articleText = `${article.title || ''} ${article.content || ''}`.toLowerCase();
        return articleText.includes(categoryLower);
      });

      if (matchingArticles.length > 0) {
        userArticleMap.set(user.email, {
          user,
          articles: matchingArticles,
        });
      }
    }

    if (userArticleMap.size === 0) {
      logger.debug('No users match any articles, skipping email notifications');
      return;
    }

    logger.info(`Sending batch email notifications to ${userArticleMap.size} users for ${articles.length} new articles`);

    // Send batch emails to all matching users
    const emailPromises = Array.from(userArticleMap.entries()).map(([email, { user, articles: userArticles }]) =>
      sendBatchArticleNotification(email, userArticles, user.category)
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failureCount = results.length - successCount;

    logger.info(`Batch email notifications sent: ${successCount} successful, ${failureCount} failed`);
  } catch (error) {
    logger.error('Error in notifyUsersAboutBatchArticles:', error.message);
  }
};

export default {
  sendArticleNotification,
  sendBatchArticleNotification,
  notifyUsersAboutBatchArticles,
};

