#!/bin/bash

# E2E Route Coverage Analysis Script
# This script runs Playwright tests, extracts visited routes, compares with Express routes,
# and shows coverage with color coding

set -e

# Parse command line arguments
SKIP_TESTS=false
if [[ "$1" == "--skip-tests" ]]; then
    SKIP_TESTS=true
    echo "⚠️  Skipping Playwright tests - will only analyze Express routes"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# List of temporary files to clean up
TEMP_FILES=(
    "playwright-debug.log"
    "express-routes.txt"
    "tested-routes.txt"
    "express-routes-sorted.txt"
    "tested-routes-normalized.txt"
)

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
    for file in "${TEMP_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            echo "  ✓ Removed $file"
        fi
    done
}

# Set trap to cleanup on script exit (success, error, or interrupt)
trap cleanup EXIT

echo -e "${BLUE}🚀 Starting E2E Route Coverage Analysis${NC}"
echo "========================================"

# Step 1: Run Playwright tests with debug logging (unless skipped)
if [[ "$SKIP_TESTS" == "true" ]]; then
    echo -e "${YELLOW}⏭️  Skipping Playwright tests...${NC}"
    # Create empty files for the rest of the script
    touch playwright-debug.log
    touch tested-routes.txt
else
    echo -e "${YELLOW}📝 Running Playwright tests with debug logging...${NC}"
    if DEBUG=pw:api yarn test:e2e --reporter=line > playwright-debug.log 2>&1; then
        echo -e "${GREEN}✓ Tests completed${NC}"
    else
        echo -e "${RED}✗ Playwright tests failed${NC}"
        echo -e "${YELLOW}💡 Run with --skip-tests to analyze routes without running tests${NC}"
        echo -e "${YELLOW}📋 Error details in playwright-debug.log:${NC}"
        tail -10 playwright-debug.log
        exit 1
    fi
fi

# Step 2: Extract all Express routes
echo -e "${YELLOW}🔍 Extracting Express routes...${NC}"
node "$(dirname "$0")/listRoutes.js" 2>/dev/null | grep -E "^[0-9]+\." | sed 's/^[0-9]*\. //' > express-routes.txt
echo -e "${GREEN}✓ Express routes extracted to express-routes.txt${NC}"

# Step 3: Extract tested routes from Playwright log
echo -e "${YELLOW}🧪 Extracting tested routes from Playwright log...${NC}"
if [[ "$SKIP_TESTS" == "true" ]]; then
    echo -e "${YELLOW}⚠️  No tests were run, creating empty tested-routes.txt${NC}"
    touch tested-routes.txt
else
    if [[ -f "playwright-debug.log" && -s "playwright-debug.log" ]]; then
        "$(dirname "$0")/extract-urls.sh" playwright-debug.log | grep "^GET " | sort > tested-routes.txt
        echo -e "${GREEN}✓ Tested routes extracted to tested-routes.txt${NC}"
    else
        echo -e "${YELLOW}⚠️  No Playwright log found or empty, creating empty tested-routes.txt${NC}"
        touch tested-routes.txt
    fi
fi

# Step 4: Create temporary files for comparison
echo -e "${YELLOW}📊 Analyzing route coverage...${NC}"

# Extract just the route paths from Express routes and sort
cat express-routes.txt | sort > express-routes-sorted.txt

# Normalize tested routes to use parameter patterns (convert concrete values to :param format)
cat tested-routes.txt | \
    sed 's|/cases/[^/]*/|/:caseReference/|g' | \
    sort > tested-routes-normalized.txt

# Initialize counters
total_routes=0
covered_routes=0
uncovered_routes=0

# Arrays to store routes
declare -a covered_list
declare -a uncovered_list

# Read all Express routes and check coverage
while IFS= read -r route; do
    if [[ -n "$route" && "$route" =~ ^(GET|POST|PUT|DELETE|PATCH) ]]; then
        total_routes=$((total_routes + 1))
        
        # Check if this exact route is in the normalized tested routes
        if grep -Fxq "$route" tested-routes-normalized.txt; then
            covered_routes=$((covered_routes + 1))
            covered_list+=("$route")
        else
            uncovered_routes=$((uncovered_routes + 1))
            uncovered_list+=("$route")
        fi
    fi
done < express-routes-sorted.txt

echo ""
echo -e "${BLUE}📊 COVERAGE SUMMARY${NC}"
echo "=================="
echo -e "Total Express routes: ${BLUE}$total_routes${NC}"
echo -e "Routes with tests: ${GREEN}$covered_routes${NC}"
echo -e "Routes without tests: ${RED}$uncovered_routes${NC}"

if [ $total_routes -gt 0 ]; then
    coverage_percentage=$(( (covered_routes * 100) / total_routes ))
    echo -e "Coverage percentage: ${YELLOW}${coverage_percentage}%${NC}"
fi

echo ""
echo -e "${BLUE}🧪 TESTED ROUTES (normalized)${NC}"
echo "============================="
while IFS= read -r route; do
    if [[ -n "$route" ]]; then
        echo -e "${GREEN}$route${NC}"
    fi
done < tested-routes-normalized.txt

if [ $uncovered_routes -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  ROUTES WITHOUT E2E TESTS${NC}"
    echo "============================"
    for route in "${uncovered_list[@]}"; do
        echo -e "${RED}• $route${NC}"
    done
    
    echo ""
    echo -e "${YELLOW}💡 Suggestions:${NC}"
    echo "• Create E2E tests for the routes listed in red above"
    echo "• Consider if some routes are internal/admin only and don't need E2E tests"
    echo "• Update existing tests to cover more route variations"
fi

echo ""
echo -e "${BLUE}📁 Generated Files (will be cleaned up):${NC}"
echo "• playwright-debug.log - Full Playwright debug output"
echo "• express-routes.txt - All Express routes"
echo "• tested-routes.txt - Routes visited during E2E tests"

echo ""
echo -e "${GREEN}✅ Route coverage analysis complete!${NC}"
