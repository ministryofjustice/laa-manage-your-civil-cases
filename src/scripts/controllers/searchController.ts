import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString, safeOptionalString } from '#src/scripts/helpers/index.js';

// Constants
const DEFAULT_SORT_BY = 'lastModified';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// Extend the Express session type to include our search parameters
declare module 'express-session' {
  interface SessionData {
    searchKeyword?: string;
    statusSelect?: string;
  }
}

/**
 * Renders the search page.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export function getSearch(req: Request, res: Response): void {
  // This function is not used anymore since processSearch handles all cases
  // Redirect to the search processor
  res.redirect('/search');
}

/**
 * Helper function to extract pagination and sort parameters
 * @param {Request} req - Express request object
 * @returns {{ sortOrder: string; sort: string; pageStr: string; limitStr: string; isPaginationOrSort: boolean }} Parameters object
 */
function getPaginationParameters(req: Request): { sortOrder: string; sort: string; pageStr: string; limitStr: string; isPaginationOrSort: boolean } {
  const sortOrder = safeString(req.query.sortOrder);
  const sort = safeString(req.query.sort);
  const pageStr = safeString(req.query.page);
  const limitStr = safeString(req.query.limit);
  const isPaginationOrSort = pageStr !== '' || sortOrder !== '' || sort !== '';

  return { sortOrder, sort, pageStr, limitStr, isPaginationOrSort };
}

/**
 * Helper function to get search parameters from session or query
 * @param {Request} req - Express request object
 * @returns {{ keyword: string; status: string }} Object with keyword and status
 */
function getSearchParameters(req: Request): { keyword: string; status: string } {
  // Extract all query parameters
  let keyword = safeString(req.query.searchKeyword);
  let status = safeString(req.query.statusSelect);
  const { isPaginationOrSort } = getPaginationParameters(req);

  // Default status to 'all' if no statusSelect parameter exists
  if (status === '' && req.query.statusSelect === undefined) {
    status = 'all';
  }

  // If explicit search parameters are provided, store them in session
  if (keyword !== '' || status !== 'all') {
    req.session.searchKeyword = keyword;
    req.session.statusSelect = status;
  }
  // If navigating pages without search params, use session values
  else if (isPaginationOrSort) {
    const sessionKeyword = safeOptionalString(req.session.searchKeyword);
    const sessionStatus = safeOptionalString(req.session.statusSelect);

    if (sessionKeyword !== undefined && sessionKeyword !== '') {
      keyword = sessionKeyword;
    }

    if (sessionStatus !== undefined && sessionStatus !== '') {
      status = sessionStatus;
    } else {
      status = 'all';
    }
  }

  return { keyword, status };
}

/**
 * Helper function to render empty search form
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
function renderEmptyForm(req: Request, res: Response): void {
  res.render('search/index.njk', {
    searchKeyword: '',
    statusSelect: 'all',
    searchPerformed: false,
    request: req
  });
}

/**
 * Helper function to render search results
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {object} params - Parameters object containing search data
 * @param {string} params.keyword - Search keyword
 * @param {string} params.status - Status filter
 * @param {string} params.sortOrder - Sort order
 * @param {object} params.apiResponse - API response data
 * @param {unknown} params.apiResponse.data - Search results data
 * @param {unknown} params.apiResponse.pagination - Pagination information
 */
function renderSearchResults(req: Request, res: Response, params: {
  keyword: string;
  status: string;
  sortOrder: string;
  apiResponse: { data?: unknown; pagination?: unknown };
}): void {
  const { keyword, status, sortOrder, apiResponse } = params;

  res.render('search/index.njk', {
    searchKeyword: keyword,
    statusSelect: status,
    searchResults: apiResponse.data,
    pagination: apiResponse.pagination,
    searchPerformed: true,
    sortBy: DEFAULT_SORT_BY,
    sortOrder,
    request: req
  });
}

/**
 * Processes the search request and renders the results.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Promise that resolves when the request is processed
 */
export async function processSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get search parameters from query or session
    const { keyword, status } = getSearchParameters(req);

    // Extract pagination and sort parameters
    const { sortOrder, sort, pageStr, limitStr, isPaginationOrSort } = getPaginationParameters(req);

    // Parse pagination values with defaults
    const page = pageStr !== '' ? parseInt(pageStr, 10) : DEFAULT_PAGE;
    const limit = limitStr !== '' ? parseInt(limitStr, 10) : DEFAULT_LIMIT;

    // Show empty form if no search or navigation activity
    if (keyword === '' && status === 'all' && !isPaginationOrSort) {
      renderEmptyForm(req, res);
      return;
    }

    // Determine final sort order (prefer sortOrder over sort)
    const finalSortOrder = sortOrder !== '' ? sortOrder : sort;

    // Call API and render results
    const response = await apiService.searchCases(req.axiosMiddleware, {
      keyword,
      status,
      sortOrder: finalSortOrder,
      page,
      limit
    });

    renderSearchResults(req, res, {
      keyword,
      status,
      sortOrder: finalSortOrder,
      apiResponse: response
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clears the search form and redirects back to the search page.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export function clearSearch(req: Request, res: Response): void {
  // Clear search parameters from session
  delete req.session.searchKeyword;
  delete req.session.statusSelect;

  // Redirect to empty search
  res.redirect('/search');
}
