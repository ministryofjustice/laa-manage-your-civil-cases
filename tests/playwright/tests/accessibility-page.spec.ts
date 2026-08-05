import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js';

test('help page has correct title header', async ({ page, i18nSetup }) => {
    // Navigate to homepage
    await page.goto('/help');

    // Check for the title fo the application
    await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('help page should display LAA header', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/help');

  const header = page.getByRole('banner');

  // Check for the header with LAA branding
  await expect(header).toBeVisible();
});

test('help page should display phase banner with hello content', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/help');

  // Target the phase banner
  const phaseBanner = page.locator('.govuk-phase-banner');

  // Check if the phase banner is visible
  await expect(phaseBanner).toBeVisible();

  // Check if feedback link text is in the phase banner
  await expect(phaseBanner).toContainText(t('components.phaseBanner.feedbackText'));
});

test('footer is visible with expected links', async ({ page }) => {  
  await page.goto('/help');

  const footer = page.locator('.govuk-footer');
  await expect(footer).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Cookies' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Accessibility' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Terms and conditions' })).toBeVisible();
});

const visitUrl = '/accessibility';
test('help page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

   // Check nav bar exists
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toBeVisible();

   // Check service name is visible in the navigation section of the screen
  await expect(nav).toContainText('Manage your civil cases');

  // Check the links are not in the nav bar
  await expect(page.getByRole('link', { name: 'Your cases' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Search' })).toHaveCount(0);

  // Check for the heading of the help page
  await expect(page.getByRole('heading', { level: 1, name: t('pages.accessibility.heading') })).toBeVisible();

   // Verify the text of the heading of the accessibility page
  const accessibilityHeading = page.locator('#accessibility-heading');
  await expect(accessibilityHeading).toHaveText('Accessibility statement');

   // Verify the text for the accessibility intro
  const accessibilityIntro = page.locator('#accessibility-intro');
  await expect(accessibilityIntro).toHaveText("This accessibility statement applies to the 'Manage your civil cases' service.");

  // Verify the text for the accessibility service statement
  const serviceStatement = page.locator('#service-statement');
  await expect(serviceStatement).toHaveText("This service is run by the Legal Aid Agency. We want as many people\nas possible to be able to use this service. For example, that means you should be\nable to:");

  // check example section is present 
  const accessibilityExamples = page.locator('#examples');
  await expect(accessibilityExamples).toBeVisible();

  // Check a list is present within the examples section
  const exampleItems = accessibilityExamples.locator('li');
  const itemCount = await exampleItems.count();
  
  // Verify there are 4 example items
  expect(itemCount).toBe(4);

  // Verify the text of each example item
  expect(await exampleItems.nth(0).innerText()).toBe(t('change colours, contrast levels and fonts using browser or device settings'));
  expect(await exampleItems.nth(1).innerText()).toBe(t('zoom in up to 400% without the text spilling off the screen'));
  expect(await exampleItems.nth(2).innerText()).toBe(t('navigate most of the service using a keyboard or speech recognition\nsoftware'));
  expect(await exampleItems.nth(3).innerText()).toBe(t('listen to most of the service using a screen reader (including the most\nrecent versions of JAWS, NVDA and VoiceOver)'));

  // Verify the text at the end of the accessibility service statement
  const statementEnd = page.locator('#statement-end');
  const abilityNetInfo = page.locator('#ability-net-info');
  await expect(statementEnd).toHaveText("We've also made the service text as simple as possible to understand.");
  await expect(abilityNetInfo).toHaveText("AbilityNet has advice on making your device easier to use if you have a\ndisability.");

  // Check the how accessible subheading on the accessible page
  await expect(page.getByRole('heading', { level: 2, name: t('pages.accessibility.service.howAccessibleSubheading') })).toBeVisible();
  
  // Verify the text for the how accessible subheading
  const howAccessibleSubheading = page.locator('#how-accessible-subheading');
  await expect(howAccessibleSubheading).toHaveText('How accessible this service is');

  // Verify the text for the how accessible info
  const howAccessibleInfo = page.locator('#how-accessible-info');
  await expect(howAccessibleInfo).toHaveText('This service is fully compliant with Web Content Accessibility\nGuidelines (WCAG) V2.2 Level A and Level AA.');

  // Check for the feedback subheading
  await expect(page.getByRole('heading', { level: 2, name: t('pages.accessibility.feedback.subheading') }));

  // Verify the text for the feedback subheading
  const feedbackSubheading = page.locator('#feedback-subheading');
  await expect(feedbackSubheading).toHaveText('Feedback and contact information');

  // Verify the text for the feedback info
  const feedbackInfo = page.locator('#feedback-info');
  await expect(feedbackInfo).toHaveText('If you find any problems not listed on this page, or think we’re not meeting\naccessibility requirements, contact us at MCC.LAADigital@justice.gov.uk.');

  // Check for the enforcement subheading
  await expect(page.getByRole('heading', { level: 2, name: t('pages.accessibility.enforcement.subheading') }));

  // Verify the text for the enforcement subheading
  const enforcementSubheading = page.locator('#enforcement-subheading');
  await expect(enforcementSubheading).toHaveText('Enforcement procedure');

  // Verify the text for the enforcement info
  const enforcementInfo = page.locator('#enforcement-info');
  await expect(enforcementInfo).toHaveText('The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 (the ‘accessibility regulations’). If you’re not happy with how we respond to your complaint, contact the Equality Advisory and Support Service (EASS).');

  // Check for the technical info subheading
  await expect(page.getByRole('heading', { level: 2, name: t('pages.accessibility.technicalInfo.subheading') }));

  // Verify the text for the technical info subheading
  const technicalInfoSubheading = page.locator('#technical-info-subheading');
  await expect(technicalInfoSubheading).toHaveText('Technical information about this service’s accessibility');

  // Verify the text for the technical info
  const technicalInfo = page.locator('#technical-info');
  await expect(technicalInfo).toHaveText('The Legal Aid Agency is committed to making its services accessible, in accordance with the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.');

  // Check for the compliance subheading
  await expect(page.getByRole('heading', { level: 2, name: t('pages.accessibility.compliance.subheading') }));

  // Verify the text for the compliance subheading
  const complianceInfoSubheading = page.locator('#compliance-info-subheading');
  await expect(complianceInfoSubheading).toHaveText('Compliance status');

  // Verify the text for the compliance info
  const complianceInfo = page.locator('#compliance-info');
  await expect(complianceInfo).toHaveText('This service is fully compliant with the Web Content Accessibility Guidelines version 2.2 Level A and AA standard.');

  // Check the preparation info subheading
  await expect(page.getByRole('heading', { level: 2, name: t('pages.accessibility.preparation.subheading') }));

  // Verify the text for the preparation info subheading
  const preparationInfoSubheading = page.locator('#preparation-info-subheading');
  await expect(preparationInfoSubheading).toHaveText('Preparation of this accessibility statement');

  // Verify the text for the preparation info
  const preparationInfo = page.locator('#preparation-info');
  await expect(preparationInfo).toHaveText('This statement was prepared on [date when it was first published]. It was last reviewed on [date when it was last reviewed].');

  // Verify the text for the service preparation info
  const servicePreparationInfo = page.locator('#service-preparation-info');
  await expect(servicePreparationInfo).toHaveText('This service was last tested on [date] against the WCAG 2.2 AA standard. The test was carried out by our internal testing team.');

   // Verify the text for the temporary text
  const temporaryText = page.locator('#temporary-text');
  await expect(temporaryText).toHaveText('[Add below text after full external audit is done, to replace the 2 sentences above]');

  // Verify the text for the external audit info
  const externalAuditInfo = page.locator('#external-audit-info');
  await expect(externalAuditInfo).toHaveText('This service was last tested on [audit date]. The test was carried out by UserVision.');
});

test('AbilityNet link goes to AbilityNet site', async ({ page }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

  // Check link to AbilityNet works
  const link = page.locator('a[href="https://mcmw.abilitynet.org.uk/"]');
  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(/mcmw\.abilitynet\.org\.uk/), link.click(),]);
  await expect(page).toHaveURL(/mcmw\.abilitynet\.org\.uk/);
});

