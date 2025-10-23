import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { apiService } from '#src/services/apiService.js';
import { safeString, safeOptionalString, hasProperty } from '#src/scripts/helpers/index.js';
import { validationResult } from 'express-validator';
import { formatValidationError, type ValidationErrorData } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { storeSessionData, getSessionData, clearSessionData } from '#src/scripts/helpers/sessionHelpers.js';

// Constants
const DEFAULT_SORT_BY = 'modified';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 4;
const BAD_REQUEST = 400;

/**
 * Helper function to extract pagination and sort parameters
 * @param {Request} req - Express request object
 * @returns {{ sortOrder: string; sort: string; pageStr: string; limitStr: string; isPaginationOrSort: boolean }} Parameters object
 */
function getPaginationParameters(req: Request): { sortOrder: string; sortBy: string; pageStr: string; limitStr: string; isPaginationOrSort: boolean; } {
  let sortOrder = safeString(req.query.sortOrder);
  let sortBy = safeString(req.query.sort);
  const pageStr = safeString(req.query.page);
  const limitStr = safeString(req.query.limit);

  // Parse ordering parameter (e.g., 'modified' for asc, '-modified' for desc)
  const ordering = safeString(req.query.ordering);
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

  const isPaginationOrSort = pageStr !== '' || limitStr !== '' || sortBy !== '' || sortOrder !== '' || ordering !== '';

  return { sortOrder, sortBy, pageStr, limitStr, isPaginationOrSort };
}

/**
 * Helper function to extract search parameters from request
 * @param {Request} req - Express request object
 * @returns {{ keyword: string; status: string }} Raw parameters from body or query
 */
function extractRawSearchParameters(req: Request): { keyword: string; status: string } {
  const bodyKeyword = hasProperty(req.body, 'searchKeyword') ? safeString(req.body.searchKeyword) : '';
  const queryKeyword = safeString(req.query.searchKeyword);
  const bodyStatus = hasProperty(req.body, 'statusSelect') ? safeString(req.body.statusSelect) : '';
  const queryStatus = safeString(req.query.statusSelect);

  const keyword = bodyKeyword !== '' ? bodyKeyword : queryKeyword;
  const status = bodyStatus !== '' ? bodyStatus : queryStatus;

  return { keyword, status };
}

/**
 * Helper function to handle session-based parameter retrieval
 * @param {Request} req - Express request object
 * @param {boolean} isPaginationOrSort - Whether this is a pagination/sort request
 * @returns {{ keyword: string; status: string }} Parameters from session
 */
function getSessionParameters(req: Request, isPaginationOrSort: boolean): { keyword: string; status: string } {
  if (!isPaginationOrSort) {
    return { keyword: '', status: '' };
  }

  const sessionData = getSessionData(req, 'search');
  if (sessionData === null) {
    return { keyword: '', status: 'all' };
  }

  const sessionKeyword = safeOptionalString(sessionData.searchKeyword);
  const sessionStatus = safeOptionalString(sessionData.statusSelect);

  const keyword = (sessionKeyword !== undefined && sessionKeyword !== '') ? sessionKeyword : '';
  const status = (sessionStatus !== undefined && sessionStatus !== '') ? sessionStatus : 'all';

  return { keyword, status };
}

/**
 * Helper function to get search parameters from session or query
 * @param {Request} req - Express request object
 * @returns {{ keyword: string; status: string }} Object with keyword and status
 */
