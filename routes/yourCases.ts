import express from 'express';
import type { Request, Response } from 'express';
import { apiService, type ApiResponse } from '#src/services/apiService.js';
import type { CaseData } from '#types/case-types.js';
import { devLog, devError } from '#src/scripts/helpers/index.js';

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
 * Load cases data using the mock API service
 * This interface will remain the same when switching to real API
 * @param {string} caseType Type of case (new, accepted, opened, closed)
 * @param {string} sortOrder Sort order (asc/desc)
 * @param {number} page Page number for pagination
 * @returns {Promise<{data: CaseData[], meta: ApiResponse<CaseData>['meta']}>} Case data with pagination metadata
 */
async function loadCasesData(caseType: string, sortOrder = 'asc', page = DEFAULT_PAGE): Promise<{ data: CaseData[], meta: ApiResponse<CaseData>['meta'] }> {
  try {
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
      return { data: [], meta: { total: EMPTY_TOTAL, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, sortBy: 'dateReceived', sortOrder: 'asc' } };
    }

    // Validate sort order
    const validSortOrder: 'asc' | 'desc' = sortOrder === 'desc' ? 'desc' : 'asc';
    const validPage = Math.max(DEFAULT_PAGE, page);

    // Use API service (currently mock, will be real API in future)
    const response = await apiService.getCases({
      caseType,
      sortOrder: validSortOrder,
      sortBy: 'dateReceived',
      page: validPage
    });

    if (response.status === 'error') {
      devError(`API error loading ${caseType} cases: ${response.message ?? 'Unknown error'}`);
      return { data: [], meta: { total: EMPTY_TOTAL, page: validPage, limit: DEFAULT_LIMIT, sortBy: 'dateReceived', sortOrder: validSortOrder } };
    }

    devLog(`Successfully loaded ${response.data.length} ${caseType} cases via API service (page ${validPage})`);
    return { data: response.data, meta: response.meta };
  } catch (error) {
    devError(`Error loading ${caseType} cases: ${String(error)}`);
    return { data: [], meta: { total: EMPTY_TOTAL, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, sortBy: 'dateReceived', sortOrder: 'asc' } };
  }
}


/* GET your cases - new tab. */
router.get('/new', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('new', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'new',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET your cases - opened tab. */
router.get('/opened', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('opened', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'opened',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET your cases - accepted tab. */
router.get('/accepted', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('accepted', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'accepted',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET your cases - closed tab. */
router.get('/closed', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('closed', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'closed',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

export default router;