test('accessibility guidelines link goes to W3 site', async ({ page }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

  // Check link to accessibility guidelines works
  const link = page.locator('#how-accessible-link');
  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(/www\.w3\.org/), link.click(),]);
  await expect(page).toHaveURL(/www\.w3\.org/);
});

test('enforcment link goes to equality advisory service site', async ({ page }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

  // Check link to eqaulity advisory service works
  const link = page.locator('a[href="https://www.equalityadvisoryservice.com/"]');
  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(/www\.equalityadvisoryservice\.com/), link.click(),]);
  await expect(page).toHaveURL(/www\.equalityadvisoryservice\.com/);
});

test('compliance link goes to W3 site', async ({ page }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

  // Check link to accessibility guidelines works
  const link = page.locator('#compliance-link');
  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(/www\.w3\.org/), link.click(),]);
  await expect(page).toHaveURL(/www\.w3\.org/);
});

test('external audit link goes to user vision site', async ({ page }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

  // Check link to eqaulity advisory service works
  const link = page.locator('a[href="https://uservision.co.uk/"]');
  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(/uservision\.co\.uk/), link.click(),]);
  await expect(page).toHaveURL(/uservision\.co\.uk/);
});

test('nav links are hidden on accessibility page when logged in', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');
  // navigate like a real user to accessibility page
  await page.getByRole('link', { name: 'Accessibility' }).click();

  // assert we are on accessibility page
  await expect(page).toHaveURL(/accessibility/);

  // Check nav bar exists
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toBeVisible();

  // Check service name is visible in the navigation section of the screen
  await expect(nav).toContainText('Manage your civil cases');

  // Check the links are not in the nav bar
  await expect(page.getByRole('link', { name: 'Your cases' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Search' })).toHaveCount(0);
});

test('accessibility page can be accessed after signing out', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');

  // Sign out
  await page.getByRole('link', { name: 'Sign out' }).click();

  // Navigate to accessibility page
  await page.goto('/accessibility');

  // Verify user is on the accessibility page
  await expect(page).toHaveURL(/accessibility/);

  // Verify the accessibility page heading is displayed
  await expect(page.getByRole('heading', { level: 1, name: t('pages.accessibility.heading') })).toBeVisible();
});
