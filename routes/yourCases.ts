import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import type { CaseData } from '#types/case-types.js';
import { devLog, devError, createProcessedError } from '#src/scripts/helpers/index.js';

// Create a new router for your-cases routes
const router = express.Router();

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const EMPTY_TOTAL = 0;

/**
 * Safely parse page number from query parameter
 * @param {unknown} pageParam Query parameter value
 * @returns {number} Valid page number (minimum 1)
 */
function parsePageNumber(pageParam: unknown): number {
  if (typeof pageParam !== 'string') {
    return DEFAULT_PAGE;
  }

  const parsed = parseInt(pageParam, 10);
  return Number.isNaN(parsed) || parsed < DEFAULT_PAGE ? DEFAULT_PAGE : parsed;
}

/**
 * Load cases data using the API service with axios middleware
 * @param {Request} req Express request object (contains axios middleware)
 * @param {string} caseType Type of case (new, accepted, opened, closed)
 * @param {string} sortOrder Sort order (asc/desc)
 * @param {number} page Page number for pagination
 * @returns {Promise<{data: CaseData[], pagination: {total: number, page: number, limit: number, totalPages?: number}}>} Case data with pagination metadata
 * @throws {Error} Throws error to be handled by global error handler
 */
async function loadCasesData(
  req: Request,
  caseType: string,
  sortOrder = 'desc',
  page = DEFAULT_PAGE
): Promise<{ data: CaseData[], pagination: { total: number, page: number, limit: number, totalPages?: number } }> {
  // Validate case type
  const validCaseTypes = ['new', 'accepted', 'opened', 'closed'] as const;
  type ValidCaseType = typeof validCaseTypes[number];

  /**
   * Type guard to check if case type is valid
   * @param {string} type Case type to validate
   * @returns {boolean} True if valid case type
   */
  const isValidCaseType = (type: string): type is ValidCaseType =>
    (validCaseTypes as readonly string[]).includes(type);

  if (!isValidCaseType(caseType)) {
    devError(`Invalid case type: ${caseType}`);
    return { data: [], pagination: { total: EMPTY_TOTAL, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT } };
  }

  // Validate sort order
  const validSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
  const validPage = Math.max(DEFAULT_PAGE, page);

  // Use API service with axios middleware
  const response = await apiService.getCases(req.axiosMiddleware, {
    caseType,
    sortOrder: validSortOrder,
    sortBy: 'dateReceived',
    page: validPage
  });

  if (response.status === 'error') {
    devError(`API error loading ${caseType} cases: ${response.message ?? 'Unknown error'}`);
    return { data: [], pagination: { total: EMPTY_TOTAL, page: validPage, limit: DEFAULT_LIMIT } };
  }

  devLog(`Successfully loaded ${response.data.length} ${caseType} cases via API service (page ${validPage})`);
  return {
    data: response.data,
    pagination: {
      total: response.pagination.total ?? EMPTY_TOTAL,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages
    }
  };
}

/**
 * Generic route handler for cases with different tabs
 * @param {string} caseType Type of case (new, accepted, opened, closed)
 * @returns {Function} Express route handler function
 */
function createCaseRouteHandler(caseType: string) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';
      const page = parsePageNumber(req.query.page);
      const result = await loadCasesData(req, caseType, sortOrder, page);

      res.render('cases/index', {
        activeTab: caseType,
        data: result.data,
        sortOrder,
        pagination: result.pagination
      });
    } catch (error) {
      // Use the error processing utility
      const processedError = createProcessedError(error, `loading ${caseType} cases`);

      // Pass the processed error to the global error handler
      next(processedError);
    }
  };
}

/* GET your cases - new tab. */
router.get('/new', createCaseRouteHandler('new'));

/* GET your cases - opened tab. */
router.get('/opened', createCaseRouteHandler('opened'));

/* GET your cases - accepted tab. */
router.get('/accepted', createCaseRouteHandler('accepted'));

/* GET your cases - closed tab. */
router.get('/closed', createCaseRouteHandler('closed'));

export default router;
