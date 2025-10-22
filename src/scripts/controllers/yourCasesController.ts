import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import type { CaseData } from '#types/case-types.js';
import { devLog, devError, createProcessedError } from '#src/scripts/helpers/index.js';

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 2;
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
 * @param {object} sortParams Sort parameters object
 * @param {string} sortParams.sortBy Sort field
 * @param {'asc' | 'desc'} sortParams.sortOrder Sort order (asc/desc)
 * @param {number} page Page number for pagination
 * @returns {Promise<{data: CaseData[], pagination: {total: number, page: number, limit: number, totalPages?: number}}>} Case data with pagination metadata
 * @throws {Error} Throws error to be handled by global error handler
 */
async function loadCasesData(
  req: Request,
  caseType: string,
  sortParams: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'dateReceived', sortOrder: 'desc' },
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
  const validSortOrder: 'asc' | 'desc' = sortParams.sortOrder === 'asc' ? 'asc' : 'desc';
  const validPage = Math.max(DEFAULT_PAGE, page);

  // Use API service with axios middleware
  const response = await apiService.getCases(req.axiosMiddleware, {
    caseType,
    sortOrder: validSortOrder,
    sortBy: sortParams.sortBy,
    page: validPage,
    limit: DEFAULT_LIMIT
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
export function createCaseRouteHandler(caseType: string) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse ordering parameter (e.g., 'provider_assigned_at' for asc, '-provider_assigned_at' for desc)
      const ordering = typeof req.query.ordering === 'string' ? req.query.ordering : '';
      let sortBy = 'provider_assigned_at';
      let sortOrder: 'asc' | 'desc' = 'desc';

      if (ordering !== '') {
        if (ordering.startsWith('-')) {
          const PREFIX_LENGTH = 1;
          sortBy = ordering.substring(PREFIX_LENGTH);
          sortOrder = 'desc';
        } else {
          sortBy = ordering;
          sortOrder = 'asc';
        }
      }

      const page = parsePageNumber(req.query.page);
      const result = await loadCasesData(req, caseType, { sortBy, sortOrder }, page);

      res.render('cases/index', {
        activeTab: caseType,
        data: result.data,
        sortBy,
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