function getSearchParameters(req: Request): { keyword: string; status: string } {
  let { keyword, status } = extractRawSearchParameters(req);
  const { isPaginationOrSort } = getPaginationParameters(req);

  // Default status to 'all' if no statusSelect parameter exists
  const hasBodyStatus = hasProperty(req.body, 'statusSelect');
  const hasQueryStatus = req.query.statusSelect !== undefined;
  if (status === '' && !hasBodyStatus && !hasQueryStatus) {
    status = 'all';
  }

  // If explicit search parameters are provided, store them in session
  if (keyword !== '' || status !== 'all') {
    storeSessionData(req, 'search', { searchKeyword: keyword, statusSelect: status });
  }
  // If navigating pages without search params, use session values
  else {
    const sessionParams = getSessionParameters(req, isPaginationOrSort);
    ({ keyword, status } = sessionParams);
    // Default status to 'all' if session doesn't have it
    if (status === '') {
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
 * @param {string} params.sortBy - Sort by field
 * @param {object} params.apiResponse - API response data
 * @param {unknown} params.apiResponse.data - Search results data
 * @param {unknown} params.apiResponse.pagination - Pagination information
 */
function renderSearchResults(req: Request, res: Response, params: {
  keyword: string;
  status: string;
  sortOrder: string;
  sortBy: string;
  apiResponse: { data?: unknown; pagination?: unknown };
}): void {
  const { keyword, status, sortOrder, apiResponse, sortBy } = params;

  res.render('search/index.njk', {
    searchKeyword: keyword,
    statusSelect: status,
    searchResults: apiResponse.data,
    pagination: apiResponse.pagination,
    searchPerformed: true,
    sortBy,
    sortOrder,
    request: req
  });
}

/**
 * Validation and error handling for the Search form, which renders the error view if any exist
 * @param {Request} req - The Express request object containing form data and validation results
 * @param {Response} res - The Express response object used to render the error view
 * @returns {boolean} Returns `true` if validation errors were found with error response for the view, otherwise `false`
 */
function handleValidationErrors(req: Request, res: Response): boolean {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const formattedErrors = validationErrors.formatWith(formatValidationError);
    const errorArray = formattedErrors.array();

    const inputErrors = errorArray.reduce<Record<string, string>>((acc, validationErrorData: ValidationErrorData) => {
      const fieldName = 'searchKeyword';
      const { inlineMessage } = validationErrorData;
      if (inlineMessage.trim() !== '') {
        acc[fieldName] = inlineMessage;
      }
      return acc;
    }, {});

    const errorSummaryList = errorArray.map((validationErrorData: ValidationErrorData) => ({
      text: validationErrorData.summaryMessage,
      href: '#searchKeyword',
    }));

    const { keyword, status } = getSearchParameters(req);

    res.status(BAD_REQUEST).render('search/index.njk', {
      searchKeyword: keyword,
      statusSelect: status,
      searchPerformed: false,
      error: { inputErrors, errorSummaryList },
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
      request: req
    });
    return true;
  }
  return false;
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
    // Handle validation errors first
    if (handleValidationErrors(req, res)) return;

    // Get search parameters from query or session
    const { keyword, status } = getSearchParameters(req);

    // Extract pagination and sort parameters
    const { sortOrder, sortBy, pageStr, limitStr, isPaginationOrSort } = getPaginationParameters(req);

    // Show empty form if no search or navigation activity
    if (keyword === '' && status === 'all' && !isPaginationOrSort) {
      renderEmptyForm(req, res);
      return;
    }

    // Parse pagination values with defaults
    const page = pageStr !== '' ? parseInt(pageStr, 10) : DEFAULT_PAGE;
    const pageSize = limitStr !== '' ? parseInt(limitStr, 10) : DEFAULT_LIMIT;

    // Determine final sort order (prefer sortOrder over sort)
    const finalSortBy = sortBy !== '' ? sortBy : DEFAULT_SORT_BY;
    const finalSortOrder = sortOrder !== '' ? sortOrder : 'desc';

    // Call API and render results
    const response = await apiService.searchCases(req.axiosMiddleware, {
      keyword,
      status,
      sortBy: finalSortBy,
      sortOrder: finalSortOrder,
      page,
      pageSize
    });

    renderSearchResults(req, res, {
      keyword,
      status,
      sortBy: finalSortBy,
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
  clearSessionData(req, 'search');

  // Redirect to empty search
  res.redirect('/search');
}
