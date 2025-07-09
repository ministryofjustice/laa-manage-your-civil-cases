import express from 'express';
import type { Request, Response } from 'express';
import { apiService, type ApiResponse } from '#src/services/apiService.js';
import type { CaseData } from '#types/case-types.js';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import client_details from 'tests/fixtures/cases/all-client-details.json' with { type: "json" };

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
async function loadCasesData(caseType: string, sortOrder = 'desc', page = DEFAULT_PAGE): Promise<{ data: CaseData[], meta: ApiResponse<CaseData>['meta'] }> {
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
      return { data: [], meta: { total: EMPTY_TOTAL, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, sortBy: 'dateReceived', sortOrder: 'desc' } };
    }

    // Validate sort order
    const validSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
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
    return { data: [], meta: { total: EMPTY_TOTAL, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, sortBy: 'dateReceived', sortOrder: 'desc' } };
  }
}

/**
 * Return a case details page if it exists
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {string} activeTab The active tab of the primary navigation 
 * @param {string} activeSubNavigationTab The active tab of the sub navigation 
 * @returns {void} Page to be returned
 */
function handleClientDetails(req: Request, res: Response, activeTab: string, activeSubNavigationTab: string): void {
  const result = client_details;

  // Find the case that matches the caseReference from the URL
  const caseMatch = result.find(
    (item) => item.caseReference === req.params.caseReference
  );

  if (caseMatch != null) {
    res.render('cases/client-details.njk', {
      activeTab,
      activeSubNavigationTab,
      client: caseMatch,
      caseReference: caseMatch.caseReference
    });
  } else {
    res.render('main/error.njk', {
      status: '404',
      error: 'Case not found'
    });
  }
}

/* GET your cases - new tab. */
router.get('/new', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('new', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'new',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET client details for a specific case from the new tab. */
router.get('/new/:caseReference/client-details', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'new', 'client_details');
});

/* GET client details for a specific case from the new tab & scope tab. */
router.get('/new/:caseReference/scope', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'new', 'scope');
});

/* GET client details for a specific case from the new tab & financial_eligibility tab. */
router.get('/new/:caseReference/financial-eligibility', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'new', 'financial_eligibility');
});

/* GET client details for a specific case from the new tab & notes_and_history tab. */
router.get('/new/:caseReference/notes-and-history', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'new', 'notes_and_history');
});

/* GET your cases - opened tab. */
router.get('/opened', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('opened', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'opened',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET client details for a specific case from the opened tab. */
router.get('/opened/:caseReference/client-details', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'opened', 'client_details');
});

/* GET client details for a specific case from the opened tab & scope tab. */
router.get('/opened/:caseReference/scope', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'opened', 'scope');
});

/* GET client details for a specific case from the opened tab & scope tab & financial_eligibility tab. */
router.get('/opened/:caseReference/financial-eligibility', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'opened', 'financial_eligibility');
});

/* GET client details for a specific case from the opened tab & scope tab & notes_and_history tab. */
router.get('/opened/:caseReference/notes-and-history', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'opened', 'notes_and_history');
});

/* GET your cases - accepted tab. */
router.get('/accepted', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('accepted', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'accepted',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET client details for a specific case from the accepted tab. */
router.get('/accepted/:caseReference/client-details', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'accepted', 'client_details');
});

/* GET client details for a specific case from the accepted tab & scope tab. */
router.get('/accepted/:caseReference/scope', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'accepted', 'scope');
});

/* GET client details for a specific case from the accepted tab & financial_eligibility tab. */
router.get('/accepted/:caseReference/financial-eligibility', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'accepted', 'financial_eligibility');
});

/* GET client details for a specific case from the accepted tab & notes_and_history tab. */
router.get('/accepted/:caseReference/notes-and-history', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'accepted', 'notes_and_history');
});

/* GET your cases - closed tab. */
router.get('/closed', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'asc' ? 'asc' : 'desc';
  const page = parsePageNumber(req.query.page);
  const result = await loadCasesData('closed', sortOrder, page);

  res.render('cases/index', {
    activeTab: 'closed',
    casesData: result.data,
    sortOrder,
    pagination: result.meta
  });
});

/* GET client details for a specific case from the closed tab. */
router.get('/closed/:caseReference/client-details', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'closed', 'client_details');
});

/* GET client details for a specific case from the closed tab & scope tabs. */
router.get('/closed/:caseReference/scope', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'closed', 'scope');
});

/* GET client details for a specific case from the closed tab & financial_eligibility tabs. */
router.get('/closed/:caseReference/financial-eligibility', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'closed', 'financial_eligibility');
});

/* GET client details for a specific case from the closed tab & notes_and_history tabs. */
router.get('/closed/:caseReference/notes-and-history', function (req: Request, res: Response): void {
  handleClientDetails(req, res, 'closed', 'notes_and_history');
});

export default router;
