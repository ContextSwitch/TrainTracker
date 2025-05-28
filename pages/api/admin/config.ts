import type { NextApiRequest, NextApiResponse } from 'next';
import { appConfig } from '../../../app/config';
import { verifyToken } from '../../../app/utils/auth-client';

type ConfigResponse = {
  success: boolean;
  message?: string;
  config?: any;
  error?: string;
};

/**
 * API endpoint for managing application configuration
 * GET: Returns the current configuration
 * POST: Updates the configuration
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse>
) {
  // Check if the user is authenticated as an admin
  try {
    // Check for auth header (set by client-side code when using localStorage)
    const authHeader = req.headers['x-admin-auth'];
    if (authHeader !== 'true') {
      // Get the admin user from the request cookies
      const token = req.cookies.admin_token;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - No token found'
        });
      }
      
      const user = verifyToken(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - Invalid token'
        });
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Authentication error'
    });
  }

  // Handle GET request - return current configuration
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      config: {
        scraperType: appConfig.scraperType,
        notificationsEnabled: appConfig.notificationsEnabled,
        checkIntervalMinutes: appConfig.checkIntervalMinutes,
        approachWindowMinutes: appConfig.approachWindowMinutes,
        postArrivalWindowMinutes: appConfig.postArrivalWindowMinutes
      }
    });
  }

  // Handle POST request - update configuration
  if (req.method === 'POST') {
    try {
      const { scraperType, notificationsEnabled, checkIntervalMinutes, approachWindowMinutes, postArrivalWindowMinutes } = req.body;

      // Update scraper type if provided
      if (scraperType !== undefined) {
        if (scraperType !== 'dixieland' && scraperType !== 'transitdocs') {
          return res.status(400).json({
            success: false,
            error: 'Invalid scraper type. Must be "dixieland" or "transitdocs".'
          });
        }
        appConfig.scraperType = scraperType;
      }

      // Update notifications if provided
      if (notificationsEnabled !== undefined) {
        appConfig.notificationsEnabled = Boolean(notificationsEnabled);
      }

      // Update check interval if provided
      if (checkIntervalMinutes !== undefined) {
        const interval = Number(checkIntervalMinutes);
        if (isNaN(interval) || interval < 1) {
          return res.status(400).json({
            success: false,
            error: 'Check interval must be a positive number.'
          });
        }
        appConfig.checkIntervalMinutes = interval;
      }

      // Update approach window if provided
      if (approachWindowMinutes !== undefined) {
        const window = Number(approachWindowMinutes);
        if (isNaN(window) || window < 1) {
          return res.status(400).json({
            success: false,
            error: 'Approach window must be a positive number.'
          });
        }
        appConfig.approachWindowMinutes = window;
      }

      // Update post arrival window if provided
      if (postArrivalWindowMinutes !== undefined) {
        const window = Number(postArrivalWindowMinutes);
        if (isNaN(window) || window < 1) {
          return res.status(400).json({
            success: false,
            error: 'Post arrival window must be a positive number.'
          });
        }
        appConfig.postArrivalWindowMinutes = window;
      }

      // Return success with updated config
      return res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        config: {
          scraperType: appConfig.scraperType,
          notificationsEnabled: appConfig.notificationsEnabled,
          checkIntervalMinutes: appConfig.checkIntervalMinutes,
          approachWindowMinutes: appConfig.approachWindowMinutes,
          postArrivalWindowMinutes: appConfig.postArrivalWindowMinutes
        }
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
