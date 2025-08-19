import type { Request, Response } from 'express';
import { apiService } from '#src/services/apiService.js';

/**
 * Simple MSW test endpoint
 * This makes a downstream API call to verify MSW is intercepting
 */
export async function testMSW(req: Request, res: Response): Promise<void> {
  console.log('🧪 TEST-MSW: testMSW endpoint called');
  console.log(`🧪 TEST-MSW: NODE_ENV = "${process.env.NODE_ENV}"`);
  
  try {
    console.log('🧪 TEST-MSW: Making API call to MSW health endpoint...');
    
    // Make a simple API call that MSW should intercept
    const configuredAxios = req.axiosMiddleware;
    const response = await configuredAxios.axiosInstance.get('https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk/msw-health');
    
    console.log('🧪 TEST-MSW: API call completed, response:', response.data);
    
    const result = {
      success: true,
      mswResponse: response.data,
      message: 'MSW is working if you see the mock response above'
    };
    
    console.log('🧪 TEST-MSW: Sending success response:', result);
    res.json(result);
    
  } catch (error) {
    console.error('🧪 TEST-MSW: Error during API call:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResult = {
      success: false,
      error: errorMessage,
      message: 'MSW might not be intercepting requests'
    };
    
    console.log('🧪 TEST-MSW: Sending error response:', errorResult);
    res.status(500).json(errorResult);
  }
}
