import express from 'express';
import type { Request, Response } from 'express';
import { apiService } from '#src/services/apiService.js';
import type { CaseData } from '#types/case-types.js';
import { devLog, devError } from '#src/scripts/helpers/index.js';

// Create a new router for your-cases routes
const router = express.Router();

/**
 * Load cases data using the mock API service
 * This interface will remain the same when switching to real API
 * @param {string} caseType Type of case (new, accepted, opened, closed)
 * @param {string} sortOrder Sort order (asc/desc)
 * @returns {Promise<CaseData[]>} Case data
 */
async function loadCasesData(caseType: string, sortOrder = 'asc'): Promise<CaseData[]> {
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
      return [];
    }

    // Validate sort order
    const validSortOrder: 'asc' | 'desc' = sortOrder === 'desc' ? 'desc' : 'asc';

    // Use API service (currently mock, will be real API in future)
    const response = await apiService.getCases({
      caseType,
      sortOrder: validSortOrder,
      sortBy: 'dateReceived'
    });

    if (response.status === 'error') {
      devError(`API error loading ${caseType} cases: ${response.message ?? 'Unknown error'}`);
      return [];
    }

    devLog(`Successfully loaded ${response.data.length} ${caseType} cases via API service`);
    return response.data;
  } catch (error) {
    devError(`Error loading ${caseType} cases: ${String(error)}`);
    return [];
  }
}


/* GET your cases - new tab. */
router.get('/new', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const casesData = await loadCasesData('new', sortOrder);
  res.render('cases/index', {
    activeTab: 'new',
    casesData,
    sortOrder
  });
});

/* GET your cases - opened tab. */
router.get('/opened', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const casesData = await loadCasesData('opened', sortOrder);
  res.render('cases/index', {
    activeTab: 'opened',
    casesData,
    sortOrder
  });
});

/* GET your cases - accepted tab. */
router.get('/accepted', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const casesData = await loadCasesData('accepted', sortOrder);
  res.render('cases/index', {
    activeTab: 'accepted',
    casesData,
    sortOrder
  });
});

/* GET your cases - closed tab. */
router.get('/closed', async function (req: Request, res: Response): Promise<void> {
  const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
  const casesData = await loadCasesData('closed', sortOrder);
  res.render('cases/index', {
    activeTab: 'closed',
    casesData,
    sortOrder
  });
});

export default router;
